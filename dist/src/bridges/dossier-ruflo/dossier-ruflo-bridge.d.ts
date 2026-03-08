/**
 * Dossier-RufloV3 Integration Bridge
 * Connects Next.js frontend with CLI orchestrator
 */
import { ComponentBridge, ComponentMessage, HealthMetrics, ComponentCapability } from '../base/component-bridge';
export interface DossierState {
    projects: ProjectInfo[];
    activeProject?: string;
    user?: UserInfo;
    preferences: UserPreferences;
}
export interface ProjectInfo {
    id: string;
    name: string;
    description: string;
    status: 'active' | 'paused' | 'completed' | 'archived';
    createdAt: Date;
    lastModified: Date;
    components: string[];
    metadata: ProjectMetadata;
}
export interface UserInfo {
    id: string;
    name: string;
    email: string;
    role: 'developer' | 'architect' | 'admin';
    preferences: UserPreferences;
}
export interface UserPreferences {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    notifications: NotificationPreferences;
    workflow: WorkflowPreferences;
}
export interface NotificationPreferences {
    email: boolean;
    browser: boolean;
    slack: boolean;
    webhook?: string;
}
export interface WorkflowPreferences {
    autoSave: boolean;
    autoCommit: boolean;
    defaultBranch: string;
    reviewRequired: boolean;
}
export interface ProjectMetadata {
    repository?: string;
    framework: string;
    language: string;
    version: string;
    dependencies: string[];
    tags: string[];
}
export interface RufloCommand {
    id: string;
    type: 'swarm' | 'agent' | 'memory' | 'task' | 'workflow';
    command: string;
    args: string[];
    context: any;
}
export interface RufloResponse {
    commandId: string;
    success: boolean;
    output: string;
    error?: string;
    metadata: {
        executionTime: number;
        agentsUsed: string[];
        resourcesAccessed: string[];
    };
}
export declare class DossierRufloBridge extends ComponentBridge {
    private wsServer?;
    private connectedClients;
    private eventEmitter;
    private dossierState;
    private commandQueue;
    constructor(config: any);
    private initializeDossierState;
    initialize(): Promise<void>;
    private initializeWebSocketServer;
    private setupEventHandlers;
    private connectToRuflo;
    shutdown(): Promise<void>;
    checkHealth(): Promise<HealthMetrics>;
    private checkRufloHealth;
    sendMessage(message: ComponentMessage): Promise<any>;
    getCapabilities(): ComponentCapability[];
    subscribe(eventType: string, callback: (event: any) => void): void;
    unsubscribe(eventType: string, callback?: (event: any) => void): void;
    private handleClientMessage;
    private createProject;
    private executeWorkflow;
    private executeRufloCommand;
    private getDossierState;
    private updateDossierState;
    private sendToClient;
    private broadcastToClients;
    private generateProjectId;
    private handleProjectCreated;
    private handleWorkflowStarted;
    private handleWorkflowCompleted;
}
//# sourceMappingURL=dossier-ruflo-bridge.d.ts.map