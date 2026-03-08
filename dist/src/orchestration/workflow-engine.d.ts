/**
 * Workflow Engine for Platform Orchestration
 * Manages complex multi-component workflows
 */
import { EventEmitter } from 'events';
export interface WorkflowDefinition {
    id: string;
    name: string;
    description: string;
    version: string;
    steps: WorkflowStep[];
    metadata: WorkflowMetadata;
}
export interface WorkflowStep {
    id: string;
    name: string;
    type: 'component' | 'condition' | 'parallel' | 'sequential' | 'loop' | 'human';
    config: StepConfig;
    dependencies: string[];
    conditions?: StepCondition[];
    retryConfig?: RetryConfig;
    timeout?: number;
}
export interface StepConfig {
    component?: string;
    action: string;
    parameters: Record<string, any>;
    outputMapping?: Record<string, string>;
    errorHandling?: ErrorHandlingConfig;
}
export interface StepCondition {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater' | 'less' | 'contains' | 'exists';
    value: any;
}
export interface RetryConfig {
    maxAttempts: number;
    backoffStrategy: 'linear' | 'exponential' | 'fixed';
    baseDelay: number;
    maxDelay: number;
}
export interface ErrorHandlingConfig {
    strategy: 'fail' | 'continue' | 'retry' | 'fallback';
    fallbackStep?: string;
    continueOnError?: boolean;
}
export interface WorkflowMetadata {
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
    tags: string[];
    category: string;
    priority: 'low' | 'normal' | 'high' | 'critical';
}
export interface WorkflowExecution {
    id: string;
    workflowId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
    startTime: Date;
    endTime?: Date;
    progress: number;
    currentStep?: string;
    stepExecutions: Map<string, StepExecution>;
    context: WorkflowContext;
    errors: WorkflowError[];
}
export interface StepExecution {
    stepId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'retrying';
    startTime?: Date;
    endTime?: Date;
    attempts: number;
    output?: any;
    error?: string;
    metadata: StepExecutionMetadata;
}
export interface StepExecutionMetadata {
    executionTime?: number;
    resourcesUsed: string[];
    memoryUsage?: number;
    cpuUsage?: number;
}
export interface WorkflowContext {
    variables: Map<string, any>;
    artifacts: Map<string, any>;
    userInputs: Map<string, any>;
    componentStates: Map<string, any>;
}
export interface WorkflowError {
    stepId: string;
    timestamp: Date;
    error: string;
    stack?: string;
    context: any;
}
export interface OrchestrationConfig {
    maxConcurrentExecutions: number;
    defaultTimeout: number;
    persistenceEnabled: boolean;
    metricsEnabled: boolean;
}
export declare class WorkflowEngine extends EventEmitter {
    private config;
    private workflows;
    private executions;
    private componentRegistry;
    private executionQueue;
    private isProcessing;
    constructor(config: OrchestrationConfig);
    initialize(): Promise<void>;
    private loadWorkflowDefinitions;
    private createPredefinedWorkflows;
    private setupComponentRegistry;
    private startExecutionProcessor;
    private setupPersistence;
    createWorkflow(definition: WorkflowDefinition): Promise<void>;
    execute(workflowId: string, parameters?: Record<string, any>): Promise<string>;
    private processExecutionQueue;
    private startExecution;
    private executeWorkflow;
    private calculateExecutionOrder;
    private executeStep;
    private executeStepWithRetry;
    private executeStepAction;
    private executeComponentAction;
    private resolveParameters;
    private resolveValue;
    private evaluateExpression;
    private evaluateConditions;
    private processOutputMapping;
    private getNestedValue;
    private calculateRetryDelay;
    private handleStepError;
    private executeCondition;
    private executeParallel;
    private executeSequential;
    private executeLoop;
    private executeHumanTask;
    private sleep;
    private validateWorkflowDefinition;
    private generateExecutionId;
    getExecution(executionId: string): Promise<WorkflowExecution | undefined>;
    listExecutions(workflowId?: string): Promise<WorkflowExecution[]>;
    cancelExecution(executionId: string): Promise<void>;
    pauseExecution(executionId: string): Promise<void>;
    resumeExecution(executionId: string): Promise<void>;
    registerComponent(name: string, component: any): void;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=workflow-engine.d.ts.map