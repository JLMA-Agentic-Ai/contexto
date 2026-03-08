/**
 * Core Platform Orchestrator for Visión Maestra
 * Manages integration and coordination of all 6 components
 */
import { EventEmitter } from 'events';
import { ComponentBridge } from '../../bridges/base/component-bridge';
import { PlatformConfig } from '../../../config/platform/platform-config';
export interface ComponentRegistry {
    dossier: ComponentBridge;
    ruflo: ComponentBridge;
    adwSkills: ComponentBridge;
    gitnexus: ComponentBridge;
    rlmNavigator: ComponentBridge;
    claudeCode: ComponentBridge;
}
export interface PlatformState {
    components: Map<string, ComponentStatus>;
    workflows: Map<string, WorkflowStatus>;
    streams: Map<string, StreamStatus>;
    performance: PerformanceMetrics;
}
export interface ComponentStatus {
    id: string;
    name: string;
    status: 'initializing' | 'ready' | 'busy' | 'error' | 'offline';
    lastUpdate: Date;
    health: HealthMetrics;
    capabilities: string[];
}
export interface WorkflowStatus {
    id: string;
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    progress: number;
    startTime: Date;
    endTime?: Date;
    dependencies: string[];
}
export interface StreamStatus {
    id: string;
    type: 'websocket' | 'sse' | 'grpc' | 'webhook';
    status: 'connecting' | 'connected' | 'error' | 'closed';
    connections: number;
    throughput: number;
}
export interface HealthMetrics {
    uptime: number;
    responseTime: number;
    errorRate: number;
    memoryUsage: number;
    cpuUsage: number;
}
export interface PerformanceMetrics {
    totalRequests: number;
    averageResponseTime: number;
    throughput: number;
    errorRate: number;
    activeConnections: number;
}
export declare class PlatformOrchestrator extends EventEmitter {
    private components;
    private streamingProtocol;
    private workflowEngine;
    private config;
    private state;
    private healthCheckInterval?;
    constructor(config: PlatformConfig);
    private initializeState;
    private setupEventHandlers;
    initialize(): Promise<void>;
    private registerComponents;
    private initializeComponents;
    private setupCommunication;
    private startHealthMonitoring;
    private performHealthCheck;
    private updateComponentStatus;
    private updateComponentHealth;
    private handleComponentStatus;
    private handleWorkflowStatus;
    private handleStreamStatus;
    executeWorkflow(workflowId: string, params: any): Promise<any>;
    sendMessage(componentName: string, message: any): Promise<any>;
    getState(): PlatformState;
    getComponentStatus(name: string): ComponentStatus | undefined;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=platform-orchestrator.d.ts.map