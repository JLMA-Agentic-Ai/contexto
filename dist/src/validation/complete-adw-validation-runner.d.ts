/**
 * Complete ADW Validation Runner
 * Executes Gates 0-6 with truth scoring ≥0.95 and comprehensive evidence tracking
 */
interface CompleteValidationRunReport {
    workflowId: string;
    executionStarted: Date;
    executionCompleted: Date;
    overallStatus: 'PASS' | 'FAIL' | 'PARTIAL';
    truthScore: number;
    gateResults: GateValidationSummary[];
    evidenceQualityBreakdown: EvidenceQualityBreakdown;
    adversarialChallenges: number;
    circuitBreakerTriggered: boolean;
    autoRollbackTriggered: boolean;
    recommendations: string[];
    phases: {
        gate0: boolean;
        gate1: boolean;
        gates2to6: boolean;
    };
}
interface GateValidationSummary {
    gateId: string;
    gateName: string;
    status: string;
    truthScore: number;
    evidenceQuality: string;
    adversarialChallenges: number;
    investigationRequired: boolean;
}
interface EvidenceQualityBreakdown {
    solid: number;
    soft: number;
    shaky: number;
    unknown: number;
    overallCoverage: number;
}
/**
 * Execute complete ADW validation (Gates 0-6) with comprehensive reporting
 */
declare function runCompleteADWValidation(): Promise<CompleteValidationRunReport>;
export { runCompleteADWValidation, CompleteValidationRunReport };
//# sourceMappingURL=complete-adw-validation-runner.d.ts.map