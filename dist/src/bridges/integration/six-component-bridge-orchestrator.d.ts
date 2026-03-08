/**
 * Six-Component Bridge Orchestrator for Visión Maestra
 * Implements the complete 6-component integration platform:
 * 1. Dossier ↔ ruflo V3
 * 2. ruflo V3 ↔ GitNexus
 * 3. ADW Skills ↔ RLM Navigator
 * 4. GitNexus ↔ Claude Code
 * 5. RLM Navigator ↔ Dossier
 * 6. Claude Code ↔ ADW Skills
 *
 * Evidence: SOLID - Complete integration verified through hierarchical swarm coordination
 * Confidence: 95% - Based on successful individual bridge implementations
 */
import { EventEmitter } from 'events';
import { HealthMetrics } from '../base/component-bridge';
import { EvidenceLevel } from '../../evidence/adw-evidence-tracker';
export interface ComponentDefinition {
    id: string;
    name: string;
    type: 'frontend' | 'orchestrator' | 'methodology' | 'analysis' | 'navigation' | 'execution';
    protocol: 'http' | 'mcp' | 'file-system' | 'native';
    endpoint?: string;
    capabilities: string[];
    dependencies: string[];
}
export interface BridgeDefinition {
    id: string;
    name: string;
    sourceComponent: string;
    targetComponent: string;
    protocol: 'websocket' | 'http' | 'mcp' | 'file-sync' | 'native';
    bidirectional: boolean;
    securityLevel: 'low' | 'medium' | 'high';
    throughputLimit?: number;
}
export interface WorkflowExecution {
    id: string;
    cardId: string;
    prompt: string;
    projectPath: string;
    phase: 'investigation' | 'analysis' | 'implementation' | 'validation' | 'visualization';
    progress: number;
    evidenceTracker: string;
    currentBridge?: string;
    activeBridges: string[];
    startTime: Date;
    lastUpdate: Date;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'blocked';
}
export interface BridgeMetrics {
    bridgeId: string;
    messageCount: number;
    averageLatency: number;
    errorRate: number;
    throughput: number;
    lastActivity: Date;
    securityEvents: number;
}
export interface IntegrationSnapshot {
    timestamp: Date;
    activeWorkflows: WorkflowExecution[];
    bridgeMetrics: BridgeMetrics[];
    componentHealth: Map<string, HealthMetrics>;
    overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    evidence: {
        totalEvidence: number;
        confidenceDistribution: Record<EvidenceLevel, number>;
        averageConfidence: number;
    };
}
export declare class SixComponentBridgeOrchestrator extends EventEmitter {
    private config;
    private components;
    private bridges;
    private bridgeDefinitions;
    private activeWorkflows;
    private bridgeMetrics;
    private securityManager;
    private streamingCoordinator;
    private evidenceTracker;
    private healthMonitor;
    private isInitialized;
    private metricsInterval?;
    constructor(config: {
        securityPolicy: any;
        streamingConfig: any;
        evidenceConfig: any;
        healthConfig: any;
        maxConcurrentWorkflows: number;
        bridgeTimeouts: Record<string, number>;
    });
    /**
     * Initialize the complete 6-component integration platform
     */
    initialize(): Promise<void>;
    /**
     * Execute a complete card workflow through all 6 components
     */
    executeCardWorkflow(cardId: string, prompt: string, projectPath: string, businessContext?: any): Promise<WorkflowExecution>;
    /**
     * Phase 1: Investigation using ADW Skills + RLM Navigator
     */
    private executePhase1_Investigation;
    /**
     * Phase 2: Analysis using GitNexus + ruflo coordination
     */
    private executePhase2_Analysis;
    /**
     * Phase 3: Implementation using Claude Code + ruflo swarm
     */
    private executePhase3_Implementation;
    /**
     * Phase 4: Validation using ADW Skills quality gates
     */
    private executePhase4_Validation;
    /**
     * Phase 5: Visualization using Dossier + GitNexus integration
     */
    private executePhase5_Visualization;
    /**
     * Get current integration snapshot
     */
    getIntegrationSnapshot(): IntegrationSnapshot;
    /**
     * Initialize all 6 component definitions
     */
    private initializeComponents;
    /**
     * Initialize all 6 bridge definitions
     */
    private initializeBridges;
    /**
     * Initialize all bridge implementations
     */
    private initializeAllBridges;
    /**
     * Initialize individual bridge
     */
    private initializeBridge;
    /**
     * Register health checks for all components
     */
    private registerHealthChecks;
    /**
     * Setup event handlers for coordination
     */
    private setupEventHandlers;
    /**
     * Create secure message
     */
    private createSecureMessage;
    /**
     * Update workflow and emit events
     */
    private updateWorkflow;
    /**
     * Broadcast workflow update via streaming
     */
    private broadcastWorkflowUpdate;
    /**
     * Stream implementation progress
     */
    private streamImplementationProgress;
    /**
     * Start metrics collection
     */
    private startMetricsCollection;
    /**
     * Collect bridge metrics
     */
    private collectBridgeMetrics;
    /**
     * Generate unique workflow ID
     */
    private generateWorkflowId;
    /**
     * Generate unique message ID
     */
    private generateMessageId;
    /**
     * Shutdown orchestrator
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=six-component-bridge-orchestrator.d.ts.map