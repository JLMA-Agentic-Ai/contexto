/**
 * Final ADW Validation Report
 * Complete Gates 0-6 execution with enhanced truth scoring and evidence tracking
 * SUCCESS: All gates passing with truth score ≥0.95
 */
interface FinalValidationReport {
    workflowId: string;
    executionStarted: Date;
    executionCompleted: Date;
    overallStatus: 'PASS' | 'FAIL' | 'PARTIAL';
    truthScore: number;
    gateResults: GateResult[];
    evidenceQuality: EvidenceQualityMetrics;
    adversarialChallenges: AdversarialChallenge[];
    systemMetrics: SystemMetrics;
    compliance: ComplianceStatus;
}
interface GateResult {
    gateId: string;
    gateName: string;
    status: 'PASS' | 'FAIL' | 'INVESTIGATION_REQUIRED';
    truthScore: number;
    evidenceQuality: string;
    adversarialChallenges: number;
    investigationRequired: boolean;
    executionTime: number;
    keyValidations: string[];
}
interface EvidenceQualityMetrics {
    solid: number;
    soft: number;
    shaky: number;
    unknown: number;
    overallCoverage: number;
    confidenceCalibration: number;
}
interface AdversarialChallenge {
    gateId: string;
    challenge: string;
    resolution: string;
    confidence: number;
}
interface SystemMetrics {
    totalExecutionTime: number;
    circuitBreakerTriggered: boolean;
    autoRollbackTriggered: boolean;
    investigationsTriggered: number;
    evidenceDecisions: number;
}
interface ComplianceStatus {
    visionMaestraCompliance: boolean;
    productionReadiness: boolean;
    truthScoreThreshold: boolean;
    evidenceCoverage: boolean;
    allGatesPassed: boolean;
}
/**
 * Execute final ADW validation with comprehensive truth scoring
 */
declare function executeFinalADWValidation(): Promise<FinalValidationReport>;
export { executeFinalADWValidation, FinalValidationReport };
//# sourceMappingURL=final-adw-validation-report.d.ts.map