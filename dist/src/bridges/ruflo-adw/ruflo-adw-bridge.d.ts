/**
 * RufloV3-ADW Skills Integration Bridge
 * Connects CLI orchestrator with methodology workflows
 */
import { ComponentBridge, ComponentMessage, HealthMetrics, ComponentCapability } from '../base/component-bridge';
export interface ADWWorkflow {
    id: string;
    name: string;
    methodology: 'specification' | 'pseudocode' | 'architecture' | 'refinement' | 'coding';
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
    steps: ADWStep[];
    context: ADWContext;
    artifacts: ADWArtifact[];
}
export interface ADWStep {
    id: string;
    name: string;
    type: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
    inputs: Record<string, any>;
    outputs: Record<string, any>;
    skillFile: string;
    estimatedDuration?: number;
    actualDuration?: number;
}
export interface ADWContext {
    project: {
        name: string;
        type: string;
        requirements: string[];
        constraints: string[];
    };
    technical: {
        stack: string[];
        frameworks: string[];
        patterns: string[];
    };
    quality: {
        standards: string[];
        metrics: Record<string, number>;
        thresholds: Record<string, number>;
    };
}
export interface ADWArtifact {
    id: string;
    type: 'specification' | 'pseudocode' | 'architecture' | 'code' | 'documentation' | 'test';
    name: string;
    content: string;
    format: 'markdown' | 'yaml' | 'json' | 'typescript' | 'mermaid';
    version: number;
    createdAt: Date;
    metadata: Record<string, any>;
}
export interface RufloAgentTask {
    id: string;
    agentType: string;
    task: string;
    context: any;
    priority: 'low' | 'normal' | 'high' | 'critical';
    dependencies: string[];
    timeout: number;
}
export interface AgentResponse {
    taskId: string;
    agentId: string;
    success: boolean;
    output: any;
    metadata: {
        executionTime: number;
        resourcesUsed: string[];
        confidence: number;
    };
    errors?: string[];
}
export interface SkillExecution {
    skillPath: string;
    parameters: Record<string, any>;
    workflow: string;
    step: string;
    context: ADWContext;
}
export declare class RufloADWBridge extends ComponentBridge {
    private eventEmitter;
    private activeWorkflows;
    private agentTasks;
    private skillRegistry;
    private workflowTemplates;
    constructor(config: any);
    initialize(): Promise<void>;
    private loadSkillRegistry;
    private loadWorkflowTemplates;
    private createSpecificationWorkflow;
    private createArchitectureWorkflow;
    private createImplementationWorkflow;
    private createFullADWWorkflow;
    private setupEventHandlers;
    private initializeRufloConnection;
    shutdown(): Promise<void>;
    checkHealth(): Promise<HealthMetrics>;
    private checkRufloHealth;
    private calculateErrorRate;
    private calculateMemoryUsage;
    sendMessage(message: ComponentMessage): Promise<any>;
    getCapabilities(): ComponentCapability[];
    subscribe(eventType: string, callback: (event: any) => void): void;
    unsubscribe(eventType: string, callback?: (event: any) => void): void;
    private executeWorkflow;
    private executeWorkflowSteps;
    private executeSkillStep;
    private executeSkill;
    private orchestrateAgents;
    private executeAgentTask;
    private buildRufloCommand;
    private executeRufloCommand;
    private determineRequiredAgents;
    private createAgentTasks;
    private createSkillAgentTasks;
    private processAgentResponses;
    private processSkillResponses;
    private generateArtifactsFromStep;
    private createSpecificationArtifact;
    private createArchitectureArtifact;
    private createCodeArtifact;
    private estimateSkillTime;
    private getSkillDependencies;
    private generateWorkflowId;
    private handleWorkflowStarted;
    private handleStepCompleted;
    private handleAgentResponse;
}
//# sourceMappingURL=ruflo-adw-bridge.d.ts.map