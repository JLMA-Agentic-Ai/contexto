/**
 * Enhanced ADW Validation Orchestrator
 * Executes systematic Gates 2-6 with truth scoring ≥0.95 and evidence tracking
 */
import { EventEmitter } from 'events';
import { EvidenceConfidence } from '../orchestration/WorkflowOrchestrator.js';
export interface EnhancedValidationConfig {
    truthScoreThreshold: number;
    maxCorrectionCycles: number;
    autoRollbackEnabled: boolean;
    evidenceFramework: 'SOLID_SOFT_SHAKY_UNKNOWN';
    adversarialReviewEnabled: boolean;
}
export interface ValidationResult {
    gateId: string;
    gateName: string;
    truthScore: number;
    evidenceQuality: EvidenceConfidence;
    adversarialChallenges: AdversarialChallenge[];
    correctionCycles: number;
    status: 'PASS' | 'FAIL' | 'INVESTIGATION_REQUIRED' | 'ROLLED_BACK';
    timestamp: Date;
}
export interface AdversarialChallenge {
    aspect: string;
    challenge: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    evidence: string[];
    resolution: string;
    resolutionConfidence: number;
}
export interface TruthScoringMetrics {
    overallTruthScore: number;
    gateScores: Map<string, number>;
    evidenceCoverage: number;
    confidenceCalibration: number;
    investigationCompleteness: number;
}
/**
 * Enhanced ADW Validation Orchestrator
 * Implements systematic Gate 2-6 validation with enhanced truth scoring
 */
export declare class EnhancedADWValidationOrchestrator extends EventEmitter {
    private qualityGates;
    private config;
    private validationResults;
    private truthScoringMetrics;
    private circuitBreakerState;
    private correctionCycleCount;
    constructor(config?: Partial<EnhancedValidationConfig>);
    private initializeTruthScoringMetrics;
    private setupEventHandlers;
    /**
     * Execute enhanced ADW validation for Gates 2-6
     */
    executeEnhancedValidation(workflowId: string): Promise<TruthScoringMetrics>;
    /**
     * GATE 2: Business Requirements Validation
     */
    private executeGate2Requirements;
    /**
     * GATE 3: Architecture Validation
     */
    private executeGate3Architecture;
    /**
     * GATE 4: ADR Compliance Validation
     */
    private executeGate4ADRCompliance;
    /**
     * GATE 5: Deployment Readiness
     */
    private executeGate5DeploymentReadiness;
    /**
     * GATE 6: Evidence Quality Meta-Validation
     */
    private executeGate6EvidenceMetaValidation;
    /**
     * Gather evidence for requirements validation
     */
    private gatherRequirementsEvidence;
    /**
     * Gather evidence for architecture validation
     */
    private gatherArchitectureEvidence;
    /**
     * Perform cross-ADR consistency analysis
     */
    private performCrossADRAnalysis;
    /**
     * Gather evidence for deployment readiness
     */
    private gatherDeploymentEvidence;
    /**
     * Perform adversarial review of gate execution
     */
    private performAdversarialReview;
    /**
     * Classify evidence quality based on confidence score
     */
    private classifyEvidenceQuality;
    /**
     * Calculate evidence coverage across all gates
     */
    private calculateEvidenceCoverage;
    /**
     * Calculate final truth score across all validated gates
     */
    private calculateFinalTruthScore;
    private calculateOverallEvidenceCoverage;
    private calculateConfidenceCalibration;
    private calculateInvestigationCompleteness;
    /**
     * Handle gate execution results
     */
    private processGateExecution;
    private handleInvestigationRequired;
    private handleGateSequenceFailure;
    /**
     * Trigger auto-rollback protection
     */
    private triggerAutoRollback;
    /**
     * Get validation status and metrics
     */
    getValidationStatus(): {
        truthScoringMetrics: TruthScoringMetrics;
        circuitBreakerState: string;
        correctionCycles: number;
        validationResults: ValidationResult[];
    };
}
//# sourceMappingURL=EnhancedADWValidationOrchestrator.d.ts.map