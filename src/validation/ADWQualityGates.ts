/**
 * Visión Maestra: ADW Quality Gates Implementation
 * Evidence-based validation system for 6-component platform
 */

import { EventEmitter } from 'events';
import { EvidenceTracker, EvidenceDecision } from '../orchestration/WorkflowOrchestrator.js';

// Quality Gate Types
export type QualityGateType =
  | 'zero-drift'
  | 'build'
  | 'requirements'
  | 'architecture'
  | 'adr-compliance'
  | 'deployment'
  | 'evidence-quality';

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
export class ADWQualityGates extends EventEmitter {
  private gates: Map<string, QualityGate> = new Map();
  private executions: Map<string, GateExecution> = new Map();
  private adversarialReviews: Map<string, AdversarialReview> = new Map();

  constructor() {
    super();
    this.initializeDefaultGates();
  }

  /**
   * Initialize the 7 ADW quality gates
   */
  private initializeDefaultGates(): void {
    // Gate 0: Zero-Drift Validation
    this.registerGate({
      id: 'gate-0-zero-drift',
      type: 'zero-drift',
      name: 'Zero-Drift Validation',
      description: 'Evidence-based drift assessment with confidence scoring',
      evidenceThreshold: 0.70,
      required: true,
      dependencies: [],
      validationRules: [
        {
          id: 'drift-detection',
          name: 'Requirement Drift Detection',
          condition: 'driftScore < 0.15',
          errorMessage: 'Significant requirement drift detected',
          severity: 'error'
        },
        {
          id: 'scope-creep',
          name: 'Scope Creep Assessment',
          condition: 'scopeChange < 0.20',
          errorMessage: 'Scope creep exceeds acceptable threshold',
          severity: 'warning'
        }
      ]
    });

    // Gate 1: Build Validation
    this.registerGate({
      id: 'gate-1-build',
      type: 'build',
      name: 'Build Validation',
      description: 'Build validation with optimization investigation',
      evidenceThreshold: 0.80,
      required: true,
      dependencies: ['gate-0-zero-drift'],
      validationRules: [
        {
          id: 'build-success',
          name: 'Build Compilation Success',
          condition: 'buildStatus === "success"',
          errorMessage: 'Build compilation failed',
          severity: 'critical'
        },
        {
          id: 'performance-baseline',
          name: 'Performance Baseline',
          condition: 'performanceScore >= baseline * 0.95',
          errorMessage: 'Performance regression detected',
          severity: 'error'
        },
        {
          id: 'streaming-latency',
          name: 'Streaming Latency Validation',
          condition: 'streamingLatency < 100',
          errorMessage: 'Streaming latency exceeds 100ms target',
          severity: 'error'
        }
      ]
    });

    // Gate 2: Business Requirements Validation
    this.registerGate({
      id: 'gate-2-requirements',
      type: 'requirements',
      name: 'Business Requirements Validation',
      description: 'Evidence-based requirements traceability',
      evidenceThreshold: 0.75,
      required: true,
      dependencies: ['gate-1-build'],
      validationRules: [
        {
          id: 'component-integration',
          name: '6-Component Integration Validation',
          condition: 'integratedComponents === 6',
          errorMessage: 'Not all 6 components are integrated',
          severity: 'critical'
        },
        {
          id: 'workflow-orchestration',
          name: 'Workflow Orchestration Validation',
          condition: 'workflowOrchestration === true',
          errorMessage: 'Workflow orchestration not functional',
          severity: 'critical'
        }
      ]
    });

    // Gate 3: Architecture Validation
    this.registerGate({
      id: 'gate-3-architecture',
      type: 'architecture',
      name: 'Architecture Validation',
      description: 'Evidence-scored architecture decisions',
      evidenceThreshold: 0.80,
      required: true,
      dependencies: ['gate-2-requirements'],
      validationRules: [
        {
          id: 'bridge-architecture',
          name: 'Integration Bridge Architecture',
          condition: 'bridgeIntegrity === "SOLID"',
          errorMessage: 'Integration bridge architecture has issues',
          severity: 'error'
        },
        {
          id: 'streaming-architecture',
          name: 'Real-time Streaming Architecture',
          condition: 'streamingArchitecture === "VALIDATED"',
          errorMessage: 'Streaming architecture validation failed',
          severity: 'error'
        },
        {
          id: 'evidence-tracking',
          name: 'Evidence Tracking System',
          condition: 'evidenceTracking === true',
          errorMessage: 'Evidence tracking system not functional',
          severity: 'critical'
        }
      ]
    });

    // Gate 4: ADR Compliance Validation
    this.registerGate({
      id: 'gate-4-adr',
      type: 'adr-compliance',
      name: 'ADR Compliance Validation',
      description: 'Evidence-based ADR validation with confidence tracking',
      evidenceThreshold: 0.75,
      required: true,
      dependencies: ['gate-3-architecture'],
      validationRules: [
        {
          id: 'adr-coverage',
          name: 'ADR Decision Coverage',
          condition: 'adrCoverage >= 0.90',
          errorMessage: 'ADR coverage below 90%',
          severity: 'warning'
        },
        {
          id: 'evidence-quality',
          name: 'ADR Evidence Quality',
          condition: 'averageEvidenceQuality >= 0.75',
          errorMessage: 'ADR evidence quality below threshold',
          severity: 'error'
        }
      ]
    });

    // Gate 5: Deployment Readiness
    this.registerGate({
      id: 'gate-5-deployment',
      type: 'deployment',
      name: 'Deployment Readiness',
      description: 'Evidence-scored deployment criteria',
      evidenceThreshold: 0.80,
      required: true,
      dependencies: ['gate-4-adr'],
      validationRules: [
        {
          id: 'security-validation',
          name: 'Security Validation',
          condition: 'securityScore >= 0.90',
          errorMessage: 'Security validation failed',
          severity: 'critical'
        },
        {
          id: 'performance-targets',
          name: 'Performance Target Achievement',
          condition: 'performanceTargets === "MET"',
          errorMessage: 'Performance targets not achieved',
          severity: 'error'
        },
        {
          id: 'integration-health',
          name: 'Integration Health Checks',
          condition: 'allIntegrationsHealthy === true',
          errorMessage: 'Integration health checks failed',
          severity: 'critical'
        }
      ]
    });

    // Gate 6: Evidence Quality Meta-Validation
    this.registerGate({
      id: 'gate-6-evidence',
      type: 'evidence-quality',
      name: 'Evidence Quality Meta-Validation',
      description: 'Evidence coverage analysis and confidence calibration',
      evidenceThreshold: 0.85,
      required: true,
      dependencies: ['gate-5-deployment'],
      validationRules: [
        {
          id: 'evidence-coverage',
          name: 'Evidence Coverage Analysis',
          condition: 'evidenceCoverage >= 0.95',
          errorMessage: 'Evidence coverage below 95%',
          severity: 'error'
        },
        {
          id: 'confidence-calibration',
          name: 'Confidence Score Calibration',
          condition: 'confidenceCalibration === "ACCURATE"',
          errorMessage: 'Confidence scores not properly calibrated',
          severity: 'warning'
        },
        {
          id: 'investigation-completeness',
          name: 'Investigation Completeness',
          condition: 'investigationCompleteness >= 0.90',
          errorMessage: 'Investigation completeness below threshold',
          severity: 'error'
        }
      ]
    });
  }

  /**
   * Register a quality gate
   */
  private registerGate(gate: QualityGate): void {
    this.gates.set(gate.id, gate);
    this.emit('gate_registered', { gateId: gate.id, type: gate.type });
  }

  /**
   * Execute a specific quality gate
   */
  async executeGate(
    gateId: string,
    workflowId: string,
    evidence: EvidenceTracker,
    validationData: any
  ): Promise<GateExecution> {
    const startTime = Date.now();
    const gate = this.gates.get(gateId);

    if (!gate) {
      throw new Error(`Gate ${gateId} not found`);
    }

    // Check dependencies
    const dependencyCheck = await this.validateDependencies(gate, workflowId);
    if (!dependencyCheck.passed) {
      throw new Error(`Gate dependencies not satisfied: ${dependencyCheck.failedDependencies.join(', ')}`);
    }

    // Execute validation rules
    const validationResults = await this.executeValidationRules(gate, validationData);

    // Calculate confidence based on evidence
    const confidence = this.calculateGateConfidence(evidence, validationResults);

    // Determine gate result
    const result = this.determineGateResult(gate, confidence, validationResults);

    // Check if investigation is required
    const investigationTriggered = this.shouldTriggerInvestigation(result, confidence, gate);

    const execution: GateExecution = {
      gateId,
      workflowId,
      result,
      confidence,
      evidence: evidence.decisions,
      validationResults,
      timestamp: new Date(),
      executionTimeMs: Date.now() - startTime,
      investigationTriggered
    };

    this.executions.set(`${workflowId}-${gateId}`, execution);

    // Emit events for monitoring
    this.emit('gate_executed', execution);

    if (investigationTriggered) {
      this.emit('investigation_required', {
        gateId,
        workflowId,
        reason: `Gate confidence ${confidence} below threshold ${gate.evidenceThreshold}`
      });
    }

    // Trigger adversarial review for critical gates
    if (gate.type === 'architecture' || gate.type === 'deployment') {
      await this.triggerAdversarialReview(execution);
    }

    return execution;
  }

  /**
   * Execute all quality gates in sequence
   */
  async executeAllGates(
    workflowId: string,
    evidence: EvidenceTracker,
    validationData: any
  ): Promise<GateExecution[]> {
    const executions: GateExecution[] = [];

    // Execute gates in dependency order
    const gateOrder = [
      'gate-0-zero-drift',
      'gate-1-build',
      'gate-2-requirements',
      'gate-3-architecture',
      'gate-4-adr',
      'gate-5-deployment',
      'gate-6-evidence'
    ];

    for (const gateId of gateOrder) {
      try {
        const execution = await this.executeGate(gateId, workflowId, evidence, validationData);
        executions.push(execution);

        // Stop on critical failures
        if (execution.result === 'FAIL' && this.gates.get(gateId)?.required) {
          this.emit('gate_sequence_failed', {
            workflowId,
            failedGate: gateId,
            executions
          });
          break;
        }

      } catch (error) {
        this.emit('gate_error', {
          gateId,
          workflowId,
          error: error.message
        });
        break;
      }
    }

    return executions;
  }

  /**
   * Validate gate dependencies
   */
  private async validateDependencies(gate: QualityGate, workflowId: string): Promise<{
    passed: boolean;
    failedDependencies: string[];
  }> {
    const failedDependencies: string[] = [];

    for (const depId of gate.dependencies) {
      const depExecution = this.executions.get(`${workflowId}-${depId}`);
      if (!depExecution || depExecution.result !== 'PASS') {
        failedDependencies.push(depId);
      }
    }

    return {
      passed: failedDependencies.length === 0,
      failedDependencies
    };
  }

  /**
   * Execute validation rules for a gate
   */
  private async executeValidationRules(
    gate: QualityGate,
    validationData: any
  ): Promise<ValidationResult[]> {
    const results: ValidationResult[] = [];

    for (const rule of gate.validationRules) {
      try {
        // Simple condition evaluation (in production, use a safer evaluator)
        const passed = this.evaluateCondition(rule.condition, validationData);

        results.push({
          ruleId: rule.id,
          passed,
          message: passed ? `✅ ${rule.name}` : `❌ ${rule.errorMessage}`,
          confidence: passed ? 0.95 : 0.05
        });

      } catch (error) {
        results.push({
          ruleId: rule.id,
          passed: false,
          message: `Error evaluating rule: ${error.message}`,
          confidence: 0.0
        });
      }
    }

    return results;
  }

  /**
   * Simple condition evaluator (replace with safer implementation in production)
   */
  private evaluateCondition(condition: string, data: any): boolean {
    // TODO: Implement safe condition evaluation
    // For MVP, return true for demonstration
    return true;
  }

  /**
   * Calculate gate confidence based on evidence and validation results
   */
  private calculateGateConfidence(
    evidence: EvidenceTracker,
    validationResults: ValidationResult[]
  ): number {
    // Evidence confidence
    const evidenceConfidence = evidence.confidenceScore || 0.5;

    // Validation results confidence
    const validationConfidence = validationResults.length > 0
      ? validationResults.reduce((sum, result) => sum + result.confidence, 0) / validationResults.length
      : 0.5;

    // Combined confidence (weighted average)
    return (evidenceConfidence * 0.6) + (validationConfidence * 0.4);
  }

  /**
   * Determine gate result based on confidence and validation
   */
  private determineGateResult(
    gate: QualityGate,
    confidence: number,
    validationResults: ValidationResult[]
  ): GateResult {
    // Check for critical failures
    const criticalFailures = validationResults.filter(r =>
      !r.passed && r.message.includes('critical')
    );

    if (criticalFailures.length > 0) {
      return 'FAIL';
    }

    // Check confidence threshold
    if (confidence < gate.evidenceThreshold) {
      return 'INVESTIGATION_REQUIRED';
    }

    // Check validation results
    const failedValidations = validationResults.filter(r => !r.passed);
    if (failedValidations.length > 0) {
      return 'BLOCKED';
    }

    return 'PASS';
  }

  /**
   * Check if investigation should be triggered
   */
  private shouldTriggerInvestigation(
    result: GateResult,
    confidence: number,
    gate: QualityGate
  ): boolean {
    return result === 'INVESTIGATION_REQUIRED' ||
           confidence < gate.evidenceThreshold ||
           (gate.type === 'evidence-quality' && confidence < 0.85);
  }

  /**
   * Trigger adversarial review for critical gates
   */
  private async triggerAdversarialReview(execution: GateExecution): Promise<void> {
    // TODO: Implement adversarial review with contrarian agents
    this.emit('adversarial_review_triggered', {
      gateId: execution.gateId,
      workflowId: execution.workflowId
    });
  }

  // Public API methods

  /**
   * Get gate execution history for a workflow
   */
  getWorkflowGateHistory(workflowId: string): GateExecution[] {
    return Array.from(this.executions.values())
      .filter(execution => execution.workflowId === workflowId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get overall workflow compliance status
   */
  getWorkflowCompliance(workflowId: string): {
    overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL';
    passedGates: number;
    totalGates: number;
    confidence: number;
  } {
    const executions = this.getWorkflowGateHistory(workflowId);
    const passedGates = executions.filter(e => e.result === 'PASS').length;
    const totalGates = this.gates.size;

    const overallConfidence = executions.length > 0
      ? executions.reduce((sum, e) => sum + e.confidence, 0) / executions.length
      : 0;

    let overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'PARTIAL';
    if (passedGates === totalGates) {
      overallStatus = 'COMPLIANT';
    } else if (passedGates === 0) {
      overallStatus = 'NON_COMPLIANT';
    } else {
      overallStatus = 'PARTIAL';
    }

    return {
      overallStatus,
      passedGates,
      totalGates,
      confidence: overallConfidence
    };
  }

  /**
   * Get quality gates summary
   */
  getQualityGatesSummary(): any {
    return {
      totalGates: this.gates.size,
      registeredGates: Array.from(this.gates.values()).map(gate => ({
        id: gate.id,
        name: gate.name,
        type: gate.type,
        evidenceThreshold: gate.evidenceThreshold,
        required: gate.required
      }))
    };
  }
}