"use strict";
/**
 * Visión Maestra: Evidence Dashboard
 * Real-time evidence tracking and quality monitoring for ADW methodology
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EvidenceDashboard = void 0;
const events_1 = require("events");
/**
 * Evidence Dashboard for Real-time Quality Monitoring
 */
class EvidenceDashboard extends events_1.EventEmitter {
    workflowStatuses = new Map();
    componentHealth = new Map();
    alerts = new Map();
    metrics;
    constructor() {
        super();
        this.metrics = this.initializeMetrics();
        this.initializeComponentHealth();
        this.startHealthMonitoring();
    }
    /**
     * Initialize evidence metrics
     */
    initializeMetrics() {
        return {
            totalDecisions: 0,
            evidenceDistribution: {
                SOLID: 0,
                SOFT: 0,
                SHAKY: 0,
                UNKNOWN: 0
            },
            averageConfidence: 0,
            investigationsTriggered: 0,
            qualityTrend: 'STABLE',
            lastUpdated: new Date()
        };
    }
    /**
     * Initialize component health tracking for 6 platform components
     */
    initializeComponentHealth() {
        const components = ['dossier', 'ruflo', 'adw-skills', 'gitnexus', 'rlm-navigator', 'claude-code'];
        components.forEach(component => {
            this.componentHealth.set(component, {
                component,
                healthScore: 100,
                evidenceQuality: 'EXCELLENT',
                activeIssues: 0,
                lastUpdate: new Date(),
                trends: {
                    confidence: [100],
                    decisions: [0],
                    investigations: [0]
                }
            });
        });
    }
    /**
     * Update evidence tracking for a workflow
     */
    updateWorkflowEvidence(workflowId, phase, component, evidence) {
        const evidenceQuality = this.calculateEvidenceQuality(evidence);
        const confidence = evidence.confidenceScore || 0;
        const status = {
            workflowId,
            phase,
            component,
            evidenceQuality,
            confidence,
            decisionsTracked: evidence.decisions.length,
            investigationsActive: evidence.investigations.length,
            qualityGateStatus: [] // Will be populated by quality gate updates
        };
        this.workflowStatuses.set(workflowId, status);
        // Update component health
        this.updateComponentHealth(component, evidence);
        // Update global metrics
        this.updateGlobalMetrics(evidence);
        // Check for alerts
        this.checkForAlerts(workflowId, component, evidence);
        this.emit('evidence_updated', {
            workflowId,
            component,
            evidenceQuality,
            confidence
        });
    }
    /**
     * Update quality gate status for a workflow
     */
    updateQualityGateStatus(workflowId, gateExecution) {
        const status = this.workflowStatuses.get(workflowId);
        if (!status)
            return;
        const gateStatus = {
            gateId: gateExecution.gateId,
            type: this.extractGateType(gateExecution.gateId),
            status: gateExecution.result,
            confidence: gateExecution.confidence,
            evidenceScore: this.calculateEvidenceScore(gateExecution.evidence),
            lastExecuted: gateExecution.timestamp
        };
        // Update or add gate status
        const existingIndex = status.qualityGateStatus.findIndex(g => g.gateId === gateExecution.gateId);
        if (existingIndex >= 0) {
            status.qualityGateStatus[existingIndex] = gateStatus;
        }
        else {
            status.qualityGateStatus.push(gateStatus);
        }
        this.workflowStatuses.set(workflowId, status);
        // Check for gate-related alerts
        if (gateExecution.result === 'FAIL' || gateExecution.result === 'INVESTIGATION_REQUIRED') {
            this.createAlert({
                type: gateExecution.result === 'FAIL' ? 'GATE_FAILURE' : 'INVESTIGATION_REQUIRED',
                severity: gateExecution.result === 'FAIL' ? 'CRITICAL' : 'HIGH',
                workflowId,
                component: 'quality-gates',
                message: `Quality gate ${gateExecution.gateId} ${gateExecution.result.toLowerCase()}`,
                recommendedAction: gateExecution.investigationTriggered
                    ? 'Review investigation results and address findings'
                    : 'Review validation failures and fix issues'
            });
        }
        this.emit('quality_gate_updated', {
            workflowId,
            gateId: gateExecution.gateId,
            result: gateExecution.result,
            confidence: gateExecution.confidence
        });
    }
    /**
     * Calculate evidence quality based on evidence distribution
     */
    calculateEvidenceQuality(evidence) {
        const decisions = evidence.decisions;
        if (decisions.length === 0)
            return 'INSUFFICIENT';
        const solidCount = decisions.filter(d => d.evidence === 'SOLID').length;
        const softCount = decisions.filter(d => d.evidence === 'SOFT').length;
        const shakyCount = decisions.filter(d => d.evidence === 'SHAKY').length;
        const unknownCount = decisions.filter(d => d.evidence === 'UNKNOWN').length;
        const solidRatio = solidCount / decisions.length;
        const problematicRatio = (shakyCount + unknownCount) / decisions.length;
        if (solidRatio >= 0.8)
            return 'EXCELLENT';
        if (solidRatio >= 0.6 && problematicRatio < 0.2)
            return 'GOOD';
        if (problematicRatio > 0.4)
            return 'POOR';
        return 'INSUFFICIENT';
    }
    /**
     * Update component health based on new evidence
     */
    updateComponentHealth(component, evidence) {
        const health = this.componentHealth.get(component);
        if (!health)
            return;
        // Calculate new health score
        const evidenceQuality = this.calculateEvidenceQuality(evidence);
        const confidence = evidence.confidenceScore || 0;
        let healthScore = 100;
        switch (evidenceQuality) {
            case 'EXCELLENT':
                healthScore = 95;
                break;
            case 'GOOD':
                healthScore = 80;
                break;
            case 'POOR':
                healthScore = 50;
                break;
            case 'INSUFFICIENT':
                healthScore = 20;
                break;
        }
        // Adjust based on confidence
        healthScore = Math.min(healthScore, confidence * 100);
        // Update trends
        health.trends.confidence.push(confidence * 100);
        health.trends.decisions.push(evidence.decisions.length);
        health.trends.investigations.push(evidence.investigations.length);
        // Keep only last 20 data points
        if (health.trends.confidence.length > 20) {
            health.trends.confidence = health.trends.confidence.slice(-20);
            health.trends.decisions = health.trends.decisions.slice(-20);
            health.trends.investigations = health.trends.investigations.slice(-20);
        }
        // Update health object
        health.healthScore = healthScore;
        health.evidenceQuality = evidenceQuality;
        health.lastUpdate = new Date();
        this.componentHealth.set(component, health);
        this.emit('component_health_updated', {
            component,
            healthScore,
            evidenceQuality
        });
    }
    /**
     * Update global evidence metrics
     */
    updateGlobalMetrics(evidence) {
        // Update decision counts
        this.metrics.totalDecisions += evidence.decisions.length;
        // Update evidence distribution
        evidence.decisions.forEach(decision => {
            this.metrics.evidenceDistribution[decision.evidence]++;
        });
        // Update average confidence
        if (evidence.confidenceScore > 0) {
            this.metrics.averageConfidence = (this.metrics.averageConfidence + evidence.confidenceScore) / 2;
        }
        // Update investigations count
        this.metrics.investigationsTriggered += evidence.investigations.length;
        // Determine quality trend
        this.metrics.qualityTrend = this.calculateQualityTrend();
        this.metrics.lastUpdated = new Date();
        this.emit('global_metrics_updated', this.metrics);
    }
    /**
     * Calculate quality trend based on recent evidence
     */
    calculateQualityTrend() {
        const recentHealthScores = Array.from(this.componentHealth.values())
            .map(health => health.healthScore);
        if (recentHealthScores.length === 0)
            return 'STABLE';
        const averageHealth = recentHealthScores.reduce((sum, score) => sum + score, 0) / recentHealthScores.length;
        if (averageHealth >= 85)
            return 'IMPROVING';
        if (averageHealth <= 60)
            return 'DEGRADING';
        return 'STABLE';
    }
    /**
     * Check for alerts based on evidence quality
     */
    checkForAlerts(workflowId, component, evidence) {
        const confidence = evidence.confidenceScore || 0;
        const evidenceQuality = this.calculateEvidenceQuality(evidence);
        // Low confidence alert
        if (confidence < 0.6) {
            this.createAlert({
                type: 'LOW_CONFIDENCE',
                severity: confidence < 0.4 ? 'HIGH' : 'MEDIUM',
                workflowId,
                component,
                message: `Low confidence score: ${(confidence * 100).toFixed(1)}%`,
                recommendedAction: 'Trigger investigation or gather additional evidence'
            });
        }
        // Quality degradation alert
        if (evidenceQuality === 'POOR') {
            this.createAlert({
                type: 'QUALITY_DEGRADATION',
                severity: 'HIGH',
                workflowId,
                component,
                message: 'Evidence quality has degraded to POOR level',
                recommendedAction: 'Review decision evidence and conduct investigation'
            });
        }
        // Investigation required alert
        const shakyOrUnknown = evidence.decisions.filter(d => d.evidence === 'SHAKY' || d.evidence === 'UNKNOWN').length;
        if (shakyOrUnknown > evidence.decisions.length * 0.3) {
            this.createAlert({
                type: 'INVESTIGATION_REQUIRED',
                severity: 'HIGH',
                workflowId,
                component,
                message: `${shakyOrUnknown} decisions have inadequate evidence`,
                recommendedAction: 'Conduct thorough investigation for weak evidence decisions'
            });
        }
    }
    /**
     * Create an evidence alert
     */
    createAlert(alertData) {
        const alertId = `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const alert = {
            ...alertData,
            id: alertId,
            timestamp: new Date(),
            acknowledged: false
        };
        this.alerts.set(alertId, alert);
        this.emit('alert_created', alert);
        // Auto-escalate critical alerts
        if (alert.severity === 'CRITICAL') {
            this.emit('critical_alert', alert);
        }
    }
    /**
     * Start health monitoring interval
     */
    startHealthMonitoring() {
        setInterval(() => {
            this.performHealthCheck();
        }, 30000); // Every 30 seconds
    }
    /**
     * Perform periodic health check
     */
    performHealthCheck() {
        const now = new Date();
        // Check for stale workflows
        this.workflowStatuses.forEach((status, workflowId) => {
            const componentHealth = this.componentHealth.get(status.component);
            if (componentHealth) {
                const staleDuration = now.getTime() - componentHealth.lastUpdate.getTime();
                if (staleDuration > 300000) { // 5 minutes
                    this.createAlert({
                        type: 'QUALITY_DEGRADATION',
                        severity: 'MEDIUM',
                        workflowId,
                        component: status.component,
                        message: 'Component has not reported evidence updates for 5+ minutes',
                        recommendedAction: 'Check component health and connectivity'
                    });
                }
            }
        });
        this.emit('health_check_completed', {
            timestamp: now,
            activeWorkflows: this.workflowStatuses.size,
            activeAlerts: Array.from(this.alerts.values()).filter(a => !a.acknowledged).length
        });
    }
    // Helper methods
    /**
     * Extract gate type from gate ID
     */
    extractGateType(gateId) {
        if (gateId.includes('zero-drift'))
            return 'zero-drift';
        if (gateId.includes('build'))
            return 'build';
        if (gateId.includes('requirements'))
            return 'requirements';
        if (gateId.includes('architecture'))
            return 'architecture';
        if (gateId.includes('adr'))
            return 'adr-compliance';
        if (gateId.includes('deployment'))
            return 'deployment';
        if (gateId.includes('evidence'))
            return 'evidence-quality';
        return 'zero-drift';
    }
    /**
     * Calculate evidence score for quality gate
     */
    calculateEvidenceScore(evidence) {
        if (evidence.length === 0)
            return 0;
        const totalScore = evidence.reduce((sum, decision) => sum + decision.confidence, 0);
        return totalScore / evidence.length;
    }
    // Public API methods
    /**
     * Get current evidence dashboard
     */
    getDashboard() {
        return {
            metrics: this.metrics,
            workflows: Array.from(this.workflowStatuses.values()),
            componentHealth: Array.from(this.componentHealth.values()),
            activeAlerts: Array.from(this.alerts.values()).filter(a => !a.acknowledged)
        };
    }
    /**
     * Get workflow evidence status
     */
    getWorkflowStatus(workflowId) {
        return this.workflowStatuses.get(workflowId);
    }
    /**
     * Get component health
     */
    getComponentHealth(component) {
        return this.componentHealth.get(component);
    }
    /**
     * Acknowledge alert
     */
    acknowledgeAlert(alertId) {
        const alert = this.alerts.get(alertId);
        if (alert) {
            alert.acknowledged = true;
            this.alerts.set(alertId, alert);
            this.emit('alert_acknowledged', { alertId });
            return true;
        }
        return false;
    }
    /**
     * Get evidence quality summary
     */
    getEvidenceQualitySummary() {
        return {
            overallQuality: this.calculateOverallQuality(),
            confidence: this.metrics.averageConfidence,
            distribution: this.metrics.evidenceDistribution,
            trends: this.metrics.qualityTrend
        };
    }
    /**
     * Calculate overall evidence quality
     */
    calculateOverallQuality() {
        const total = Object.values(this.metrics.evidenceDistribution).reduce((sum, count) => sum + count, 0);
        if (total === 0)
            return 'INSUFFICIENT';
        const solidRatio = this.metrics.evidenceDistribution.SOLID / total;
        const problematicRatio = (this.metrics.evidenceDistribution.SHAKY + this.metrics.evidenceDistribution.UNKNOWN) / total;
        if (solidRatio >= 0.8)
            return 'EXCELLENT';
        if (solidRatio >= 0.6 && problematicRatio < 0.2)
            return 'GOOD';
        if (problematicRatio > 0.4)
            return 'POOR';
        return 'INSUFFICIENT';
    }
}
exports.EvidenceDashboard = EvidenceDashboard;
//# sourceMappingURL=EvidenceDashboard.js.map