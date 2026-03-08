/**
 * ADW Skills Bridge
 * Interface to ADW methodology and investigation workflows
 */
import { BaseBridge } from './base/BaseBridge.js';
import { BaseBridgeConfig, BridgeEvent, BridgeResult, HealthStatus, Evidence } from './types/common.js';
export interface ADWConfig extends BaseBridgeConfig {
    methodology: {
        version: string;
        strictMode: boolean;
        evidenceThreshold: number;
        hypothesisLifetime: number;
    };
    investigation: {
        maxParallelInvestigations: number;
        defaultTimeout: number;
        evidenceStorage: 'local' | 'distributed' | 'hybrid';
    };
    skills: {
        enabledSkills: string[];
        skillRegistry: string;
        autoDiscovery: boolean;
    };
    workflow: {
        templates: string[];
        customSteps: boolean;
        approvalRequired: boolean;
    };
}
export interface ADWInvestigation {
    id: string;
    title: string;
    description: string;
    status: 'planning' | 'active' | 'analysis' | 'concluded' | 'archived';
    methodology: 'pure-adw' | 'adw-hybrid' | 'guided-adw';
    investigator: string;
    objectives: string[];
    hypotheses: ADWHypothesis[];
    evidence: Evidence[];
    timeline: ADWTimelineEvent[];
    priority: 'low' | 'medium' | 'high' | 'critical';
    tags: string[];
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    concludedAt?: Date;
}
export interface ADWHypothesis {
    id: string;
    statement: string;
    type: 'primary' | 'alternative' | 'null';
    confidence: number;
    status: 'proposed' | 'testing' | 'supported' | 'refuted' | 'abandoned';
    supportingEvidence: string[];
    contradictingEvidence: string[];
    tests: ADWTest[];
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ADWTest {
    id: string;
    name: string;
    type: 'observation' | 'experiment' | 'analysis' | 'interview';
    description: string;
    methodology: string;
    status: 'planned' | 'running' | 'completed' | 'failed';
    parameters: Record<string, any>;
    expectedOutcomes: string[];
    actualOutcomes?: string[];
    evidence?: Evidence[];
    assignedTo?: string;
    estimatedDuration?: number;
    actualDuration?: number;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
}
export interface ADWSkill {
    id: string;
    name: string;
    description: string;
    category: 'observation' | 'analysis' | 'experimentation' | 'documentation';
    version: string;
    parameters: ADWSkillParameter[];
    outputs: ADWSkillOutput[];
    prerequisites?: string[];
    estimatedDuration?: number;
    complexity: 'low' | 'medium' | 'high';
    reliability: number;
    metadata: Record<string, any>;
}
export interface ADWSkillParameter {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    required: boolean;
    default?: any;
    description: string;
    validation?: {
        min?: number;
        max?: number;
        pattern?: string;
        enum?: any[];
    };
}
export interface ADWSkillOutput {
    name: string;
    type: 'evidence' | 'data' | 'report' | 'conclusion';
    description: string;
    schema?: Record<string, any>;
}
export interface ADWTimelineEvent {
    id: string;
    type: 'hypothesis_created' | 'test_started' | 'evidence_collected' | 'conclusion_drawn' | 'milestone_reached';
    timestamp: Date;
    description: string;
    actor: string;
    relatedItems: {
        hypotheses?: string[];
        tests?: string[];
        evidence?: string[];
    };
    impact: 'low' | 'medium' | 'high';
}
export interface ADWWorkflowTemplate {
    id: string;
    name: string;
    description: string;
    category: string;
    steps: ADWWorkflowStep[];
    estimatedDuration: number;
    complexity: 'beginner' | 'intermediate' | 'advanced';
    prerequisites: string[];
    outcomes: string[];
    version: string;
    author: string;
    tags: string[];
}
export interface ADWWorkflowStep {
    id: string;
    name: string;
    type: 'skill' | 'manual' | 'approval' | 'condition' | 'parallel' | 'loop';
    description: string;
    config: Record<string, any>;
    dependencies?: string[];
    timeout?: number;
    retryPolicy?: {
        maxAttempts: number;
        backoffMultiplier: number;
    };
    successCriteria?: string[];
    failureCriteria?: string[];
}
export interface InvestigationEvent extends BridgeEvent {
    data: {
        investigationId: string;
        action: 'created' | 'updated' | 'evidence_added' | 'hypothesis_tested' | 'concluded';
        details: any;
    };
}
export declare class ADWSkillsBridge extends BaseBridge {
    private config;
    private activeInvestigations;
    private skillRegistry;
    private workflowTemplates;
    private evidenceStore;
    constructor(config: ADWConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    performHealthCheck(): Promise<HealthStatus>;
    createInvestigation(investigation: Omit<ADWInvestigation, 'id' | 'createdAt' | 'updatedAt' | 'evidence' | 'timeline'>): Promise<BridgeResult<ADWInvestigation>>;
    addHypothesis(investigationId: string, hypothesis: Omit<ADWHypothesis, 'id' | 'createdAt' | 'updatedAt' | 'tests'>): Promise<BridgeResult<ADWHypothesis>>;
    collectEvidence(investigationId: string, evidence: Omit<Evidence, 'id' | 'timestamp'>): Promise<BridgeResult<Evidence>>;
    executeSkill(skillId: string, parameters: Record<string, any>, context?: Record<string, any>): Promise<BridgeResult<any>>;
    registerSkill(skill: ADWSkill): Promise<BridgeResult<void>>;
    listSkills(category?: ADWSkill['category']): Promise<BridgeResult<ADWSkill[]>>;
    executeWorkflow(templateId: string, investigationId: string, parameters?: Record<string, any>): Promise<BridgeResult<string>>;
    analyzeEvidence(evidenceId: string): Promise<BridgeResult<any>>;
    private initializeSkillRegistry;
    private loadWorkflowTemplates;
    private initializeEvidenceStorage;
    private saveInvestigationState;
    private checkEvidenceStorageHealth;
    private checkActiveInvestigationsHealth;
    private addTimelineEvent;
    private analyzeEvidenceAgainstHypotheses;
    private evaluateEvidenceForHypothesis;
    private extractTextFromEvidence;
    private extractKeywords;
    private calculateKeywordOverlap;
    private analyzeSentimentAlignment;
    private countWords;
    private calculateHypothesisConfidence;
    private validateSkillParameters;
    private validateParameterValue;
    private performSkillExecution;
    private executeObserveSystemBehavior;
    private executeCodeQualityInvestigation;
    private executeHypothesisTesting;
    private executeEvidenceSynthesis;
    private executeAdversarialValidation;
    private executeDocumentationInvestigation;
    private executeGenericSkill;
    private calculateSynthesisConfidence;
    private assessEvidenceConvergence;
    private identifyEvidenceConflicts;
    private generateAdversarialChallenges;
    private strengthenConclusion;
    private calculateErrorRate;
    private calculateThroughput;
    private createADWError;
}
//# sourceMappingURL=ADWSkillsBridge.d.ts.map