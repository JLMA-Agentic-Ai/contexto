/**
 * Visión Maestra: Workflow Orchestrator
 * Coordinates all 6 platform components using ruflo V3 + ADW methodology
 */
import { EventEmitter } from 'events';
export interface PlatformComponent {
    name: string;
    type: 'frontend' | 'orchestrator' | 'methodology' | 'analysis' | 'navigation' | 'execution';
    protocol: 'http' | 'mcp' | 'file-system' | 'native';
    capabilities: string[];
}
export interface WorkflowContext {
    cardId: string;
    prompt: string;
    projectPath: string;
    businessContext?: any;
    technicalRequirements?: any;
}
export interface WorkflowResult {
    workflowId: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'blocked';
    progress: number;
    currentPhase: string;
    evidence: EvidenceTracker;
    artifacts: WorkflowArtifact[];
}
export interface EvidenceTracker {
    decisions: EvidenceDecision[];
    investigations: Investigation[];
    confidenceScore: number;
}
export interface EvidenceDecision {
    decision: string;
    evidence: 'SOLID' | 'SOFT' | 'SHAKY' | 'UNKNOWN';
    confidence: number;
    sources: string[];
}
export declare class VisualMaestraOrchestrator extends EventEmitter {
    private config;
    private components;
    private activeWorkflows;
    constructor(config: any);
    /**
     * Execute complete card workflow through all 6 components
     */
    executeCard(context: WorkflowContext): Promise<WorkflowResult>;
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
     * Generic bridge integration method
     * TODO: Implement specific bridge protocols
     */
    private integrateBridge;
    private httpBridge;
    private mcpBridge;
    private fileSystemBridge;
    private nativeBridge;
    /**
     * Stream implementation progress to Dossier UI
     */
    private streamImplementationProgress;
    /**
     * Calculate overall confidence score from evidence
     */
    private calculateConfidenceScore;
    /**
     * Initialize all 6 platform components
     */
    private initializeComponents;
    getWorkflowStatus(workflowId: string): WorkflowResult | undefined;
    getAllWorkflows(): WorkflowResult[];
    cancelWorkflow(workflowId: string): boolean;
}
//# sourceMappingURL=WorkflowOrchestrator.d.ts.map