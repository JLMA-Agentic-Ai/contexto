/**
 * ADW Evidence Tracking System for Visión Maestra
 * Implements evidence-based decision making with confidence scoring
 *
 * Evidence: SOLID - ADW methodology requires rigorous evidence tracking
 * Confidence: 98% - Based on scientific methodology best practices
 */
import { EventEmitter } from 'events';
export type EvidenceLevel = 'SOLID' | 'SOFT' | 'SHAKY' | 'UNKNOWN';
export interface Evidence {
    id: string;
    decision: string;
    level: EvidenceLevel;
    confidence: number;
    sources: EvidenceSource[];
    reasoning: string;
    timestamp: Date;
    context: EvidenceContext;
    validatedBy?: string;
    challengedBy?: EvidenceChallenge[];
}
export interface EvidenceSource {
    type: 'code-analysis' | 'documentation' | 'test-results' | 'performance-data' | 'user-feedback' | 'expert-opinion' | 'research-paper';
    identifier: string;
    content: string;
    reliability: number;
    relevance: number;
    timestamp: Date;
    metadata: Record<string, any>;
}
export interface EvidenceChallenge {
    challengerId: string;
    reason: string;
    counterEvidence: EvidenceSource[];
    proposedLevel: EvidenceLevel;
    timestamp: Date;
    status: 'pending' | 'accepted' | 'rejected';
}
export interface EvidenceContext {
    workflowId: string;
    phase: string;
    component: string;
    decisionType: string;
    stakeholders: string[];
    businessImpact: 'low' | 'medium' | 'high' | 'critical';
    technicalComplexity: number;
}
export interface ValidationGate {
    id: string;
    name: string;
    description: string;
    requiredEvidenceLevel: EvidenceLevel;
    minimumConfidence: number;
    criteria: ValidationCriterion[];
    automated: boolean;
}
export interface ValidationCriterion {
    name: string;
    type: 'boolean' | 'numeric' | 'text' | 'composite';
    evaluator: string;
    weight: number;
    required: boolean;
}
export interface ValidationResult {
    gateId: string;
    passed: boolean;
    score: number;
    confidence: number;
    evidenceUsed: string[];
    failures: ValidationFailure[];
    recommendations: string[];
    timestamp: Date;
}
export interface ValidationFailure {
    criterionName: string;
    reason: string;
    severity: 'warning' | 'error' | 'critical';
    evidence: string[];
    suggestedActions: string[];
}
export interface DecisionTree {
    id: string;
    rootDecision: string;
    nodes: DecisionNode[];
    metadata: {
        createdAt: Date;
        updatedAt: Date;
        version: number;
        tags: string[];
    };
}
export interface DecisionNode {
    id: string;
    type: 'decision' | 'evidence' | 'outcome' | 'gate';
    content: string;
    evidenceId?: string;
    children: string[];
    parent?: string;
    confidence: number;
    weight: number;
}
export declare class ADWEvidenceTracker extends EventEmitter {
    private config;
    private evidence;
    private validationGates;
    private decisionTrees;
    private confidenceCalculator;
    private validationEngine;
    constructor(config: {
        confidenceThreshold: number;
        challengePeriod: number;
        autoValidation: boolean;
        evidenceRetention: number;
    });
    /**
     * Record new evidence for a decision
     */
    recordEvidence(evidence: Omit<Evidence, 'id' | 'timestamp'>): Promise<string>;
    /**
     * Challenge existing evidence
     */
    challengeEvidence(evidenceId: string, challengerId: string, reason: string, counterEvidence: EvidenceSource[], proposedLevel: EvidenceLevel): Promise<void>;
    /**
     * Validate evidence through gates
     */
    validateEvidence(evidenceId: string): Promise<ValidationResult[]>;
    /**
     * Get evidence by ID with current confidence
     */
    getEvidence(evidenceId: string): Evidence | undefined;
    /**
     * Search evidence by context or content
     */
    searchEvidence(query: {
        workflowId?: string;
        component?: string;
        level?: EvidenceLevel;
        minConfidence?: number;
        textSearch?: string;
    }): Evidence[];
    /**
     * Create decision tree from evidence
     */
    createDecisionTree(rootDecision: string, evidenceIds: string[], tags?: string[]): Promise<string>;
    /**
     * Get decision tree
     */
    getDecisionTree(treeId: string): DecisionTree | undefined;
    /**
     * Calculate overall confidence for a set of evidence
     */
    calculateOverallConfidence(evidenceIds: string[]): number;
    /**
     * Generate evidence report
     */
    generateEvidenceReport(workflowId: string): any;
    /**
     * Setup default validation gates
     */
    private setupDefaultGates;
    /**
     * Validate evidence level based on sources
     */
    private validateEvidenceLevel;
    /**
     * Get relevant validation gates for context
     */
    private getRelevantGates;
    /**
     * Calculate node weight in decision tree
     */
    private calculateNodeWeight;
    /**
     * Calculate tree confidence from nodes
     */
    private calculateTreeConfidence;
    /**
     * Generate recommendations based on evidence
     */
    private generateRecommendations;
    /**
     * Generate unique evidence ID
     */
    private generateEvidenceId;
    /**
     * Generate unique tree ID
     */
    private generateTreeId;
}
//# sourceMappingURL=adw-evidence-tracker.d.ts.map