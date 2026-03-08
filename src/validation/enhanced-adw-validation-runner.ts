/**
 * Enhanced ADW Validation Runner
 * Executes Gates 2-6 with truth scoring ≥0.95 and comprehensive evidence tracking
 */

import { EnhancedADWValidationOrchestrator } from './EnhancedADWValidationOrchestrator.js';
import { EvidenceConfidence } from '../orchestration/WorkflowOrchestrator.js';

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
async function runEnhancedADWValidation(): Promise<ValidationRunReport> {
  const workflowId = `enhanced-adw-validation-${Date.now()}`;
  const startTime = new Date();

  console.log('🚀 ENHANCED ADW VALIDATION ORCHESTRATION - Gates 2-6 Execution');
  console.log('='.repeat(80));
  console.log(`Workflow ID: ${workflowId}`);
  console.log(`Started: ${startTime.toISOString()}`);
  console.log(`Truth Score Threshold: ≥0.95`);
  console.log(`Evidence Framework: SOLID/SOFT/SHAKY/UNKNOWN`);
  console.log(`Auto-Rollback: ENABLED (max 3 correction cycles)`);
  console.log('');

  // Initialize Enhanced ADW Validation Orchestrator
  const orchestrator = new EnhancedADWValidationOrchestrator({
    truthScoreThreshold: 0.95,
    maxCorrectionCycles: 3,
    autoRollbackEnabled: true,
    evidenceFramework: 'SOLID_SOFT_SHAKY_UNKNOWN',
    adversarialReviewEnabled: true
  });

  // Track events for comprehensive reporting
  const events: any[] = [];
  let circuitBreakerTriggered = false;
  let autoRollbackTriggered = false;

  // Setup event listeners
  orchestrator.on('validation_started', (event) => {
    console.log(`📋 Validation Started: ${event.workflowId}`);
    events.push({ type: 'validation_started', ...event });
  });

  orchestrator.on('gate_execution_started', (event) => {
    console.log(`🔍 Executing ${event.gateId.replace('gate-', 'Gate ').replace('-', ' ')}`);
    events.push({ type: 'gate_execution_started', ...event });
  });

  orchestrator.on('adversarial_review_completed', (event) => {
    console.log(`⚔️  Adversarial Review: ${event.gateName} - ${event.adversarialChallenges.length} challenges`);
    events.push({ type: 'adversarial_review_completed', ...event });
  });

  orchestrator.on('truth_score_below_threshold', (event) => {
    console.log(`⚠️  Truth Score Below Threshold: ${event.gateId} - ${event.confidence.toFixed(3)} < ${event.threshold}`);
    events.push({ type: 'truth_score_below_threshold', ...event });
  });

  orchestrator.on('circuit_breaker_triggered', (event) => {
    console.log(`🔴 Circuit Breaker Triggered: ${event.gateId} - ${event.correctionCycles} cycles`);
    circuitBreakerTriggered = true;
    events.push({ type: 'circuit_breaker_triggered', ...event });
  });

  orchestrator.on('auto_rollback_triggered', (event) => {
    console.log(`🔄 Auto-Rollback Triggered: ${event.reason}`);
    autoRollbackTriggered = true;
    events.push({ type: 'auto_rollback_triggered', ...event });
  });

  orchestrator.on('truth_score_calculated', (event) => {
    console.log(`📊 Truth Score Calculated: ${event.overallTruthScore.toFixed(3)}`);
    events.push({ type: 'truth_score_calculated', ...event });
  });

  try {
    console.log('🎯 EXECUTING ENHANCED ADW VALIDATION GATES 2-6');
    console.log('-'.repeat(60));

    // Execute enhanced validation
    const truthScoringMetrics = await orchestrator.executeEnhancedValidation(workflowId);

    const endTime = new Date();
    const executionTimeMs = endTime.getTime() - startTime.getTime();

    console.log('');
    console.log('✅ ENHANCED ADW VALIDATION COMPLETED');
    console.log('='.repeat(80));
    console.log(`Execution Time: ${executionTimeMs}ms`);
    console.log(`Overall Truth Score: ${truthScoringMetrics.overallTruthScore.toFixed(3)}`);
    console.log(`Evidence Coverage: ${(truthScoringMetrics.evidenceCoverage * 100).toFixed(1)}%`);
    console.log(`Confidence Calibration: ${(truthScoringMetrics.confidenceCalibration * 100).toFixed(1)}%`);
    console.log(`Investigation Completeness: ${(truthScoringMetrics.investigationCompleteness * 100).toFixed(1)}%`);

    // Get detailed validation status
    const validationStatus = orchestrator.getValidationStatus();

    // Generate comprehensive report
    const report: ValidationRunReport = {
      workflowId,
      executionStarted: startTime,
      executionCompleted: endTime,
      overallStatus: truthScoringMetrics.overallTruthScore >= 0.95 ? 'PASS' :
                     truthScoringMetrics.overallTruthScore >= 0.80 ? 'PARTIAL' : 'FAIL',
      truthScore: truthScoringMetrics.overallTruthScore,
      gateResults: validationStatus.validationResults.map(result => ({
        gateId: result.gateId,
        gateName: result.gateName,
        status: result.status,
        truthScore: result.truthScore,
        evidenceQuality: result.evidenceQuality.toString(),
        adversarialChallenges: result.adversarialChallenges.length,
        investigationRequired: result.status === 'INVESTIGATION_REQUIRED'
      })),
      evidenceQualityBreakdown: calculateEvidenceQualityBreakdown(validationStatus.validationResults),
      adversarialChallenges: validationStatus.validationResults.reduce(
        (sum, r) => sum + r.adversarialChallenges.length, 0
      ),
      circuitBreakerTriggered,
      autoRollbackTriggered,
      recommendations: generateRecommendations(truthScoringMetrics, validationStatus)
    };

    // Print detailed gate results
    console.log('');
    console.log('📋 DETAILED GATE VALIDATION RESULTS');
    console.log('-'.repeat(60));

    report.gateResults.forEach(gate => {
      const statusIcon = gate.status === 'PASS' ? '✅' :
                        gate.status === 'FAIL' ? '❌' :
                        gate.status === 'INVESTIGATION_REQUIRED' ? '🔍' : '⚪';

      console.log(`${statusIcon} ${gate.gateName}`);
      console.log(`   Truth Score: ${gate.truthScore.toFixed(3)} | Evidence: ${gate.evidenceQuality}`);
      console.log(`   Adversarial Challenges: ${gate.adversarialChallenges} | Investigation: ${gate.investigationRequired ? 'Required' : 'Not Required'}`);
      console.log('');
    });

    // Print evidence quality breakdown
    console.log('🔬 EVIDENCE QUALITY BREAKDOWN');
    console.log('-'.repeat(60));
    console.log(`SOLID Evidence: ${report.evidenceQualityBreakdown.solid} gates (≥0.85 confidence)`);
    console.log(`SOFT Evidence: ${report.evidenceQualityBreakdown.soft} gates (0.55-0.84 confidence)`);
    console.log(`SHAKY Evidence: ${report.evidenceQualityBreakdown.shaky} gates (0.25-0.54 confidence)`);
    console.log(`UNKNOWN Evidence: ${report.evidenceQualityBreakdown.unknown} gates (<0.25 confidence)`);
    console.log(`Overall Coverage: ${(report.evidenceQualityBreakdown.overallCoverage * 100).toFixed(1)}%`);

    // Print recommendations
    if (report.recommendations.length > 0) {
      console.log('');
      console.log('💡 RECOMMENDATIONS');
      console.log('-'.repeat(60));
      report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }

    // Final status
    console.log('');
    console.log('🎯 FINAL VALIDATION STATUS');
    console.log('='.repeat(80));

    if (report.overallStatus === 'PASS') {
      console.log('✅ ENHANCED ADW VALIDATION: **PASSED**');
      console.log(`   Truth Score: ${report.truthScore.toFixed(3)} ≥ 0.95 ✅`);
      console.log(`   Evidence Quality: SUFFICIENT FOR PRODUCTION ✅`);
      console.log(`   Circuit Breaker: ${circuitBreakerTriggered ? 'TRIGGERED' : 'NOT TRIGGERED'} ${circuitBreakerTriggered ? '⚠️' : '✅'}`);
      console.log(`   Auto-Rollback: ${autoRollbackTriggered ? 'TRIGGERED' : 'NOT TRIGGERED'} ${autoRollbackTriggered ? '⚠️' : '✅'}`);
      console.log('');
      console.log('🚀 **CLEARED FOR VISIÓN MAESTRA PLATFORM 100% COMPLIANCE**');
    } else if (report.overallStatus === 'PARTIAL') {
      console.log('⚠️  ENHANCED ADW VALIDATION: **PARTIAL PASS**');
      console.log(`   Truth Score: ${report.truthScore.toFixed(3)} (0.80-0.94 range) ⚠️`);
      console.log(`   Requires investigation and improvement before full deployment`);
    } else {
      console.log('❌ ENHANCED ADW VALIDATION: **FAILED**');
      console.log(`   Truth Score: ${report.truthScore.toFixed(3)} < 0.80 ❌`);
      console.log(`   Requires significant remediation before deployment`);
    }

    return report;

  } catch (error) {
    const endTime = new Date();
    console.error('');
    console.error('❌ ENHANCED ADW VALIDATION FAILED');
    console.error('='.repeat(80));
    console.error(`Error: ${error.message}`);
    console.error(`Execution Time: ${endTime.getTime() - startTime.getTime()}ms`);

    throw error;
  }
}

function calculateEvidenceQualityBreakdown(results: any[]): EvidenceQualityBreakdown {
  const breakdown = { solid: 0, soft: 0, shaky: 0, unknown: 0, overallCoverage: 0 };

  results.forEach(result => {
    switch (result.evidenceQuality) {
      case 'SOLID': breakdown.solid++; break;
      case 'SOFT': breakdown.soft++; break;
      case 'SHAKY': breakdown.shaky++; break;
      default: breakdown.unknown++; break;
    }
  });

  breakdown.overallCoverage = results.length > 0 ?
    (breakdown.solid + breakdown.soft) / results.length : 0;

  return breakdown;
}

function generateRecommendations(metrics: any, status: any): string[] {
  const recommendations: string[] = [];

  if (metrics.overallTruthScore < 0.95) {
    recommendations.push(`Improve truth score from ${metrics.overallTruthScore.toFixed(3)} to ≥0.95 through additional evidence gathering`);
  }

  if (metrics.evidenceCoverage < 0.90) {
    recommendations.push(`Increase evidence coverage from ${(metrics.evidenceCoverage * 100).toFixed(1)}% to ≥90%`);
  }

  if (metrics.investigationCompleteness < 0.90) {
    recommendations.push(`Complete remaining investigations - currently at ${(metrics.investigationCompleteness * 100).toFixed(1)}%`);
  }

  if (status.correctionCycles > 0) {
    recommendations.push(`Address issues that triggered ${status.correctionCycles} correction cycles`);
  }

  const investigationRequired = status.validationResults.filter((r: any) => r.status === 'INVESTIGATION_REQUIRED');
  if (investigationRequired.length > 0) {
    recommendations.push(`Complete investigations for gates: ${investigationRequired.map((r: any) => r.gateName).join(', ')}`);
  }

  return recommendations;
}

// Execute enhanced ADW validation
if (require.main === module) {
  runEnhancedADWValidation()
    .then(report => {
      console.log('');
      console.log('📄 Enhanced ADW Validation Report generated successfully');
      process.exit(report.overallStatus === 'PASS' ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Enhanced ADW Validation failed:', error.message);
      process.exit(1);
    });
}

export { runEnhancedADWValidation, ValidationRunReport };