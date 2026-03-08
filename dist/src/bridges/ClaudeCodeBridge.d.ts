/**
 * Claude Code Bridge
 * Interface to execution engine and agent coordination
 */
import { BaseBridge } from './base/BaseBridge.js';
import { BaseBridgeConfig, BridgeEvent, BridgeResult, HealthStatus } from './types/common.js';
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
    reliability: number;
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
    coordinator: string;
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
    dependencies: string[];
    startedAt?: Date;
    completedAt?: Date;
}
export interface TaskDependency {
    taskId: string;
    dependsOn: string[];
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
        action: 'execution_started' | 'execution_completed' | 'agent_spawned' | 'agent_terminated' | 'task_assigned' | 'coordination_completed';
        details: any;
    };
}
export declare class ClaudeCodeBridge extends BaseBridge {
    protected config: ClaudeCodeConfig;
    private activeExecutions;
    private activeAgents;
    private coordinations;
    private toolInvocations;
    constructor(config: ClaudeCodeConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    performHealthCheck(): Promise<HealthStatus>;
    executeCode(execution: Omit<CodeExecution, 'id' | 'status' | 'createdAt' | 'metrics'>): Promise<BridgeResult<CodeExecution>>;
    getExecutionStatus(executionId: string): Promise<BridgeResult<CodeExecution>>;
    cancelExecution(executionId: string): Promise<BridgeResult<void>>;
    spawnAgent(type: string, name: string, configuration?: Record<string, any>): Promise<BridgeResult<Agent>>;
    terminateAgent(agentId: string): Promise<BridgeResult<void>>;
    assignTask(agentId: string, task: any): Promise<BridgeResult<string>>;
    coordinateTasks(coordination: Omit<TaskCoordination, 'id' | 'status' | 'results'>): Promise<BridgeResult<TaskCoordination>>;
    getCoordinationStatus(coordinationId: string): Promise<BridgeResult<TaskCoordination>>;
    invokeTool(toolName: string, parameters: Record<string, any>, context?: ExecutionContext): Promise<BridgeResult<any>>;
    listAvailableTools(): Promise<BridgeResult<string[]>>;
    private initializeExecutionEngine;
    private establishExecutionConnection;
    private testExecutionCapabilities;
    private executeCodeDirect;
    private setupExecutionMonitoring;
    private monitorActiveExecutions;
    private timeoutExecution;
    private monitorResourceUsage;
    private getResourceUsageStats;
    private initializeAgentCoordinator;
    private establishCoordinatorConnection;
    private registerAsCoordinator;
    private loadAgentCapabilities;
    private loadToolRegistry;
    private loadCustomTools;
    private initializeToolRateLimiters;
    private agentCapabilities;
    private toolRateLimiters;
    private submitExecution;
    private requestAgentSpawn;
    private setupAgentHeartbeat;
    private checkAgentHealth;
    private startTaskCoordination;
    private executeSequentialTasks;
    private executeParallelTasks;
    private executePipelineTasks;
    private executeFanOutTasks;
    private executeFanInTasks;
    private executeCoordinatedTask;
    private executeTaskAsCode;
    private executeTaskAsTool;
    private executeTaskAsAgent;
    private executeTaskAsWorkflow;
    private topologicalSort;
    private waitForTaskDependencies;
    private waitForTaskCompletion;
    private executeToolInvocation;
    private createDefaultContext;
    private checkExecutionEngineHealth;
    private checkAgentCoordinatorHealth;
    private checkToolRegistryHealth;
    private calculateErrorRate;
    private calculateThroughput;
    private createClaudeCodeError;
}
//# sourceMappingURL=ClaudeCodeBridge.d.ts.map