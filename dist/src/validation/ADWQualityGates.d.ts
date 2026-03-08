/**
 * Visión Maestra: ADW Quality Gates Implementation
 * Evidence-based validation system for 6-component platform
 */
import { EventEmitter } from 'events';
import { EvidenceTracker, EvidenceDecision } from '../orchestration/WorkflowOrchestrator.js';
export type QualityGateType = 'zero-drift' | 'build' | 'requirements' | 'architecture' | 'adr-compliance' | 'deployment' | 'evidence-quality';
export type GateResult = 'PASS' | 'FAIL' | 'BLOCKED' | 'INVESTIGATION_REQUIRED';
export interface QualityGate {
    id: string;
    type: QualityGateType;
    name: string;
    description: string;
    evidenceThreshold: number;
    required: boolean;
    dependencies: string[];
    validationRules: ValidationRule[];
}
export interface ValidationRule {
    id: string;
    name: string;
    condition: string;
    errorMessage: string;
    severity: 'warning' | 'error' | 'critical';
}
export interface GateExecution {
    gateId: string;
    workflowId: string;
    result: GateResult;
    confidence: number;
    evidence: EvidenceDecision[];
    validationResults: ValidationResult[];
    timestamp: Date;
    executionTimeMs: number;
    investigationTriggered?: boolean;
}
export interface ValidationResult {
    ruleId: string;
    passed: boolean;
    message: string;
    evidence?: string[];
    confidence: number;
}
export interface AdversarialReview {
    reviewerId: string;
    gateId: string;
    challenges: Challenge[];
    overallAssessment: 'APPROVED' | 'REJECTED' | 'NEEDS_INVESTIGATION';
    confidence: number;
}
export interface Challenge {
    aspect: string;
    concern: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    evidence?: string[];
    suggestedAction: string;
}
/**
 * ADW Quality Gates System
 * Implements evidence-based validation with adversarial review
 */
export declare class ADWQualityGates extends EventEmitter {
    private gates;
    private executions;
    private adversarialReviews;
    constructor();
    /**
     * Initialize the 7 ADW quality gates
     */
    private initializeDefaultGates;
    /**
     * Register a quality gate
     */
    private registerGate;
    /**
     * Execute a specific quality gate
     */
    executeGate(gateId: string, workflowId: string, evidence: EvidenceTracker, validationData: any): Promise<GateExecution>;
    /**
     * Execute all quality gates in sequence
     */
    executeAllGates(workflowId: string, evidence: EvidenceTracker, validationData: any): Promise<GateExecution[]>;
    /**
     * Validate gate dependencies
     */
    private validateDependencies;
    /**
     * Execute validation rules for a gate
     */
    private executeValidationRules;
    /**
     * Simple condition evaluator (replace with safer implementation in production)
     */
    private evaluateCondition;
    /**
     * Calculate gate confidence based on evidence and validation results
     */
    private calculateGateConfidence;
    /**
     * Determine gate result based on confidence and validation
     */
    private determineGateResult;
    /**
     * Check if investigation should be triggered
     */
    private shouldTriggerInvestigation;
    /**
     * Trigger adversarial review for critical gates
     */
    private triggerAdversarialReview;
    /**
     * Get gate execution history for a workflow
     */
    getWorkflowGateHistory(workflowId: string): GateExecution[];
    /**
     * Get overall workflow compliance status
     */
    getWorkflowCompliance(workflowId: string): {
        overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL';
        passedGates: number;
        totalGates: number;
        confidence: number;
    };
    /**
     * Get quality gates summary
     */
    getQualityGatesSummary(): any;
}
//# sourceMappingURL=ADWQualityGates.d.ts.map