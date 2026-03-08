/**
 * Bridge Integration System Entry Point
 * Exports all bridges, types, and utilities for integration use
 */
export { BaseBridge } from './base/BaseBridge.js';
export { DossierBridge } from './DossierBridge.js';
export { RufloBridge } from './RufloBridge.js';
export { ADWSkillsBridge } from './ADWSkillsBridge.js';
export { GitNexusBridge } from './GitNexusBridge.js';
export { RLMNavigatorBridge } from './RLMNavigatorBridge.js';
export { ClaudeCodeBridge } from './ClaudeCodeBridge.js';
export * from './types/common.js';
export * from './events/EventTypes.js';
export * from './errors/ErrorHandling.js';
export type { DossierConfig, DossierTask, DossierWorkflow, DossierWorkflowStep, UIComponentState, OrchestrationEvent } from './DossierBridge.js';
export type { RufloConfig, RufloAgent, RufloTask, SwarmConfiguration, SwarmState, RufloMemoryItem, TaskExecutionEvent } from './RufloBridge.js';
export type { ADWConfig, ADWInvestigation, ADWHypothesis, ADWTest, ADWSkill, ADWSkillParameter, ADWSkillOutput, ADWTimelineEvent, ADWWorkflowTemplate, ADWWorkflowStep, InvestigationEvent } from './ADWSkillsBridge.js';
export type { GitNexusConfig, GitRepository, CodeSymbol, CodeRelationship, ExecutionFlow, ExecutionStep, GraphQuery, GraphQueryResult, ImpactAnalysis, CodeInsight, IndexingEvent } from './GitNexusBridge.js';
export type { RLMNavigatorConfig, ASTNode, NodeReference, NavigationSession, NavigationStep, NavigationBookmark, NavigationFilter, SemanticQuery, SemanticResult, ControlFlowGraph, CFGNode, CFGEdge, DataFlowAnalysis, VariableFlow, DataDependency, DefUseChain, LiveVariable, NavigationEvent } from './RLMNavigatorBridge.js';
export type { ClaudeCodeConfig, ExecutionContext, ExecutionPermissions, ExecutionResources, ExecutionConstraints, CodeExecution, ExecutionResult, ExecutionArtifact, ExecutionMetrics, Agent, AgentCapability, CapabilityParameter, CapabilityOutput, AgentPerformance, TaskCoordination, CoordinatedTask, TaskDependency, TaskResult, ToolInvocation, ClaudeCodeEvent } from './ClaudeCodeBridge.js';
export interface BridgeFactory {
    createDossierBridge(config: any): DossierBridge;
    createRufloBridge(config: any): RufloBridge;
    createADWSkillsBridge(config: any): ADWSkillsBridge;
    createGitNexusBridge(config: any): GitNexusBridge;
    createRLMNavigatorBridge(config: any): RLMNavigatorBridge;
    createClaudeCodeBridge(config: any): ClaudeCodeBridge;
}
export interface BridgeRegistry {
    register(id: string, bridge: BaseBridge): void;
    unregister(id: string): void;
    get(id: string): BaseBridge | undefined;
    list(): string[];
    getAll(): Map<string, BaseBridge>;
}
export interface BridgeOrchestrator {
    initialize(config: any): Promise<void>;
    start(): Promise<void>;
    stop(): Promise<void>;
    status(): BridgeOrchestratorStatus;
    getBridge(id: string): BaseBridge | undefined;
    executeWorkflow(workflow: BridgeWorkflow): Promise<BridgeWorkflowResult>;
}
export interface BridgeOrchestratorStatus {
    status: 'initializing' | 'running' | 'stopping' | 'stopped' | 'error';
    bridges: {
        id: string;
        name: string;
        status: 'connected' | 'disconnected' | 'error';
        health: 'healthy' | 'degraded' | 'unhealthy';
    }[];
    startedAt?: Date;
    lastHealthCheck: Date;
}
export interface BridgeWorkflow {
    id: string;
    name: string;
    description: string;
    steps: BridgeWorkflowStep[];
    variables?: Record<string, any>;
    timeout?: number;
}
export interface BridgeWorkflowStep {
    id: string;
    name: string;
    bridgeId: string;
    operation: string;
    parameters: Record<string, any>;
    dependencies?: string[];
    timeout?: number;
    retryPolicy?: {
        maxAttempts: number;
        backoffStrategy: 'fixed' | 'exponential';
        baseDelay: number;
    };
    condition?: string;
}
export interface BridgeWorkflowResult {
    workflowId: string;
    success: boolean;
    results: Record<string, any>;
    errors: any[];
    executionTime: number;
    stepResults: BridgeStepResult[];
    completedAt: Date;
}
export interface BridgeStepResult {
    stepId: string;
    success: boolean;
    result?: any;
    error?: any;
    executionTime: number;
    startedAt: Date;
    completedAt: Date;
}
export declare class BridgeUtils {
    /**
     * Create a bridge configuration from environment variables
     */
    static createConfigFromEnv(bridgeType: string): any;
    /**
     * Validate bridge configuration
     */
    static validateConfig(config: any, schema: any): boolean;
    /**
     * Merge configurations with defaults
     */
    static mergeConfigs(config: any, defaults: any): any;
    /**
     * Create a standardized bridge ID
     */
    static createBridgeId(bridgeType: string, instanceName?: string): string;
    /**
     * Parse event correlation patterns
     */
    static parseEventPattern(pattern: string): any;
    /**
     * Generate event fingerprint for deduplication
     */
    static generateEventFingerprint(event: any): string;
}
import type { DossierConfig, RufloConfig, ADWConfig, GitNexusConfig, RLMNavigatorConfig, ClaudeCodeConfig } from './index.js';
export declare class DefaultBridgeFactory implements BridgeFactory {
    createDossierBridge(config: DossierConfig): DossierBridge;
    createRufloBridge(config: RufloConfig): RufloBridge;
    createADWSkillsBridge(config: ADWConfig): ADWSkillsBridge;
    createGitNexusBridge(config: GitNexusConfig): GitNexusBridge;
    createRLMNavigatorBridge(config: RLMNavigatorConfig): RLMNavigatorBridge;
    createClaudeCodeBridge(config: ClaudeCodeConfig): ClaudeCodeBridge;
}
export declare class DefaultBridgeRegistry implements BridgeRegistry {
    private bridges;
    register(id: string, bridge: BaseBridge): void;
    unregister(id: string): void;
    get(id: string): BaseBridge | undefined;
    list(): string[];
    getAll(): Map<string, BaseBridge>;
}
export declare const bridgeFactory: DefaultBridgeFactory;
export declare const bridgeRegistry: DefaultBridgeRegistry;
/**
 * Quick setup function for common bridge configurations
 */
export declare function setupBridges(config: {
    dossier?: DossierConfig;
    ruflo?: RufloConfig;
    adwSkills?: ADWConfig;
    gitNexus?: GitNexusConfig;
    rlmNavigator?: RLMNavigatorConfig;
    claudeCode?: ClaudeCodeConfig;
}): Promise<Map<string, BaseBridge>>;
//# sourceMappingURL=index.d.ts.map