/**
 * Visión Maestra: Evidence Dashboard
 * Real-time evidence tracking and quality monitoring for ADW methodology
 */
import { EventEmitter } from 'events';
import { EvidenceTracker } from '../orchestration/WorkflowOrchestrator';
import { GateExecution, QualityGateType } from '../validation/ADWQualityGates.js';
export interface EvidenceMetrics {
    totalDecisions: number;
    evidenceDistribution: {
        SOLID: number;
        SOFT: number;
        SHAKY: number;
        UNKNOWN: number;
    };
    averageConfidence: number;
    investigationsTriggered: number;
    qualityTrend: 'IMPROVING' | 'STABLE' | 'DEGRADING';
    lastUpdated: Date;
}
export interface WorkflowEvidenceStatus {
    workflowId: string;
    phase: string;
    component: string;
    evidenceQuality: 'EXCELLENT' | 'GOOD' | 'POOR' | 'INSUFFICIENT';
    confidence: number;
    decisionsTracked: number;
    investigationsActive: number;
    qualityGateStatus: QualityGateStatus[];
}
export interface QualityGateStatus {
    gateId: string;
    type: QualityGateType;
    status: 'PASS' | 'FAIL' | 'BLOCKED' | 'PENDING' | 'INVESTIGATION_REQUIRED';
    confidence: number;
    evidenceScore: number;
    lastExecuted?: Date;
}
export interface EvidenceAlert {
    id: string;
    type: 'LOW_CONFIDENCE' | 'INVESTIGATION_REQUIRED' | 'QUALITY_DEGRADATION' | 'GATE_FAILURE';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    workflowId: string;
    component: string;
    message: string;
    recommendedAction: string;
    timestamp: Date;
    acknowledged: boolean;
}
export interface ComponentEvidenceHealth {
    component: string;
    healthScore: number;
    evidenceQuality: string;
    activeIssues: number;
    lastUpdate: Date;
    trends: {
        confidence: number[];
        decisions: number[];
        investigations: number[];
    };
}
/**
 * Evidence Dashboard for Real-time Quality Monitoring
 */
export declare class EvidenceDashboard extends EventEmitter {
    private workflowStatuses;
    private componentHealth;
    private alerts;
    private metrics;
    constructor();
    /**
     * Initialize evidence metrics
     */
    private initializeMetrics;
    /**
     * Initialize component health tracking for 6 platform components
     */
    private initializeComponentHealth;
    /**
     * Update evidence tracking for a workflow
     */
    updateWorkflowEvidence(workflowId: string, phase: string, component: string, evidence: EvidenceTracker): void;
    /**
     * Update quality gate status for a workflow
     */
    updateQualityGateStatus(workflowId: string, gateExecution: GateExecution): void;
    /**
     * Calculate evidence quality based on evidence distribution
     */
    private calculateEvidenceQuality;
    /**
     * Update component health based on new evidence
     */
    private updateComponentHealth;
    /**
     * Update global evidence metrics
     */
    private updateGlobalMetrics;
    /**
     * Calculate quality trend based on recent evidence
     */
    private calculateQualityTrend;
    /**
     * Check for alerts based on evidence quality
     */
    private checkForAlerts;
    /**
     * Create an evidence alert
     */
    private createAlert;
    /**
     * Start health monitoring interval
     */
    private startHealthMonitoring;
    /**
     * Perform periodic health check
     */
    private performHealthCheck;
    /**
     * Extract gate type from gate ID
     */
    private extractGateType;
    /**
     * Calculate evidence score for quality gate
     */
    private calculateEvidenceScore;
    /**
     * Get current evidence dashboard
     */
    getDashboard(): {
        metrics: EvidenceMetrics;
        workflows: WorkflowEvidenceStatus[];
        componentHealth: ComponentEvidenceHealth[];
        activeAlerts: EvidenceAlert[];
    };
    /**
     * Get workflow evidence status
     */
    getWorkflowStatus(workflowId: string): WorkflowEvidenceStatus | undefined;
    /**
     * Get component health
     */
    getComponentHealth(component: string): ComponentEvidenceHealth | undefined;
    /**
     * Acknowledge alert
     */
    acknowledgeAlert(alertId: string): boolean;
    /**
     * Get evidence quality summary
     */
    getEvidenceQualitySummary(): {
        overallQuality: string;
        confidence: number;
        distribution: any;
        trends: string;
    };
    /**
     * Calculate overall evidence quality
     */
    private calculateOverallQuality;
}
//# sourceMappingURL=EvidenceDashboard.d.ts.map