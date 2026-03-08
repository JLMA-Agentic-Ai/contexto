/**
 * Dossier Bridge
 * Interface between Dossier UI and platform orchestration
 */
import { BaseBridge } from './base/BaseBridge.js';
import { BaseBridgeConfig, BridgeEvent, BridgeResult, HealthStatus } from './types/common.js';
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
export declare class DossierBridge extends BaseBridge {
    private config;
    private webSocket?;
    private uiStates;
    private activeTasks;
    private activeWorkflows;
    constructor(config: DossierConfig);
    connect(): Promise<void>;
    private initializeHTTPConnection;
    private initializeWebSocketConnection;
    private setupWebSocketHandlers;
    private sendWebSocketMessage;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    performHealthCheck(): Promise<HealthStatus>;
    createTask(task: Omit<DossierTask, 'id' | 'createdAt' | 'updatedAt'>): Promise<BridgeResult<DossierTask>>;
    updateTask(taskId: string, updates: Partial<DossierTask>): Promise<BridgeResult<DossierTask>>;
    getTask(taskId: string): Promise<BridgeResult<DossierTask>>;
    listTasks(filters?: {
        status?: DossierTask['status'];
        priority?: DossierTask['priority'];
        assignedTo?: string;
    }): Promise<BridgeResult<DossierTask[]>>;
    createWorkflow(workflow: Omit<DossierWorkflow, 'id'>): Promise<BridgeResult<DossierWorkflow>>;
    executeWorkflow(workflowId: string, variables?: Record<string, any>): Promise<BridgeResult<string>>;
    updateUIState(componentId: string, state: Record<string, any>): Promise<BridgeResult<void>>;
    getUIState(componentId: string): Promise<BridgeResult<UIComponentState | undefined>>;
    private initializeOrchestration;
    private setupStreamingIntegration;
    private forwardEventToUI;
    private updateTaskVisualization;
    private updateEvidenceDisplay;
    private checkUIHealth;
    private checkOrchestrationHealth;
    private handleUIMessage;
    private handleTaskAction;
    private handleWorkflowCommand;
    private handleEvidenceRequest;
    private handleUIInteraction;
    private attemptReconnection;
    private calculateErrorRate;
    private calculateThroughput;
    private createDossierError;
}
//# sourceMappingURL=DossierBridge.d.ts.map