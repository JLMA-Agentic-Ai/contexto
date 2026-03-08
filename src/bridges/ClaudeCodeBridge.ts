/**
 * Claude Code Bridge
 * Interface to execution engine and agent coordination
 */

import { BaseBridge } from './base/BaseBridge.js';
import {
  BaseBridgeConfig,
  BridgeEvent,
  BridgeResult,
  HealthStatus
} from './types/common.js';

// Claude Code-specific types
export interface ClaudeCodeConfig extends BaseBridgeConfig {
  execution: {
    apiEndpoint: string;
    apiKey: string;
    maxConcurrentExecutions: number;
    executionTimeout: number;
    sandboxMode: boolean;
  };
  agents: {
    coordinatorEndpoint: string;
    maxActiveAgents: number;
    agentPoolSize: number;
    heartbeatInterval: number;
  };
  tools: {
    availableTools: string[];
    customToolRegistry: string;
    toolExecutionTimeout: number;
    toolRateLimits: Record<string, number>;
  };
  coordination: {
    workflow: 'sequential' | 'parallel' | 'hybrid';
    failureStrategy: 'abort' | 'continue' | 'retry';
    resultAggregation: 'merge' | 'append' | 'custom';
  };
}

export interface ExecutionContext {
  id: string;
  type: 'code_execution' | 'tool_invocation' | 'agent_coordination' | 'workflow';
  initiator: string;
  environment: 'sandbox' | 'production' | 'test';
  permissions: ExecutionPermissions;
  resources: ExecutionResources;
  constraints: ExecutionConstraints;
  metadata: Record<string, any>;
  createdAt: Date;
  expiresAt: Date;
}

export interface ExecutionPermissions {
  fileSystem: {
    read: string[];
    write: string[];
    execute: string[];
  };
  network: {
    allowedDomains: string[];
    allowedPorts: number[];
    restrictLocal: boolean;
  };
  system: {
    allowProcessSpawn: boolean;
    maxMemoryMB: number;
    maxCPUPercent: number;
    allowedCommands: string[];
  };
}

export interface ExecutionResources {
  maxMemoryMB: number;
  maxCPUTime: number;
  maxWallTime: number;
  maxOutputSize: number;
  tempDirectoryQuota: number;
}

export interface ExecutionConstraints {
  timeout: number;
  maxRetries: number;
  requireApproval: boolean;
  auditLevel: 'none' | 'basic' | 'detailed' | 'verbose';
}

export interface CodeExecution {
  id: string;
  type: 'script' | 'command' | 'snippet' | 'test';
  language: string;
  code: string;
  arguments?: string[];
  workingDirectory?: string;
  environment?: Record<string, string>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout';
  result?: ExecutionResult;
  context: ExecutionContext;
  metrics: ExecutionMetrics;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface ExecutionResult {
  success: boolean;
  exitCode?: number;
  stdout: string;
  stderr: string;
  output: any;
  artifacts?: ExecutionArtifact[];
  error?: string;
  warnings: string[];
}

export interface ExecutionArtifact {
  id: string;
  name: string;
  type: 'file' | 'image' | 'data' | 'log';
  path: string;
  size: number;
  mimeType: string;
  checksum: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

export interface ExecutionMetrics {
  memoryUsed: number;
  cpuTime: number;
  wallTime: number;
  diskIO: {
    bytesRead: number;
    bytesWritten: number;
  };
  networkIO: {
    bytesReceived: number;
    bytesSent: number;
  };
  resourceUtilization: {
    peakMemoryMB: number;
    averageCPUPercent: number;
  };
}

export interface Agent {
  id: string;
  type: string;
  name: string;
  description: string;
  status: 'idle' | 'busy' | 'error' | 'maintenance' | 'terminated';
  capabilities: AgentCapability[];
  currentTask?: string;
  performance: AgentPerformance;
  configuration: Record<string, any>;
  lastHeartbeat: Date;
  createdAt: Date;
}

export interface AgentCapability {
  name: string;
  version: string;
  description: string;
  parameters: CapabilityParameter[];
  outputs: CapabilityOutput[];
  complexity: 'simple' | 'moderate' | 'complex' | 'expert';
  reliability: number; // 0-1
}

export interface CapabilityParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  validation?: any;
}

export interface CapabilityOutput {
  name: string;
  type: string;
  description: string;
  schema?: any;
}

export interface AgentPerformance {
  tasksCompleted: number;
  tasksTotal: number;
  successRate: number;
  averageExecutionTime: number;
  averageResponseTime: number;
  errorRate: number;
  lastEvaluated: Date;
}

export interface TaskCoordination {
  id: string;
  name: string;
  description: string;
  type: 'sequential' | 'parallel' | 'pipeline' | 'fan_out' | 'fan_in';
  tasks: CoordinatedTask[];
  dependencies: TaskDependency[];
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  coordinator: string; // Agent ID
  startedAt?: Date;
  completedAt?: Date;
  results: TaskResult[];
  metadata: Record<string, any>;
}

export interface CoordinatedTask {
  id: string;
  name: string;
  type: 'execution' | 'tool_call' | 'agent_task' | 'workflow';
  assignedAgent?: string;
  input: any;
  output?: any;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  retryCount: number;
  maxRetries: number;
  timeout: number;
  dependencies: string[]; // Task IDs
  startedAt?: Date;
  completedAt?: Date;
}

export interface TaskDependency {
  taskId: string;
  dependsOn: string[]; // Task IDs
  type: 'sequential' | 'data' | 'resource' | 'conditional';
  condition?: string;
}

export interface TaskResult {
  taskId: string;
  success: boolean;
  data: any;
  error?: string;
  executionTime: number;
  resourceUsage: {
    memory: number;
    cpu: number;
    io: number;
  };
  artifacts?: ExecutionArtifact[];
  completedAt: Date;
}

export interface ToolInvocation {
  id: string;
  toolName: string;
  parameters: Record<string, any>;
  context: ExecutionContext;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
  result?: any;
  error?: string;
  metrics: {
    executionTime: number;
    memoryUsed: number;
    rateLimitHits: number;
  };
  createdAt: Date;
  completedAt?: Date;
}

export interface ClaudeCodeEvent extends BridgeEvent {
  data: {
    executionId?: string;
    agentId?: string;
    taskId?: string;
    action: 'execution_started' | 'execution_completed' | 'agent_spawned' | 'task_assigned' | 'coordination_completed';
    details: any;
  };
}

export class ClaudeCodeBridge extends BaseBridge {
  private config: ClaudeCodeConfig;
  private activeExecutions: Map<string, CodeExecution> = new Map();
  private activeAgents: Map<string, Agent> = new Map();
  private coordinations: Map<string, TaskCoordination> = new Map();
  private toolInvocations: Map<string, ToolInvocation> = new Map();

  constructor(config: ClaudeCodeConfig) {
    super(config);
    this.config = config;
  }

  // Connection management
  public async connect(): Promise<void> {
    try {
      // TODO: Initialize connection to Claude Code execution engine
      await this.initializeExecutionEngine();

      // TODO: Connect to agent coordinator
      await this.initializeAgentCoordinator();

      // TODO: Load available tools
      await this.loadToolRegistry();

      this.emit('connected');
      console.log('Claude Code Bridge connected');
    } catch (error) {
      throw this.createClaudeCodeError('CONNECTION_FAILED', 'Failed to connect to Claude Code', error);
    }
  }

  public async disconnect(): Promise<void> {
    // TODO: Gracefully stop all active executions
    for (const [executionId] of this.activeExecutions) {
      await this.cancelExecution(executionId);
    }

    // TODO: Terminate all agents
    for (const [agentId] of this.activeAgents) {
      await this.terminateAgent(agentId);
    }

    // TODO: Close connections
    this.emit('disconnected');
  }

  public isConnected(): boolean {
    // TODO: Check connection status to execution engine and agent coordinator
    return true;
  }

  public async performHealthCheck(): Promise<HealthStatus> {
    const startTime = Date.now();

    try {
      const executionEngineHealth = await this.checkExecutionEngineHealth();
      const agentCoordinatorHealth = await this.checkAgentCoordinatorHealth();
      const toolRegistryHealth = await this.checkToolRegistryHealth();

      const responseTime = Date.now() - startTime;

      const overallStatus = executionEngineHealth && agentCoordinatorHealth && toolRegistryHealth ? 'healthy' : 'degraded';

      return {
        status: overallStatus,
        lastCheck: new Date(),
        details: {
          executionEngine: executionEngineHealth,
          agentCoordinator: agentCoordinatorHealth,
          toolRegistry: toolRegistryHealth,
          activeExecutions: this.activeExecutions.size,
          activeAgents: this.activeAgents.size
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

  // Code execution operations
  public async executeCode(execution: Omit<CodeExecution, 'id' | 'status' | 'createdAt' | 'metrics'>): Promise<BridgeResult<CodeExecution>> {
    return this.executeWithRetry(async () => {
      const newExecution: CodeExecution = {
        ...execution,
        id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending',
        metrics: {
          memoryUsed: 0,
          cpuTime: 0,
          wallTime: 0,
          diskIO: { bytesRead: 0, bytesWritten: 0 },
          networkIO: { bytesReceived: 0, bytesSent: 0 },
          resourceUtilization: { peakMemoryMB: 0, averageCPUPercent: 0 }
        },
        createdAt: new Date()
      };

      this.activeExecutions.set(newExecution.id, newExecution);

      // TODO: Submit execution to Claude Code engine
      await this.submitExecution(newExecution);

      await this.publishEvent<ClaudeCodeEvent['data']>({
        id: `execution_started_${newExecution.id}`,
        type: 'execution.started',
        source: 'claude-code-bridge',
        timestamp: new Date(),
        data: {
          executionId: newExecution.id,
          action: 'execution_started',
          details: { type: execution.type, language: execution.language }
        }
      });

      return newExecution;
    });
  }

  public async getExecutionStatus(executionId: string): Promise<BridgeResult<CodeExecution>> {
    return this.executeWithRetry(async () => {
      const execution = this.activeExecutions.get(executionId);
      if (!execution) {
        throw this.createClaudeCodeError('EXECUTION_NOT_FOUND', `Execution ${executionId} not found`);
      }
      return execution;
    });
  }

  public async cancelExecution(executionId: string): Promise<BridgeResult<void>> {
    return this.executeWithRetry(async () => {
      const execution = this.activeExecutions.get(executionId);
      if (!execution) {
        throw this.createClaudeCodeError('EXECUTION_NOT_FOUND', `Execution ${executionId} not found`);
      }

      if (execution.status === 'running') {
        // TODO: Cancel running execution
        execution.status = 'cancelled';
        execution.completedAt = new Date();
      }

      this.activeExecutions.delete(executionId);
    });
  }

  // Agent coordination operations
  public async spawnAgent(type: string, name: string, configuration?: Record<string, any>): Promise<BridgeResult<Agent>> {
    return this.executeWithRetry(async () => {
      const newAgent: Agent = {
        id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        name,
        description: `${type} agent: ${name}`,
        status: 'idle',
        capabilities: [], // TODO: Load capabilities based on type
        performance: {
          tasksCompleted: 0,
          tasksTotal: 0,
          successRate: 0,
          averageExecutionTime: 0,
          averageResponseTime: 0,
          errorRate: 0,
          lastEvaluated: new Date()
        },
        configuration: configuration || {},
        lastHeartbeat: new Date(),
        createdAt: new Date()
      };

      this.activeAgents.set(newAgent.id, newAgent);

      // TODO: Spawn agent via agent coordinator
      await this.requestAgentSpawn(newAgent);

      await this.publishEvent<ClaudeCodeEvent['data']>({
        id: `agent_spawned_${newAgent.id}`,
        type: 'agent.spawned',
        source: 'claude-code-bridge',
        timestamp: new Date(),
        data: {
          agentId: newAgent.id,
          action: 'agent_spawned',
          details: { type, name }
        }
      });

      return newAgent;
    });
  }

  public async terminateAgent(agentId: string): Promise<BridgeResult<void>> {
    return this.executeWithRetry(async () => {
      const agent = this.activeAgents.get(agentId);
      if (!agent) {
        throw this.createClaudeCodeError('AGENT_NOT_FOUND', `Agent ${agentId} not found`);
      }

      // TODO: Terminate agent via coordinator
      agent.status = 'terminated';
      this.activeAgents.delete(agentId);

      await this.publishEvent<ClaudeCodeEvent['data']>({
        id: `agent_terminated_${agentId}`,
        type: 'agent.terminated',
        source: 'claude-code-bridge',
        timestamp: new Date(),
        data: {
          agentId,
          action: 'agent_terminated',
          details: {}
        }
      });
    });
  }

  public async assignTask(agentId: string, task: any): Promise<BridgeResult<string>> {
    return this.executeWithRetry(async () => {
      const agent = this.activeAgents.get(agentId);
      if (!agent) {
        throw this.createClaudeCodeError('AGENT_NOT_FOUND', `Agent ${agentId} not found`);
      }

      if (agent.status !== 'idle') {
        throw this.createClaudeCodeError('AGENT_BUSY', `Agent ${agentId} is not available`);
      }

      const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // TODO: Assign task to agent
      agent.status = 'busy';
      agent.currentTask = taskId;
      agent.performance.tasksTotal++;

      await this.publishEvent<ClaudeCodeEvent['data']>({
        id: `task_assigned_${taskId}`,
        type: 'task.assigned',
        source: 'claude-code-bridge',
        timestamp: new Date(),
        data: {
          agentId,
          taskId,
          action: 'task_assigned',
          details: task
        }
      });

      return taskId;
    });
  }

  // Coordination operations
  public async coordinateTasks(coordination: Omit<TaskCoordination, 'id' | 'status' | 'results'>): Promise<BridgeResult<TaskCoordination>> {
    return this.executeWithRetry(async () => {
      const newCoordination: TaskCoordination = {
        ...coordination,
        id: `coord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'pending',
        results: []
      };

      this.coordinations.set(newCoordination.id, newCoordination);

      // TODO: Start task coordination
      await this.startTaskCoordination(newCoordination);

      return newCoordination;
    });
  }

  public async getCoordinationStatus(coordinationId: string): Promise<BridgeResult<TaskCoordination>> {
    return this.executeWithRetry(async () => {
      const coordination = this.coordinations.get(coordinationId);
      if (!coordination) {
        throw this.createClaudeCodeError('COORDINATION_NOT_FOUND', `Coordination ${coordinationId} not found`);
      }
      return coordination;
    });
  }

  // Tool operations
  public async invokeTool(toolName: string, parameters: Record<string, any>, context?: ExecutionContext): Promise<BridgeResult<any>> {
    return this.executeWithRetry(async () => {
      const invocation: ToolInvocation = {
        id: `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        toolName,
        parameters,
        context: context || this.createDefaultContext('tool_invocation'),
        status: 'pending',
        metrics: {
          executionTime: 0,
          memoryUsed: 0,
          rateLimitHits: 0
        },
        createdAt: new Date()
      };

      this.toolInvocations.set(invocation.id, invocation);

      // TODO: Execute tool via Claude Code
      const result = await this.executeToolInvocation(invocation);

      invocation.status = 'completed';
      invocation.result = result;
      invocation.completedAt = new Date();

      return result;
    });
  }

  public async listAvailableTools(): Promise<BridgeResult<string[]>> {
    return this.executeWithRetry(async () => {
      return this.config.tools.availableTools;
    });
  }

  // Private helper methods
  private async initializeExecutionEngine(): Promise<void> {
    try {
      // Initialize connection to Claude Code execution engine
      await this.establishExecutionConnection();

      // Test execution capabilities
      await this.testExecutionCapabilities();

      // Set up execution monitoring
      this.setupExecutionMonitoring();

      console.log('Claude Code execution engine initialized');
    } catch (error) {
      throw new Error(`Failed to initialize execution engine: ${error}`);
    }
  }

  private async establishExecutionConnection(): Promise<void> {
    const connectionConfig = {
      apiEndpoint: this.config.execution.apiEndpoint,
      apiKey: this.config.execution.apiKey,
      sandboxMode: this.config.execution.sandboxMode,
      timeout: this.config.execution.executionTimeout
    };

    console.log('Establishing Claude Code execution connection...');

    // Test API connectivity
    try {
      const response = await fetch(`${this.config.execution.apiEndpoint}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.execution.apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Execution engine health check failed: ${response.status}`);
      }

      console.log('Claude Code execution engine connection established');
    } catch (error) {
      throw new Error(`Failed to connect to execution engine: ${error}`);
    }
  }

  private async testExecutionCapabilities(): Promise<void> {
    // Test basic execution capability
    const testExecution = {
      type: 'snippet' as const,
      language: 'javascript',
      code: 'console.log("Claude Code Bridge Test");',
      context: this.createDefaultContext('code_execution')
    };

    try {
      const result = await this.executeCodeDirect(testExecution);
      if (!result.success) {
        throw new Error('Test execution failed');
      }
      console.log('Execution capabilities verified');
    } catch (error) {
      console.warn('Execution capability test failed:', error);
    }
  }

  private async executeCodeDirect(execution: Omit<CodeExecution, 'id' | 'status' | 'createdAt' | 'metrics'>): Promise<{ success: boolean; result?: ExecutionResult; error?: string }> {
    try {
      const response = await fetch(`${this.config.execution.apiEndpoint}/execute`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.execution.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          language: execution.language,
          code: execution.code,
          arguments: execution.arguments,
          workingDirectory: execution.workingDirectory,
          environment: execution.environment,
          sandbox: this.config.execution.sandboxMode,
          timeout: execution.context.constraints.timeout
        }),
        signal: AbortSignal.timeout(execution.context.constraints.timeout)
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();

      return {
        success: true,
        result: {
          success: data.success,
          exitCode: data.exitCode,
          stdout: data.stdout || '',
          stderr: data.stderr || '',
          output: data.output || {},
          error: data.error,
          warnings: data.warnings || []
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private setupExecutionMonitoring(): void {
    // Set up periodic monitoring of active executions
    setInterval(() => {
      this.monitorActiveExecutions();
    }, 10000); // Every 10 seconds

    // Set up resource usage monitoring
    setInterval(() => {
      this.monitorResourceUsage();
    }, 5000); // Every 5 seconds
  }

  private async monitorActiveExecutions(): Promise<void> {
    for (const [executionId, execution] of this.activeExecutions) {
      if (execution.status === 'running') {
        // Check if execution has exceeded timeout
        const elapsed = Date.now() - (execution.startedAt?.getTime() || execution.createdAt.getTime());
        const timeout = execution.context.constraints.timeout;

        if (elapsed > timeout) {
          await this.timeoutExecution(executionId);
        }
      }
    }
  }

  private async timeoutExecution(executionId: string): Promise<void> {
    const execution = this.activeExecutions.get(executionId);
    if (!execution) return;

    execution.status = 'timeout';
    execution.completedAt = new Date();
    execution.result = {
      success: false,
      stdout: '',
      stderr: 'Execution timed out',
      output: {},
      error: 'Execution exceeded timeout limit',
      warnings: ['Execution was terminated due to timeout']
    };

    await this.publishEvent({
      id: `execution_timeout_${executionId}`,
      type: 'execution.timeout',
      source: 'claude-code-bridge',
      timestamp: new Date(),
      data: {
        executionId,
        action: 'execution_timeout',
        details: { timeout: execution.context.constraints.timeout }
      }
    });
  }

  private async monitorResourceUsage(): Promise<void> {
    try {
      const resourceStats = await this.getResourceUsageStats();

      // Check for resource constraints
      if (resourceStats.memoryUsagePercent > 90) {
        this.emit('resource-warning', {
          type: 'memory',
          usage: resourceStats.memoryUsagePercent,
          threshold: 90
        });
      }

      if (resourceStats.cpuUsagePercent > 95) {
        this.emit('resource-warning', {
          type: 'cpu',
          usage: resourceStats.cpuUsagePercent,
          threshold: 95
        });
      }
    } catch (error) {
      console.error('Resource monitoring failed:', error);
    }
  }

  private async getResourceUsageStats(): Promise<{
    memoryUsagePercent: number;
    cpuUsagePercent: number;
    activeExecutions: number;
  }> {
    // Simulate resource usage monitoring
    return {
      memoryUsagePercent: Math.random() * 100,
      cpuUsagePercent: Math.random() * 100,
      activeExecutions: this.activeExecutions.size
    };
  }

  private async initializeAgentCoordinator(): Promise<void> {
    try {
      // Initialize connection to agent coordinator
      await this.establishCoordinatorConnection();

      // Register this bridge as an agent coordinator
      await this.registerAsCoordinator();

      // Load agent capabilities
      await this.loadAgentCapabilities();

      console.log('Agent coordinator initialized');
    } catch (error) {
      throw new Error(`Failed to initialize agent coordinator: ${error}`);
    }
  }

  private async establishCoordinatorConnection(): Promise<void> {
    try {
      const response = await fetch(`${this.config.agents.coordinatorEndpoint}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.execution.apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Coordinator health check failed: ${response.status}`);
      }

      console.log('Agent coordinator connection established');
    } catch (error) {
      throw new Error(`Failed to connect to agent coordinator: ${error}`);
    }
  }

  private async registerAsCoordinator(): Promise<void> {
    const registrationPayload = {
      bridgeId: 'claude-code-bridge',
      capabilities: ['code-execution', 'agent-spawning', 'task-coordination'],
      maxConcurrentExecutions: this.config.execution.maxConcurrentExecutions,
      maxActiveAgents: this.config.agents.maxActiveAgents,
      availableTools: this.config.tools.availableTools
    };

    try {
      const response = await fetch(`${this.config.agents.coordinatorEndpoint}/register`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.execution.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registrationPayload)
      });

      if (!response.ok) {
        throw new Error(`Failed to register coordinator: ${response.status}`);
      }

      console.log('Registered as agent coordinator');
    } catch (error) {
      console.error('Failed to register as coordinator:', error);
    }
  }

  private async loadAgentCapabilities(): Promise<void> {
    // Load standard agent capabilities
    const standardCapabilities: Record<string, AgentCapability[]> = {
      'coder': [
        {
          name: 'code-generation',
          version: '1.0.0',
          description: 'Generate code from specifications',
          parameters: [
            { name: 'language', type: 'string', required: true, description: 'Programming language' },
            { name: 'requirements', type: 'string', required: true, description: 'Code requirements' }
          ],
          outputs: [
            { name: 'code', type: 'string', description: 'Generated code' }
          ],
          complexity: 'moderate',
          reliability: 0.85
        },
        {
          name: 'debugging',
          version: '1.0.0',
          description: 'Debug and fix code issues',
          parameters: [
            { name: 'code', type: 'string', required: true, description: 'Code to debug' },
            { name: 'error', type: 'string', required: false, description: 'Error description' }
          ],
          outputs: [
            { name: 'fixed_code', type: 'string', description: 'Fixed code' },
            { name: 'explanation', type: 'string', description: 'Bug explanation' }
          ],
          complexity: 'complex',
          reliability: 0.8
        }
      ],

      'reviewer': [
        {
          name: 'code-review',
          version: '1.0.0',
          description: 'Review code for quality and best practices',
          parameters: [
            { name: 'code', type: 'string', required: true, description: 'Code to review' },
            { name: 'criteria', type: 'array', required: false, description: 'Review criteria' }
          ],
          outputs: [
            { name: 'review_comments', type: 'array', description: 'Review feedback' },
            { name: 'score', type: 'number', description: 'Quality score' }
          ],
          complexity: 'moderate',
          reliability: 0.9
        }
      ],

      'tester': [
        {
          name: 'test-generation',
          version: '1.0.0',
          description: 'Generate comprehensive test cases',
          parameters: [
            { name: 'code', type: 'string', required: true, description: 'Code to test' },
            { name: 'test_type', type: 'string', required: false, description: 'Type of tests' }
          ],
          outputs: [
            { name: 'test_code', type: 'string', description: 'Generated test code' },
            { name: 'coverage', type: 'number', description: 'Expected coverage' }
          ],
          complexity: 'moderate',
          reliability: 0.85
        }
      ]
    };

    // Store capabilities for agent types
    this.agentCapabilities = standardCapabilities;

    console.log(`Loaded capabilities for ${Object.keys(standardCapabilities).length} agent types`);
  }

  private async loadToolRegistry(): Promise<void> {
    try {
      // Load available tools from configuration
      const toolsFromConfig = this.config.tools.availableTools;

      // Load additional tools from registry if specified
      if (this.config.tools.customToolRegistry) {
        const customTools = await this.loadCustomTools();
        toolsFromConfig.push(...customTools);
      }

      // Initialize tool rate limiters
      this.initializeToolRateLimiters();

      console.log(`Loaded ${toolsFromConfig.length} tools into registry`);
    } catch (error) {
      throw new Error(`Failed to load tool registry: ${error}`);
    }
  }

  private async loadCustomTools(): Promise<string[]> {
    try {
      const response = await fetch(this.config.tools.customToolRegistry, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.execution.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.tools || [];
      }

      return [];
    } catch (error) {
      console.error('Failed to load custom tools:', error);
      return [];
    }
  }

  private initializeToolRateLimiters(): void {
    this.toolRateLimiters = new Map();

    for (const [toolName, limit] of Object.entries(this.config.tools.toolRateLimits)) {
      this.toolRateLimiters.set(toolName, {
        requests: [],
        limit,
        window: 60000 // 1 minute window
      });
    }
  }

  private agentCapabilities: Record<string, AgentCapability[]> = {};
  private toolRateLimiters: Map<string, {
    requests: number[];
    limit: number;
    window: number;
  }> = new Map();

  private async submitExecution(execution: CodeExecution): Promise<void> {
    try {
      execution.status = 'running';
      execution.startedAt = new Date();

      // Submit to Claude Code execution engine
      const executionResult = await this.executeCodeDirect(execution);

      // Update execution with results
      execution.status = executionResult.success ? 'completed' : 'failed';
      execution.completedAt = new Date();
      execution.result = executionResult.result || {
        success: false,
        stdout: '',
        stderr: executionResult.error || 'Unknown error',
        output: {},
        warnings: []
      };

      // Calculate metrics
      if (execution.startedAt) {
        execution.metrics.wallTime = execution.completedAt.getTime() - execution.startedAt.getTime();
      }

      // Simulate resource metrics (in real implementation, get from execution engine)
      execution.metrics.memoryUsed = Math.floor(Math.random() * 512);
      execution.metrics.cpuTime = Math.floor(execution.metrics.wallTime * 0.8);

      // Publish completion event
      await this.publishEvent<ClaudeCodeEvent['data']>({
        id: `execution_completed_${execution.id}`,
        type: 'execution.completed',
        source: 'claude-code-bridge',
        timestamp: new Date(),
        data: {
          executionId: execution.id,
          action: 'execution_completed',
          details: execution.result
        }
      });

      // Stream execution updates
      this.emit('stream-event', {
        component: 'claude-code',
        type: 'execution-completed',
        data: {
          executionId: execution.id,
          status: execution.status,
          metrics: execution.metrics,
          result: execution.result
        },
        timestamp: new Date()
      });

    } catch (error) {
      execution.status = 'failed';
      execution.completedAt = new Date();
      execution.result = {
        success: false,
        stdout: '',
        stderr: '',
        output: {},
        error: error instanceof Error ? error.message : 'Unknown error',
        warnings: []
      };

      console.error(`Execution ${execution.id} failed:`, error);
    }
  }

  private async requestAgentSpawn(agent: Agent): Promise<void> {
    try {
      // Request agent spawn via coordinator
      const spawnRequest = {
        agentId: agent.id,
        type: agent.type,
        name: agent.name,
        configuration: agent.configuration,
        capabilities: agent.capabilities.map(cap => cap.name)
      };

      const response = await fetch(`${this.config.agents.coordinatorEndpoint}/agents/spawn`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.execution.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(spawnRequest),
        signal: AbortSignal.timeout(30000)
      });

      if (!response.ok) {
        throw new Error(`Agent spawn request failed: ${response.status}`);
      }

      const result = await response.json();

      // Update agent with spawn result
      agent.status = result.status || 'idle';
      agent.lastHeartbeat = new Date();

      // Set up heartbeat monitoring for this agent
      this.setupAgentHeartbeat(agent);

      console.log(`Agent ${agent.name} spawned successfully`);

    } catch (error) {
      agent.status = 'error';
      console.error(`Failed to spawn agent ${agent.name}:`, error);
      throw error;
    }
  }

  private setupAgentHeartbeat(agent: Agent): void {
    const heartbeatInterval = setInterval(async () => {
      try {
        const isAlive = await this.checkAgentHealth(agent);
        if (isAlive) {
          agent.lastHeartbeat = new Date();
        } else {
          agent.status = 'error';
          clearInterval(heartbeatInterval);
          this.emit('agent-health-failed', { agentId: agent.id, reason: 'heartbeat-failed' });
        }
      } catch (error) {
        console.error(`Heartbeat check failed for agent ${agent.id}:`, error);
      }
    }, this.config.agents.heartbeatInterval);

    // Store interval reference for cleanup
    (agent as any)._heartbeatInterval = heartbeatInterval;
  }

  private async checkAgentHealth(agent: Agent): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.agents.coordinatorEndpoint}/agents/${agent.id}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.execution.apiKey}`
        },
        signal: AbortSignal.timeout(5000)
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async startTaskCoordination(coordination: TaskCoordination): Promise<void> {
    try {
      coordination.status = 'running';
      coordination.startedAt = new Date();

      console.log(`Starting task coordination: ${coordination.name}`);

      // Process tasks based on coordination type
      switch (coordination.type) {
        case 'sequential':
          await this.executeSequentialTasks(coordination);
          break;
        case 'parallel':
          await this.executeParallelTasks(coordination);
          break;
        case 'pipeline':
          await this.executePipelineTasks(coordination);
          break;
        case 'fan_out':
          await this.executeFanOutTasks(coordination);
          break;
        case 'fan_in':
          await this.executeFanInTasks(coordination);
          break;
        default:
          throw new Error(`Unknown coordination type: ${coordination.type}`);
      }

      coordination.status = 'completed';
      coordination.completedAt = new Date();

      await this.publishEvent<ClaudeCodeEvent['data']>({
        id: `coordination_completed_${coordination.id}`,
        type: 'coordination.completed',
        source: 'claude-code-bridge',
        timestamp: new Date(),
        data: {
          taskId: coordination.id,
          action: 'coordination_completed',
          details: {
            type: coordination.type,
            tasksCompleted: coordination.tasks.length,
            results: coordination.results.length
          }
        }
      });

    } catch (error) {
      coordination.status = 'failed';
      coordination.completedAt = new Date();
      console.error(`Task coordination ${coordination.id} failed:`, error);
    }
  }

  private async executeSequentialTasks(coordination: TaskCoordination): Promise<void> {
    for (const task of coordination.tasks) {
      try {
        await this.executeCoordinatedTask(task, coordination);
      } catch (error) {
        if (this.config.coordination.failureStrategy === 'abort') {
          throw error;
        }
        console.error(`Task ${task.id} failed, continuing with next task:`, error);
      }
    }
  }

  private async executeParallelTasks(coordination: TaskCoordination): Promise<void> {
    const taskPromises = coordination.tasks.map(task =>
      this.executeCoordinatedTask(task, coordination).catch(error => {
        if (this.config.coordination.failureStrategy === 'abort') {
          throw error;
        }
        console.error(`Task ${task.id} failed:`, error);
        return null;
      })
    );

    await Promise.allSettled(taskPromises);
  }

  private async executePipelineTasks(coordination: TaskCoordination): Promise<void> {
    // Execute tasks in dependency order
    const sortedTasks = this.topologicalSort(coordination.tasks, coordination.dependencies);

    for (const task of sortedTasks) {
      // Wait for dependencies to complete
      await this.waitForTaskDependencies(task, coordination);

      // Execute task
      await this.executeCoordinatedTask(task, coordination);
    }
  }

  private async executeFanOutTasks(coordination: TaskCoordination): Promise<void> {
    // Execute first task, then fan out to parallel execution of remaining tasks
    if (coordination.tasks.length === 0) return;

    const firstTask = coordination.tasks[0];
    await this.executeCoordinatedTask(firstTask, coordination);

    const remainingTasks = coordination.tasks.slice(1);
    await this.executeParallelTasks({ ...coordination, tasks: remainingTasks });
  }

  private async executeFanInTasks(coordination: TaskCoordination): Promise<void> {
    // Execute all tasks except last in parallel, then execute last task
    if (coordination.tasks.length === 0) return;

    const lastTask = coordination.tasks[coordination.tasks.length - 1];
    const parallelTasks = coordination.tasks.slice(0, -1);

    if (parallelTasks.length > 0) {
      await this.executeParallelTasks({ ...coordination, tasks: parallelTasks });
    }

    await this.executeCoordinatedTask(lastTask, coordination);
  }

  private async executeCoordinatedTask(task: CoordinatedTask, coordination: TaskCoordination): Promise<void> {
    const startTime = Date.now();

    try {
      task.status = 'running';
      task.startedAt = new Date();

      let result: any;

      switch (task.type) {
        case 'execution':
          result = await this.executeTaskAsCode(task);
          break;
        case 'tool_call':
          result = await this.executeTaskAsTool(task);
          break;
        case 'agent_task':
          result = await this.executeTaskAsAgent(task);
          break;
        case 'workflow':
          result = await this.executeTaskAsWorkflow(task);
          break;
        default:
          throw new Error(`Unknown task type: ${task.type}`);
      }

      task.status = 'completed';
      task.completedAt = new Date();
      task.output = result;

      // Store task result
      const taskResult: TaskResult = {
        taskId: task.id,
        success: true,
        data: result,
        executionTime: Date.now() - startTime,
        resourceUsage: {
          memory: Math.random() * 100,
          cpu: Math.random() * 100,
          io: Math.random() * 100
        },
        completedAt: new Date()
      };

      coordination.results.push(taskResult);

    } catch (error) {
      task.status = 'failed';
      task.completedAt = new Date();

      const taskResult: TaskResult = {
        taskId: task.id,
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
        resourceUsage: {
          memory: 0,
          cpu: 0,
          io: 0
        },
        completedAt: new Date()
      };

      coordination.results.push(taskResult);
      throw error;
    }
  }

  private async executeTaskAsCode(task: CoordinatedTask): Promise<any> {
    // Execute task as code execution
    const codeExecution: Omit<CodeExecution, 'id' | 'status' | 'createdAt' | 'metrics'> = {
      type: 'script',
      language: task.input.language || 'javascript',
      code: task.input.code,
      arguments: task.input.arguments,
      workingDirectory: task.input.workingDirectory,
      environment: task.input.environment,
      context: this.createDefaultContext('code_execution')
    };

    const result = await this.executeCodeDirect(codeExecution);
    return result.result;
  }

  private async executeTaskAsTool(task: CoordinatedTask): Promise<any> {
    // Execute task as tool invocation
    const toolResult = await this.invokeTool(
      task.input.toolName,
      task.input.parameters,
      task.input.context
    );

    return toolResult.data;
  }

  private async executeTaskAsAgent(task: CoordinatedTask): Promise<any> {
    // Assign task to specific agent
    if (!task.assignedAgent) {
      throw new Error('No agent assigned for agent task');
    }

    const taskId = await this.assignTask(task.assignedAgent, task.input);
    return { taskId, status: 'assigned' };
  }

  private async executeTaskAsWorkflow(task: CoordinatedTask): Promise<any> {
    // Execute nested workflow
    const nestedCoordination = task.input as TaskCoordination;
    await this.startTaskCoordination(nestedCoordination);
    return nestedCoordination.results;
  }

  private topologicalSort(tasks: CoordinatedTask[], dependencies: TaskDependency[]): CoordinatedTask[] {
    // Simple topological sort implementation
    const sorted: CoordinatedTask[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (taskId: string): void => {
      if (visiting.has(taskId)) {
        throw new Error(`Circular dependency detected involving task ${taskId}`);
      }
      if (visited.has(taskId)) {
        return;
      }

      visiting.add(taskId);

      // Visit dependencies first
      const taskDeps = dependencies.filter(dep => dep.taskId === taskId);
      for (const dep of taskDeps) {
        for (const depId of dep.dependsOn) {
          visit(depId);
        }
      }

      visiting.delete(taskId);
      visited.add(taskId);

      const task = tasks.find(t => t.id === taskId);
      if (task) {
        sorted.push(task);
      }
    };

    for (const task of tasks) {
      visit(task.id);
    }

    return sorted;
  }

  private async waitForTaskDependencies(task: CoordinatedTask, coordination: TaskCoordination): Promise<void> {
    const dependencies = coordination.dependencies.filter(dep => dep.taskId === task.id);

    for (const dep of dependencies) {
      for (const depId of dep.dependsOn) {
        await this.waitForTaskCompletion(depId, coordination);
      }
    }
  }

  private async waitForTaskCompletion(taskId: string, coordination: TaskCoordination): Promise<void> {
    const task = coordination.tasks.find(t => t.id === taskId);
    if (!task) return;

    while (task.status === 'pending' || task.status === 'running') {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private async executeToolInvocation(invocation: ToolInvocation): Promise<any> {
    const startTime = Date.now();

    try {
      // Check rate limits
      const rateLimiter = this.toolRateLimiters.get(invocation.toolName);
      if (rateLimiter) {
        const now = Date.now();
        const windowStart = now - rateLimiter.window;

        // Clean old requests
        rateLimiter.requests = rateLimiter.requests.filter(time => time > windowStart);

        // Check if rate limit exceeded
        if (rateLimiter.requests.length >= rateLimiter.limit) {
          invocation.metrics.rateLimitHits++;
          throw new Error(`Rate limit exceeded for tool ${invocation.toolName}`);
        }

        // Add current request
        rateLimiter.requests.push(now);
      }

      invocation.status = 'running';

      // Execute tool via Claude Code
      const response = await fetch(`${this.config.execution.apiEndpoint}/tools/${invocation.toolName}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.execution.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          parameters: invocation.parameters,
          context: {
            timeout: invocation.context.constraints?.timeout || 30000,
            permissions: invocation.context.permissions,
            resources: invocation.context.resources
          }
        }),
        signal: AbortSignal.timeout(invocation.context.constraints?.timeout || 30000)
      });

      if (!response.ok) {
        throw new Error(`Tool execution failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      invocation.metrics.executionTime = Date.now() - startTime;
      invocation.metrics.memoryUsed = result.metrics?.memoryUsed || 0;

      return result.data || result;

    } catch (error) {
      invocation.metrics.executionTime = Date.now() - startTime;
      throw error;
    }
  }

  private createDefaultContext(type: ExecutionContext['type']): ExecutionContext {
    return {
      id: `ctx_${Date.now()}`,
      type,
      initiator: 'claude-code-bridge',
      environment: this.config.execution.sandboxMode ? 'sandbox' : 'production',
      permissions: {
        fileSystem: { read: [], write: [], execute: [] },
        network: { allowedDomains: [], allowedPorts: [], restrictLocal: true },
        system: {
          allowProcessSpawn: false,
          maxMemoryMB: 512,
          maxCPUPercent: 50,
          allowedCommands: []
        }
      },
      resources: {
        maxMemoryMB: 512,
        maxCPUTime: 30000,
        maxWallTime: 60000,
        maxOutputSize: 1048576,
        tempDirectoryQuota: 104857600
      },
      constraints: {
        timeout: this.config.execution.executionTimeout,
        maxRetries: 3,
        requireApproval: false,
        auditLevel: 'basic'
      },
      metadata: {},
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 3600000) // 1 hour
    };
  }

  private async checkExecutionEngineHealth(): Promise<boolean> {
    // TODO: Check execution engine health
    return true;
  }

  private async checkAgentCoordinatorHealth(): Promise<boolean> {
    // TODO: Check agent coordinator health
    return true;
  }

  private async checkToolRegistryHealth(): Promise<boolean> {
    // TODO: Check tool registry health
    return true;
  }

  private calculateErrorRate(): number {
    const { requestCount, errorCount } = this.getMetrics();
    return requestCount > 0 ? errorCount / requestCount : 0;
  }

  private calculateThroughput(): number {
    return this.getMetrics().requestCount / 60;
  }

  private createClaudeCodeError(code: string, message: string, originalError?: any): Error {
    const error = new Error(message) as any;
    error.code = code;
    error.severity = 'medium';
    error.retryable = ![
      'EXECUTION_NOT_FOUND',
      'AGENT_NOT_FOUND',
      'COORDINATION_NOT_FOUND',
      'AGENT_BUSY'
    ].includes(code);
    error.context = originalError;
    error.timestamp = new Date();
    return error;
  }
}