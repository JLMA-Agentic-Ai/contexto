/**
 * Visión Maestra: Main Platform Integration
 * Coordinates all 6 components for autonomous development platform
 *
 * Entry point for the complete platform orchestration
 */
import { EventEmitter } from 'events';
import { WorkflowContext, WorkflowResult } from '../orchestration/WorkflowOrchestrator.js';
export interface PlatformConfig {
    environment: 'development' | 'staging' | 'production';
    components: {
        dossier: ComponentConfig;
        ruflo: ComponentConfig;
        adwSkills: ComponentConfig;
        gitNexus: ComponentConfig;
        rlmNavigator: ComponentConfig;
        claudeCode: ComponentConfig;
    };
    performance: PerformanceConfig;
    security: SecurityConfig;
    evidence: EvidenceConfig;
}
export interface ComponentConfig {
    enabled: boolean;
    endpoint?: string;
    authentication?: AuthConfig;
    healthCheck: {
        enabled: boolean;
        interval: number;
        timeout: number;
    };
    retry: {
        attempts: number;
        backoffMs: number;
    };
}
export interface PerformanceConfig {
    streamingLatencyTarget: number;
    coordinationTimeout: number;
    healthCheckInterval: number;
    memoryOptimization: boolean;
    flashAttention: boolean;
}
export interface SecurityConfig {
    zeroTrust: boolean;
    authentication: {
        required: boolean;
        methods: string[];
        tokenExpiry: number;
    };
    authorization: {
        rbac: boolean;
        permissions: string[];
    };
    encryption: {
        inTransit: boolean;
        atRest: boolean;
        algorithm: string;
    };
    audit: {
        enabled: boolean;
        retention: number;
    };
}
export interface EvidenceConfig {
    tracking: {
        enabled: boolean;
        confidenceThreshold: number;
        investigationDepth: 'skim' | 'scan' | 'dig' | 'drill' | 'siege';
    };
    qualityGates: {
        enabled: boolean;
        requiredGates: string[];
        evidenceThreshold: number;
    };
    dashboard: {
        realTime: boolean;
        alerting: boolean;
        retention: number;
    };
}
export interface AuthConfig {
    type: 'jwt' | 'oauth2' | 'api-key' | 'internal';
    credentials?: string;
    endpoint?: string;
}
export interface PlatformStatus {
    status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
    version: string;
    uptime: number;
    components: ComponentStatus[];
    performance: PerformanceMetrics;
    evidence: EvidenceMetrics;
    lastHealthCheck: Date;
}
export interface ComponentStatus {
    name: string;
    status: 'healthy' | 'degraded' | 'unhealthy' | 'offline';
    latency: number;
    errorRate: number;
    lastCheck: Date;
    version?: string;
}
export interface PerformanceMetrics {
    streamingLatency: number;
    coordinationLatency: number;
    memoryUsage: number;
    cpuUsage: number;
    activeConnections: number;
    throughput: number;
}
export interface EvidenceMetrics {
    totalDecisions: number;
    averageConfidence: number;
    qualityDistribution: {
        SOLID: number;
        SOFT: number;
        SHAKY: number;
        UNKNOWN: number;
    };
    activeInvestigations: number;
    qualityGatesPassed: number;
    qualityGatesFailed: number;
}
/**
 * Main Platform Integration Class
 * Orchestrates the complete 6-component autonomous development platform
 */
export declare class VisualMaestraPlatform extends EventEmitter {
    private config;
    private orchestrator;
    private streamingManager;
    private qualityGates;
    private evidenceDashboard;
    private startTime;
    private healthCheckInterval?;
    constructor(config: PlatformConfig);
    /**
     * Initialize and start the complete platform
     */
    initialize(): Promise<void>;
    /**
     * Initialize core infrastructure
     */
    private initializeInfrastructure;
    /**
     * Initialize all 6 platform components
     */
    private initializeComponents;
    /**
     * Initialize streaming and real-time communication
     */
    private initializeStreaming;
    /**
     * Initialize quality gates and evidence tracking
     */
    private initializeQualitySystems;
    /**
     * Initialize health monitoring
     */
    private initializeHealthMonitoring;
    /**
     * Execute a card workflow through the complete platform
     */
    executeCardWorkflow(cardContext: WorkflowContext): Promise<WorkflowResult>;
    /**
     * Execute quality gates for a completed workflow
     */
    private executeQualityGates;
    /**
     * Get current platform status
     */
    getPlatformStatus(): Promise<PlatformStatus>;
    /**
     * Shutdown the platform gracefully
     */
    shutdown(): Promise<void>;
    /**
     * Setup event coordination between components
     */
    private setupEventCoordination;
    /**
     * Handle stream events from components
     */
    private handleStreamEvent;
    private handleDossierEvent;
    private handleRufloEvent;
    private handleGitNexusEvent;
    /**
     * Trigger investigation based on quality gate requirements
     */
    private triggerInvestigation;
    /**
     * Validate platform configuration
     */
    private validateConfiguration;
    /**
     * Initialize individual component
     */
    private initializeComponent;
    /**
     * Initialize security systems
     */
    private initializeSecurity;
    /**
     * Enable Flash Attention optimizations
     */
    private enableFlashAttentionOptimizations;
    /**
     * Validate workflow context before execution
     */
    private validateWorkflowContext;
    /**
     * Perform periodic health check
     */
    private performHealthCheck;
    /**
     * Get status of all components
     */
    private getComponentStatuses;
    /**
     * Get performance metrics
     */
    private getPerformanceMetrics;
    /**
     * Get evidence metrics
     */
    private getEvidenceMetrics;
    /**
     * Determine overall platform status
     */
    private determineOverallStatus;
    /**
     * Get list of enabled components
     */
    private getEnabledComponents;
    /**
     * Shutdown all components gracefully
     */
    private shutdownComponents;
}
//# sourceMappingURL=VisualMaestraMain.d.ts.map