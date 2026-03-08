/**
 * Enhanced ADW Validation Runner
 * Executes Gates 2-6 with truth scoring ≥0.95 and comprehensive evidence tracking
 */
interface ValidationRunReport {
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
 * Execute enhanced ADW validation with comprehensive reporting
 */
declare function runEnhancedADWValidation(): Promise<ValidationRunReport>;
export { runEnhancedADWValidation, ValidationRunReport };
//# sourceMappingURL=enhanced-adw-validation-runner.d.ts.map