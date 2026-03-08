/**
 * Dossier Bridge
 * Interface between Dossier UI and platform orchestration
 */

import { BaseBridge } from './base/BaseBridge.js';
import {
  BaseBridgeConfig,
  BridgeEvent,
  BridgeResult,
  HealthStatus,
  StreamConfig
} from './types/common.js';

// Dossier-specific types
export interface DossierConfig extends BaseBridgeConfig {
  dossierApi: {
    baseUrl: string;
    apiKey: string;
    version: string;
  };
  ui: {
    webSocketUrl: string;
    theme: 'light' | 'dark' | 'auto';
    refreshInterval: number;
  };
  orchestration: {
    maxConcurrentTasks: number;
    taskTimeout: number;
    priorityLevels: string[];
  };
}

export interface DossierTask {
  id: string;
  type: 'investigation' | 'analysis' | 'workflow' | 'report';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  assignedTo?: string;
  estimatedDuration?: number;
  actualDuration?: number;
  dependencies?: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface DossierWorkflow {
  id: string;
  name: string;
  description: string;
  steps: DossierWorkflowStep[];
  variables: Record<string, any>;
  status: 'draft' | 'active' | 'paused' | 'completed' | 'failed';
  createdBy: string;
  version: string;
  tags: string[];
}

export interface DossierWorkflowStep {
  id: string;
  name: string;
  type: 'manual' | 'automated' | 'approval' | 'condition';
  config: Record<string, any>;
  inputMapping: Record<string, string>;
  outputMapping: Record<string, string>;
  timeout?: number;
  retryPolicy?: {
    maxAttempts: number;
    backoffMultiplier: number;
  };
}

export interface UIComponentState {
  componentId: string;
  state: Record<string, any>;
  lastUpdated: Date;
  version: number;
}

export interface OrchestrationEvent extends BridgeEvent {
  data: {
    taskId?: string;
    workflowId?: string;
    action: 'created' | 'updated' | 'completed' | 'failed' | 'cancelled';
    payload: any;
  };
}

export class DossierBridge extends BaseBridge {
  protected config: DossierConfig;
  private webSocket?: WebSocket;
  private uiStates: Map<string, UIComponentState> = new Map();
  private activeTasks: Map<string, DossierTask> = new Map();
  private activeWorkflows: Map<string, DossierWorkflow> = new Map();

  constructor(config: DossierConfig) {
    super(config);
    this.config = config;
  }

  // Connection management
  public async connect(): Promise<void> {
    try {
      // Initialize HTTP API connection
      await this.initializeHTTPConnection();

      // Initialize WebSocket connection to Dossier UI
      await this.initializeWebSocketConnection();

      // Initialize orchestration platform connection
      await this.initializeOrchestration();

      // Set up streaming integration
      await this.setupStreamingIntegration();

      this.emit('connected');
      console.log('Dossier Bridge connected');
    } catch (error) {
      throw this.createDossierError('CONNECTION_FAILED', 'Failed to connect to Dossier platform', error);
    }
  }

  private async initializeHTTPConnection(): Promise<void> {
    // Test HTTP API connectivity
    try {
      const response = await fetch(`${this.config.dossierApi.baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.dossierApi.apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('Dossier HTTP API connection established');
    } catch (error) {
      throw new Error(`Failed to establish HTTP connection: ${error}`);
    }
  }

  private async initializeWebSocketConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.webSocket = new WebSocket(this.config.ui.webSocketUrl);

        const connectionTimeout = setTimeout(() => {
          this.webSocket?.close();
          reject(new Error('WebSocket connection timeout'));
        }, 10000);

        this.webSocket.onopen = () => {
          clearTimeout(connectionTimeout);
          this.setupWebSocketHandlers();
          resolve();
        };

        this.webSocket.onerror = (error) => {
          clearTimeout(connectionTimeout);
          reject(error);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  private setupWebSocketHandlers(): void {
    if (!this.webSocket) return;

    this.webSocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleUIMessage(message);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.webSocket.onclose = (event) => {
      this.emit('disconnected', { code: event.code, reason: event.reason });
      if (!event.wasClean) {
        this.attemptReconnection();
      }
    };

    this.webSocket.onerror = (error) => {
      this.emit('error', error);
    };

    // Send initial handshake
    this.sendWebSocketMessage({
      type: 'handshake',
      bridge: 'dossier',
      timestamp: new Date().toISOString()
    });
  }

  private sendWebSocketMessage(message: any): void {
    if (this.webSocket && this.webSocket.readyState === WebSocket.OPEN) {
      this.webSocket.send(JSON.stringify(message));
    }
  }

  public async disconnect(): Promise<void> {
    if (this.webSocket) {
      this.webSocket.close();
      delete (this as any).webSocket;
    }

    // TODO: Cleanup orchestration connections
    this.emit('disconnected');
  }

  public isConnected(): boolean {
    return this.webSocket?.readyState === WebSocket.OPEN;
  }

  public async performHealthCheck(): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      // TODO: Implement health check logic
      const uiHealth = await this.checkUIHealth();
      const orchestrationHealth = await this.checkOrchestrationHealth();

      const responseTime = Date.now() - startTime;

      const overallStatus = uiHealth && orchestrationHealth ? 'healthy' : 'degraded';

      return {
        status: overallStatus,
        lastCheck: new Date(),
        details: {
          ui: uiHealth,
          orchestration: orchestrationHealth
        },
        metrics: {
          responseTime,
          errorRate: this.calculateErrorRate(),
          throughput: this.calculateThroughput()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        lastCheck: new Date(),
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  // Task management operations
  public async createTask(task: Omit<DossierTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<BridgeResult<DossierTask>> {
    return this.executeWithRetry(async () => {
      // TODO: Implement task creation logic
      const newTask: DossierTask = {
        ...task,
        id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.activeTasks.set(newTask.id, newTask);

      // Emit event to UI
      await this.publishEvent<DossierTask>({
        id: `task_created_${newTask.id}`,
        type: 'task.created',
        source: 'dossier-bridge',
        timestamp: new Date(),
        data: newTask
      });

      return newTask;
    });
  }

  public async updateTask(taskId: string, updates: Partial<DossierTask>): Promise<BridgeResult<DossierTask>> {
    return this.executeWithRetry(async () => {
      const existingTask = this.activeTasks.get(taskId);
      if (!existingTask) {
        throw this.createDossierError('TASK_NOT_FOUND', `Task ${taskId} not found`);
      }

      const updatedTask = {
        ...existingTask,
        ...updates,
        updatedAt: new Date()
      };

      this.activeTasks.set(taskId, updatedTask);

      // TODO: Sync with orchestration platform

      await this.publishEvent<DossierTask>({
        id: `task_updated_${taskId}`,
        type: 'task.updated',
        source: 'dossier-bridge',
        timestamp: new Date(),
        data: updatedTask
      });

      return updatedTask;
    });
  }

  public async getTask(taskId: string): Promise<BridgeResult<DossierTask>> {
    return this.executeWithRetry(async () => {
      const task = this.activeTasks.get(taskId);
      if (!task) {
        throw this.createDossierError('TASK_NOT_FOUND', `Task ${taskId} not found`);
      }
      return task;
    });
  }

  public async listTasks(filters?: {
    status?: DossierTask['status'];
    priority?: DossierTask['priority'];
    assignedTo?: string;
  }): Promise<BridgeResult<DossierTask[]>> {
    return this.executeWithRetry(async () => {
      let tasks = Array.from(this.activeTasks.values());

      if (filters) {
        if (filters.status) {
          tasks = tasks.filter(task => task.status === filters.status);
        }
        if (filters.priority) {
          tasks = tasks.filter(task => task.priority === filters.priority);
        }
        if (filters.assignedTo) {
          tasks = tasks.filter(task => task.assignedTo === filters.assignedTo);
        }
      }

      return tasks;
    });
  }

  // Workflow management operations
  public async createWorkflow(workflow: Omit<DossierWorkflow, 'id'>): Promise<BridgeResult<DossierWorkflow>> {
    return this.executeWithRetry(async () => {
      // TODO: Implement workflow creation logic
      const newWorkflow: DossierWorkflow = {
        ...workflow,
        id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      this.activeWorkflows.set(newWorkflow.id, newWorkflow);

      await this.publishEvent<DossierWorkflow>({
        id: `workflow_created_${newWorkflow.id}`,
        type: 'workflow.created',
        source: 'dossier-bridge',
        timestamp: new Date(),
        data: newWorkflow
      });

      return newWorkflow;
    });
  }

  public async executeWorkflow(workflowId: string, variables?: Record<string, any>): Promise<BridgeResult<string>> {
    return this.executeWithRetry(async () => {
      const workflow = this.activeWorkflows.get(workflowId);
      if (!workflow) {
        throw this.createDossierError('WORKFLOW_NOT_FOUND', `Workflow ${workflowId} not found`);
      }

      // TODO: Implement workflow execution logic
      const executionId = `exec_${workflowId}_${Date.now()}`;

      await this.publishEvent<{ workflowId: string; executionId: string; variables?: Record<string, any> }>({
        id: `workflow_started_${executionId}`,
        type: 'workflow.execution.started',
        source: 'dossier-bridge',
        timestamp: new Date(),
        data: {
          workflowId,
          executionId,
          ...(variables && { variables })
        }
      });

      return executionId;
    });
  }

  // UI state management
  public async updateUIState(componentId: string, state: Record<string, any>): Promise<BridgeResult<void>> {
    return this.executeWithRetry(async () => {
      const existingState = this.uiStates.get(componentId);
      const version = existingState ? existingState.version + 1 : 1;

      const newState: UIComponentState = {
        componentId,
        state,
        lastUpdated: new Date(),
        version
      };

      this.uiStates.set(componentId, newState);

      // Send to UI via WebSocket
      if (this.webSocket && this.isConnected()) {
        this.webSocket.send(JSON.stringify({
          type: 'ui.state.update',
          data: newState
        }));
      }
    });
  }

  public async getUIState(componentId: string): Promise<BridgeResult<UIComponentState | undefined>> {
    return this.executeWithRetry(async () => {
      return this.uiStates.get(componentId);
    });
  }

  // Private helper methods
  private async initializeOrchestration(): Promise<void> {
    // Register with WorkflowOrchestrator
    try {
      const registrationPayload = {
        bridgeType: 'dossier',
        capabilities: ['ui-coordination', 'task-visualization', 'real-time-updates'],
        endpoints: {
          http: this.config.dossierApi.baseUrl,
          websocket: this.config.ui.webSocketUrl
        }
      };

      // This would typically call the WorkflowOrchestrator registration endpoint
      console.log('Registered Dossier bridge with orchestrator:', registrationPayload);
    } catch (error) {
      console.error('Failed to register with orchestrator:', error);
      throw error;
    }
  }

  private async setupStreamingIntegration(): Promise<void> {
    // Set up event forwarding to StreamingManager
    this.on('ui-message', (message) => {
      this.emit('stream-event', {
        component: 'dossier',
        type: message.type || 'ui-interaction',
        data: message,
        timestamp: new Date()
      });
    });

    // Subscribe to external events that should be forwarded to UI
    this.subscribe(['workflow.*', 'task.*', 'evidence.*'], async (event) => {
      await this.forwardEventToUI(event);
    });
  }

  private async forwardEventToUI(event: any): Promise<void> {
    const uiMessage = {
      type: 'workflow-update',
      eventType: event.type,
      data: event.data,
      timestamp: event.timestamp
    };

    this.sendWebSocketMessage(uiMessage);

    // Also update UI components based on event type
    if (event.type.startsWith('task.')) {
      await this.updateTaskVisualization(event.data);
    } else if (event.type.startsWith('evidence.')) {
      await this.updateEvidenceDisplay(event.data);
    }
  }

  private async updateTaskVisualization(taskData: any): Promise<void> {
    const componentId = `task-${taskData.taskId || taskData.id}`;
    const visualState = {
      status: taskData.status,
      progress: taskData.progress || 0,
      assignedAgent: taskData.assignedAgent,
      lastUpdate: new Date().toISOString()
    };

    await this.updateUIState(componentId, visualState);
  }

  private async updateEvidenceDisplay(evidenceData: any): Promise<void> {
    const componentId = `evidence-${evidenceData.investigationId || 'global'}`;
    const evidenceState = {
      evidenceCount: evidenceData.evidenceCount || 0,
      confidenceScore: evidenceData.confidenceScore || 0,
      lastEvidence: evidenceData.evidence || null,
      timestamp: new Date().toISOString()
    };

    await this.updateUIState(componentId, evidenceState);
  }

  private async checkUIHealth(): Promise<boolean> {
    try {
      // Check WebSocket connection
      const wsHealthy = this.isConnected();

      // Check HTTP API
      const response = await fetch(`${this.config.dossierApi.baseUrl}/health`, {
        method: 'HEAD',
        headers: { 'Authorization': `Bearer ${this.config.dossierApi.apiKey}` },
        signal: AbortSignal.timeout(3000)
      });

      const httpHealthy = response.ok;

      return wsHealthy && httpHealthy;
    } catch (error) {
      console.error('UI health check failed:', error);
      return false;
    }
  }

  private async checkOrchestrationHealth(): Promise<boolean> {
    try {
      // Ping orchestration endpoint
      const pingResponse = await fetch(`${this.config.dossierApi.baseUrl}/api/orchestration/ping`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.config.dossierApi.apiKey}` },
        signal: AbortSignal.timeout(2000)
      });

      return pingResponse.ok;
    } catch (error) {
      return false;
    }
  }

  private handleUIMessage(message: any): void {
    try {
      switch (message.type) {
        case 'task-action':
          this.handleTaskAction(message.data);
          break;
        case 'workflow-command':
          this.handleWorkflowCommand(message.data);
          break;
        case 'evidence-request':
          this.handleEvidenceRequest(message.data);
          break;
        case 'ui-interaction':
          this.handleUIInteraction(message.data);
          break;
        default:
          this.emit('ui-message', message);
      }
    } catch (error) {
      console.error('Error handling UI message:', error);
    }
  }

  private handleTaskAction(data: any): void {
    this.emit('task-action', {
      action: data.action,
      taskId: data.taskId,
      parameters: data.parameters,
      source: 'dossier-ui'
    });
  }

  private handleWorkflowCommand(data: any): void {
    this.emit('workflow-command', {
      command: data.command,
      workflowId: data.workflowId,
      parameters: data.parameters,
      source: 'dossier-ui'
    });
  }

  private handleEvidenceRequest(data: any): void {
    this.emit('evidence-request', {
      requestType: data.requestType,
      investigationId: data.investigationId,
      filters: data.filters,
      source: 'dossier-ui'
    });
  }

  private handleUIInteraction(data: any): void {
    // Track UI interactions for analytics
    this.emit('ui-interaction', {
      interaction: data.interaction,
      component: data.component,
      timestamp: new Date(),
      user: data.user || 'anonymous'
    });
  }

  private attemptReconnection(): void {
    let reconnectAttempts = 0;
    const maxAttempts = 5;
    const baseDelay = 1000;

    const reconnect = async () => {
      if (reconnectAttempts >= maxAttempts) {
        this.emit('reconnection-failed', { attempts: reconnectAttempts });
        return;
      }

      reconnectAttempts++;
      const delay = baseDelay * Math.pow(2, reconnectAttempts - 1);

      console.log(`Attempting reconnection ${reconnectAttempts}/${maxAttempts} in ${delay}ms`);

      setTimeout(async () => {
        try {
          await this.connect();
          console.log(`Reconnection successful after ${reconnectAttempts} attempts`);
        } catch (error) {
          console.error(`Reconnection attempt ${reconnectAttempts} failed:`, error);
          reconnect();
        }
      }, delay);
    };

    reconnect();
  }

  private calculateErrorRate(): number {
    const { requestCount, errorCount } = this.getMetrics();
    return requestCount > 0 ? errorCount / requestCount : 0;
  }

  private calculateThroughput(): number {
    // TODO: Implement throughput calculation
    return this.getMetrics().requestCount / 60; // requests per minute
  }

  private createDossierError(code: string, message: string, originalError?: any): Error {
    const error = new Error(message) as any;
    error.code = code;
    error.severity = 'medium';
    error.retryable = !['TASK_NOT_FOUND', 'WORKFLOW_NOT_FOUND'].includes(code);
    error.context = originalError;
    error.timestamp = new Date();
    return error;
  }
}