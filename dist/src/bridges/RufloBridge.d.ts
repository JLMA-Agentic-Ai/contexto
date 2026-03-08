/**
 * Ruflo Bridge
 * Interface to ruflo V3 task management and swarm coordination
 */
import { BaseBridge } from './base/BaseBridge.js';
import { BaseBridgeConfig, BridgeEvent, BridgeResult, HealthStatus } from './types/common.js';
export interface RufloConfig extends BaseBridgeConfig {
    rufloApi: {
        baseUrl: string;
        apiKey: string;
        version: string;
    };
    swarm: {
        topology: 'hierarchical' | 'mesh' | 'hybrid';
        maxAgents: number;
        strategy: 'balanced' | 'specialized' | 'adaptive';
        consensus: 'raft' | 'pbft' | 'simple';
    };
    memory: {
        type: 'local' | 'distributed' | 'hybrid';
        hnswEnabled: boolean;
        vectorDimensions: number;
        maxMemorySize: number;
    };
    neural: {
        enabled: boolean;
        modelRouting: boolean;
        tierStrategy: '3-tier' | 'dynamic';
    };
}
export interface RufloAgent {
    id: string;
    type: string;
    name: string;
    status: 'idle' | 'busy' | 'failed' | 'terminated';
    capabilities: string[];
    currentTask?: string;
    performance: {
        tasksCompleted: number;
        averageResponseTime: number;
        errorRate: number;
    };
    metadata: Record<string, any>;
    createdAt: Date;
    lastActive: Date;
}
export interface RufloTask {
    id: string;
    type: string;
    description: string;
    priority: number;
    status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed' | 'cancelled';
    assignedAgent?: string;
    estimatedComplexity: number;
    dependencies: string[];
    input: Record<string, any>;
    output?: Record<string, any>;
    error?: string;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
}
export interface SwarmConfiguration {
    id: string;
    name: string;
    topology: string;
    maxAgents: number;
    strategy: string;
    agentTypes: string[];
    coordination: {
        consensus: string;
        leaderElection: boolean;
        faultTolerance: boolean;
    };
    memory: {
        shared: boolean;
        namespace: string;
        persistenceLevel: 'none' | 'session' | 'permanent';
    };
}
export interface SwarmState {
    id: string;
    status: 'initializing' | 'active' | 'paused' | 'terminating' | 'terminated';
    agents: RufloAgent[];
    activeTasks: RufloTask[];
    queuedTasks: RufloTask[];
    performance: {
        throughput: number;
        utilization: number;
        coordinationOverhead: number;
    };
    lastUpdated: Date;
}
export interface RufloMemoryItem {
    id: string;
    namespace: string;
    key: string;
    value: any;
    vectorEmbedding?: number[];
    metadata: Record<string, any>;
    ttl?: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface TaskExecutionEvent extends BridgeEvent {
    data: {
        taskId: string;
        agentId?: string;
        status: RufloTask['status'];
        progress?: number;
        result?: any;
        error?: string;
    };
}
export declare class RufloBridge extends BaseBridge {
    private config;
    private activeSwarms;
    private agents;
    private tasks;
    private memory;
    constructor(config: RufloConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    performHealthCheck(): Promise<HealthStatus>;
    initializeSwarm(config: SwarmConfiguration): Promise<BridgeResult<SwarmState>>;
    terminateSwarm(swarmId: string): Promise<BridgeResult<void>>;
    getSwarmState(swarmId: string): Promise<BridgeResult<SwarmState>>;
    spawnAgent(type: string, name: string, config?: Record<string, any>): Promise<BridgeResult<RufloAgent>>;
    private getAgentCapabilities;
    terminateAgent(agentId: string): Promise<BridgeResult<void>>;
    createTask(task: Omit<RufloTask, 'id' | 'createdAt' | 'status'>): Promise<BridgeResult<RufloTask>>;
    executeTask(taskId: string, agentId?: string): Promise<BridgeResult<any>>;
    cancelTask(taskId: string): Promise<BridgeResult<void>>;
    storeMemory(namespace: string, key: string, value: any, metadata?: Record<string, any>): Promise<BridgeResult<void>>;
    retrieveMemory(namespace: string, key: string): Promise<BridgeResult<any>>;
    searchMemory(namespace: string, query: string, limit?: number): Promise<BridgeResult<RufloMemoryItem[]>>;
    private initializeRufloConnection;
    private initializeMCPClient;
    private ensureDaemonRunning;
    private waitForDaemonReady;
    private sendMCPRequest;
    private setupEventStreams;
    private subscribeToRufloEvents;
    private setupStreamingForwarding;
    private initializeMemorySystem;
    private initializeHNSWIndex;
    private setupHealthMonitoring;
    private spawnAgentsForSwarm;
    private queueTask;
    private generateEmbedding;
    private checkRufloAPIHealth;
    private checkSwarmHealth;
    private checkMemoryHealth;
    private calculateErrorRate;
    private calculateThroughput;
    private createRufloError;
}
//# sourceMappingURL=RufloBridge.d.ts.map