/**
 * ADWSkillsBridge Integration Tests
 * PRODUCTION CRITICAL: Tests evidence-based investigation workflows
 */

import { ADWSkillsBridge, ADWConfig } from '../../src/bridges/ADWSkillsBridge';
import { createMockBridgeConfig } from '../setup';

describe('ADWSkillsBridge - Production Integration Tests', () => {
  let adwBridge: ADWSkillsBridge;
  let mockConfig: ADWConfig;

  beforeEach(() => {
    mockConfig = {
      ...createMockBridgeConfig(),
      methodology: {
        version: '2.0',
        strictMode: true,
        evidenceThreshold: 0.8,
        hypothesisLifetime: 86400000
      },
      investigation: {
        maxParallelInvestigations: 10,
        defaultTimeout: 60000,
        evidenceStorage: 'hybrid'
      },
      skills: {
        enabledSkills: [
          'observe_system_behavior',
          'code_quality_investigation',
          'performance_analysis',
          'security_audit',
          'dependency_analysis'
        ],
        skillRegistry: 'built-in',
        autoDiscovery: true
      },
      workflow: {
        templates: ['production-incident', 'security-review', 'performance-investigation'],
        customSteps: true,
        approvalRequired: false
      }
    } as ADWConfig;

    adwBridge = new ADWSkillsBridge(mockConfig);
  });

  afterEach(async () => {
    await adwBridge.disconnect();
  });

  describe('Investigation Lifecycle - CRITICAL', () => {
    beforeEach(async () => {
      await adwBridge.connect();
    });

    test('should create production incident investigation', async () => {
      const investigationData = {
        title: 'Production API Performance Degradation',
        description: 'API response times have increased by 300% in the last hour',
        status: 'active',
        methodology: 'pure-adw',
        investigator: 'senior-engineer',
        objectives: [
          'Identify root cause of performance degradation',
          'Assess impact on user experience',
          'Develop mitigation strategies',
          'Prevent future occurrences'
        ],
        hypotheses: [],
        priority: 'critical',
        tags: ['production', 'performance', 'api'],
        metadata: {
          environment: 'production',
          affectedServices: ['user-api', 'payment-api'],
          startTime: new Date(Date.now() - 3600000), // 1 hour ago
          severity: 'high'
        }
      };

      const result = await adwBridge.createInvestigation(investigationData);

      expect(result.success).toBe(true);
      expect(result.data?.title).toBe('Production API Performance Degradation');
      expect(result.data?.status).toBe('active');
      expect(result.data?.priority).toBe('critical');
      expect(result.data?.objectives).toHaveLength(4);
    });

    test('should manage investigation hypothesis lifecycle', async () => {
      const investigation = await adwBridge.createInvestigation({
        title: 'Database Connection Pool Investigation',
        description: 'Investigating connection pool exhaustion',
        status: 'planning',
        methodology: 'pure-adw',
        investigator: 'dba-team',
        objectives: ['Find connection leaks'],
        hypotheses: [],
        priority: 'high',
        tags: ['database', 'connections']
      });

      expect(investigation.success).toBe(true);
      const investigationId = investigation.data!.id;

      // Add initial hypothesis
      const hypothesis1 = await adwBridge.addHypothesis(investigationId, {
        statement: 'Connection pool is being exhausted due to long-running queries',
        type: 'primary',
        confidence: 0.6,
        status: 'proposed',
        supportingEvidence: [],
        contradictingEvidence: [],
        createdBy: 'dba-team'
      });

      expect(hypothesis1.success).toBe(true);
      expect(hypothesis1.data?.statement).toContain('long-running queries');

      // Add competing hypothesis
      const hypothesis2 = await adwBridge.addHypothesis(investigationId, {
        statement: 'Application is not properly closing database connections',
        type: 'alternative',
        confidence: 0.7,
        status: 'proposed',
        supportingEvidence: [],
        contradictingEvidence: [],
        createdBy: 'backend-team'
      });

      expect(hypothesis2.success).toBe(true);

      // Update hypothesis based on evidence
      const updateResult = await adwBridge.updateHypothesis(investigationId, hypothesis1.data!.id, {
        confidence: 0.8,
        status: 'investigating',
        supportingEvidence: ['evidence-001', 'evidence-002']
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.confidence).toBe(0.8);
    });

    test('should handle investigation state transitions', async () => {
      const investigation = await adwBridge.createInvestigation({
        title: 'Memory Leak Investigation',
        description: 'Application memory usage continuously growing',
        status: 'planning',
        methodology: 'pure-adw',
        investigator: 'devops-team',
        objectives: ['Identify memory leak source'],
        hypotheses: [],
        priority: 'high',
        tags: ['memory', 'performance']
      });

      const investigationId = investigation.data!.id;

      // Transition to active
      const activateResult = await adwBridge.updateInvestigationStatus(investigationId, 'active');
      expect(activateResult.success).toBe(true);
      expect(activateResult.data?.status).toBe('active');

      // Transition to on-hold
      const holdResult = await adwBridge.updateInvestigationStatus(investigationId, 'on-hold', {
        reason: 'Waiting for production maintenance window',
        heldBy: 'devops-team',
        expectedResumeDate: new Date(Date.now() + 86400000) // Tomorrow
      });

      expect(holdResult.success).toBe(true);
      expect(holdResult.data?.status).toBe('on-hold');

      // Resume investigation
      const resumeResult = await adwBridge.updateInvestigationStatus(investigationId, 'active');
      expect(resumeResult.success).toBe(true);
    });
  });

  describe('Evidence Collection - PRODUCTION CRITICAL', () => {
    let investigationId: string;

    beforeEach(async () => {
      await adwBridge.connect();

      const investigation = await adwBridge.createInvestigation({
        title: 'Evidence Collection Test',
        description: 'Testing evidence collection capabilities',
        status: 'active',
        methodology: 'pure-adw',
        investigator: 'test-engineer',
        objectives: ['Collect comprehensive evidence'],
        hypotheses: [],
        priority: 'medium',
        tags: ['testing']
      });

      investigationId = investigation.data!.id;
    });

    test('should collect system observation evidence', async () => {
      const systemEvidence = {
        type: 'observation',
        source: 'monitoring-system',
        data: {
          metric: 'cpu_usage',
          value: 85.5,
          unit: 'percentage',
          timestamp: new Date(),
          host: 'production-web-01',
          threshold: 80,
          status: 'warning'
        },
        confidence: 0.95,
        tags: ['system', 'performance', 'cpu'],
        metadata: {
          collectionMethod: 'automated',
          frequency: '1-minute',
          agent: 'prometheus'
        }
      };

      const result = await adwBridge.collectEvidence(investigationId, systemEvidence);

      expect(result.success).toBe(true);
      expect(result.data?.type).toBe('observation');
      expect(result.data?.data.metric).toBe('cpu_usage');
      expect(result.data?.confidence).toBe(0.95);
    });

    test('should collect log analysis evidence', async () => {
      const logEvidence = {
        type: 'log_analysis',
        source: 'application-logs',
        data: {
          pattern: 'ERROR.*OutOfMemoryError',
          occurrences: 15,
          timeframe: '1-hour',
          firstOccurrence: new Date(Date.now() - 3600000),
          lastOccurrence: new Date(),
          affectedThreads: ['worker-1', 'worker-3', 'worker-7'],
          stackTrace: 'java.lang.OutOfMemoryError: Java heap space\n\tat com.app.Service.processLargeData'
        },
        confidence: 0.9,
        tags: ['logs', 'memory', 'errors'],
        metadata: {
          logLevel: 'ERROR',
          service: 'data-processor',
          environment: 'production'
        }
      };

      const result = await adwBridge.collectEvidence(investigationId, logEvidence);

      expect(result.success).toBe(true);
      expect(result.data?.data.occurrences).toBe(15);
      expect(result.data?.tags).toContain('memory');
    });

    test('should collect code analysis evidence', async () => {
      const codeEvidence = {
        type: 'code_analysis',
        source: 'static-analyzer',
        data: {
          file: 'src/services/DataProcessor.java',
          line: 142,
          issue: 'Potential memory leak: ArrayList grows without bounds',
          severity: 'high',
          cwe: 'CWE-401',
          recommendation: 'Implement size limits or use bounded collections',
          codeSnippet: 'private List<Data> cache = new ArrayList<>();\n// No size management'
        },
        confidence: 0.85,
        tags: ['code-quality', 'memory-leak', 'static-analysis'],
        metadata: {
          tool: 'spotbugs',
          ruleId: 'MEMORY_LEAK_001'
        }
      };

      const result = await adwBridge.collectEvidence(investigationId, codeEvidence);

      expect(result.success).toBe(true);
      expect(result.data?.data.severity).toBe('high');
      expect(result.data?.data.cwe).toBe('CWE-401');
    });

    test('should handle evidence validation and quality checks', async () => {
      const questionableEvidence = {
        type: 'user_report',
        source: 'support-ticket',
        data: {
          ticketId: 'SUPP-12345',
          userReport: 'The app is slow sometimes',
          reporter: 'user@example.com',
          reproducible: false,
          affectedFeatures: ['search', 'possibly others?']
        },
        confidence: 0.3, // Low confidence
        tags: ['user-report', 'subjective'],
        metadata: {
          reportDate: new Date(),
          severity: 'low'
        }
      };

      const result = await adwBridge.collectEvidence(investigationId, questionableEvidence);

      expect(result.success).toBe(true);

      // Evidence should be flagged for review due to low confidence
      expect(result.data?.needsReview).toBe(true);
      expect(result.data?.qualityScore).toBeLessThan(0.5);
    });

    test('should correlate evidence across multiple sources', async () => {
      // Collect multiple related evidence pieces
      const evidenceSet = [
        {
          type: 'metric',
          source: 'monitoring',
          data: { metric: 'response_time', value: 2500, timestamp: new Date() },
          confidence: 0.95
        },
        {
          type: 'log',
          source: 'application',
          data: { message: 'Slow query detected: 2.3s', timestamp: new Date() },
          confidence: 0.9
        },
        {
          type: 'user_report',
          source: 'support',
          data: { complaint: 'Pages loading slowly', timestamp: new Date() },
          confidence: 0.7
        }
      ];

      const evidenceIds = [];
      for (const evidence of evidenceSet) {
        const result = await adwBridge.collectEvidence(investigationId, evidence);
        expect(result.success).toBe(true);
        evidenceIds.push(result.data!.id);
      }

      // Analyze correlation
      const correlationResult = await adwBridge.analyzeEvidenceCorrelation(investigationId, {
        evidenceIds,
        analysisType: 'temporal',
        timeWindow: 300000 // 5 minutes
      });

      expect(correlationResult.success).toBe(true);
      expect(correlationResult.data?.correlationScore).toBeGreaterThan(0.6);
      expect(correlationResult.data?.patterns).toBeDefined();
    });
  });

  describe('ADW Skills Execution - PERFORMANCE CRITICAL', () => {
    beforeEach(async () => {
      await adwBridge.connect();
    });

    test('should execute system behavior observation skill under 30 seconds', async () => {
      const startTime = Date.now();

      const skillResult = await adwBridge.executeSkill('observe_system_behavior', {
        duration: 60, // 1 minute observation
        metrics: ['cpu', 'memory', 'network', 'disk'],
        targets: ['production-web-01', 'production-web-02'],
        sampling: { frequency: '5s', aggregation: 'avg' },
        alerts: {
          cpu: { threshold: 80, condition: 'gt' },
          memory: { threshold: 90, condition: 'gt' }
        }
      });

      const executionTime = Date.now() - startTime;

      expect(skillResult.success).toBe(true);
      expect(executionTime).toBeLessThan(30000); // 30 second limit
      expect(skillResult.data?.data?.observations).toBeDefined();
      expect(skillResult.data?.data?.metrics).toHaveProperty('cpu');
      expect(skillResult.data?.data?.alerts).toBeDefined();
    });

    test('should execute code quality investigation skill', async () => {
      const qualityResult = await adwBridge.executeSkill('code_quality_investigation', {
        repository: 'production-app',
        branch: 'main',
        scope: 'changed-files',
        since: '7-days',
        checks: [
          'complexity',
          'duplication',
          'test-coverage',
          'security-vulnerabilities',
          'performance-patterns'
        ],
        severity: 'high'
      });

      expect(qualityResult.success).toBe(true);
      expect(qualityResult.data?.data?.summary).toBeDefined();
      expect(qualityResult.data?.data?.issues).toBeDefined();
      expect(qualityResult.data?.data?.metrics).toHaveProperty('complexity');
    });

    test('should execute performance analysis skill with load testing', async () => {
      const perfResult = await adwBridge.executeSkill('performance_analysis', {
        target: 'https://api.production.com/health',
        loadTest: {
          users: 100,
          duration: 120, // 2 minutes
          rampUp: 30 // 30 seconds
        },
        metrics: [
          'response-time',
          'throughput',
          'error-rate',
          'resource-usage'
        ],
        thresholds: {
          'response-time': { p95: 1000, p99: 2000 },
          'error-rate': { max: 0.1 },
          'throughput': { min: 100 }
        }
      });

      expect(perfResult.success).toBe(true);
      expect(perfResult.data?.data?.results).toBeDefined();
      expect(perfResult.data?.data?.passed).toBeDefined();
      expect(perfResult.data?.data?.metrics['response-time']).toBeDefined();
    });

    test('should execute security audit skill', async () => {
      const securityResult = await adwBridge.executeSkill('security_audit', {
        scope: 'api-endpoints',
        target: 'https://api.production.com',
        checks: [
          'authentication',
          'authorization',
          'input-validation',
          'sql-injection',
          'xss',
          'csrf',
          'rate-limiting',
          'https-enforcement'
        ],
        depth: 'comprehensive'
      });

      expect(securityResult.success).toBe(true);
      expect(securityResult.data?.data?.vulnerabilities).toBeDefined();
      expect(securityResult.data?.data?.overall.score).toBeGreaterThanOrEqual(0);
      expect(securityResult.data?.data?.recommendations).toBeDefined();
    });

    test('should handle skill execution failures gracefully', async () => {
      const failingSkill = await adwBridge.executeSkill('non_existent_skill', {
        parameter: 'value'
      });

      expect(failingSkill.success).toBe(false);
      expect(failingSkill.error).toContain('skill not found');

      // Bridge should remain operational after failed skill execution
      const health = await adwBridge.getHealth();
      expect(health.status).toBe('healthy');
    });
  });

  describe('Investigation Workflow Integration', () => {
    let investigationId: string;

    beforeEach(async () => {
      await adwBridge.connect();

      const investigation = await adwBridge.createInvestigation({
        title: 'Workflow Integration Test',
        description: 'Testing full investigation workflow',
        status: 'active',
        methodology: 'pure-adw',
        investigator: 'workflow-tester',
        objectives: ['Complete workflow validation'],
        hypotheses: [],
        priority: 'medium',
        tags: ['workflow', 'integration']
      });

      investigationId = investigation.data!.id;
    });

    test('should execute complete investigation workflow', async () => {
      // Step 1: Add hypothesis
      const hypothesis = await adwBridge.addHypothesis(investigationId, {
        statement: 'Performance degradation is caused by database connection issues',
        type: 'primary',
        confidence: 0.5,
        status: 'proposed',
        supportingEvidence: [],
        contradictingEvidence: [],
        createdBy: 'workflow-tester'
      });

      expect(hypothesis.success).toBe(true);

      // Step 2: Execute investigation skills to gather evidence
      const systemObservation = await adwBridge.executeSkill('observe_system_behavior', {
        duration: 30,
        metrics: ['cpu', 'memory', 'network'],
        targets: ['database-server']
      });

      expect(systemObservation.success).toBe(true);

      // Step 3: Collect evidence from skill execution
      const evidence = await adwBridge.collectEvidence(investigationId, {
        type: 'observation',
        source: 'system-monitoring',
        data: systemObservation.data?.data,
        confidence: 0.9,
        tags: ['system', 'database']
      });

      expect(evidence.success).toBe(true);

      // Step 4: Update hypothesis based on evidence
      const updatedHypothesis = await adwBridge.updateHypothesis(investigationId, hypothesis.data!.id, {
        confidence: 0.8,
        status: 'investigating',
        supportingEvidence: [evidence.data!.id]
      });

      expect(updatedHypothesis.success).toBe(true);

      // Step 5: Generate investigation summary
      const summary = await adwBridge.generateInvestigationSummary(investigationId);

      expect(summary.success).toBe(true);
      expect(summary.data?.hypotheses).toHaveLength(1);
      expect(summary.data?.evidence).toHaveLength(1);
      expect(summary.data?.confidence).toBeGreaterThan(0.5);
    });

    test('should handle investigation branching scenarios', async () => {
      // Create competing hypotheses
      const hypotheses = [
        {
          statement: 'Issue is caused by network latency',
          type: 'primary',
          confidence: 0.6
        },
        {
          statement: 'Issue is caused by database query performance',
          type: 'alternative',
          confidence: 0.7
        },
        {
          statement: 'Issue is caused by application memory leaks',
          type: 'alternative',
          confidence: 0.4
        }
      ];

      const hypothesisResults = [];
      for (const hyp of hypotheses) {
        const result = await adwBridge.addHypothesis(investigationId, {
          ...hyp,
          status: 'proposed',
          supportingEvidence: [],
          contradictingEvidence: [],
          createdBy: 'workflow-tester'
        });
        expect(result.success).toBe(true);
        hypothesisResults.push(result.data!);
      }

      // Execute skills to test each hypothesis
      const networkTest = await adwBridge.executeSkill('network_analysis', {
        target: 'database-server',
        tests: ['latency', 'packet-loss', 'throughput']
      });

      if (networkTest.success) {
        await adwBridge.collectEvidence(investigationId, {
          type: 'network_test',
          source: 'network-analyzer',
          data: networkTest.data?.data,
          confidence: 0.85,
          tags: ['network', 'latency']
        });
      }

      // Analysis should prioritize hypotheses based on evidence
      const analysis = await adwBridge.analyzeInvestigationProgress(investigationId);

      expect(analysis.success).toBe(true);
      expect(analysis.data?.recommendedActions).toBeDefined();
      expect(analysis.data?.confidenceRanking).toBeDefined();
    });
  });

  describe('Performance & Scalability', () => {
    beforeEach(async () => {
      await adwBridge.connect();
    });

    test('should handle multiple concurrent investigations', async () => {
      const investigations = Array(5).fill(0).map((_, i) => ({
        title: `Concurrent Investigation ${i + 1}`,
        description: `Performance test investigation ${i + 1}`,
        status: 'active',
        methodology: 'pure-adw',
        investigator: 'performance-tester',
        objectives: ['Test concurrent processing'],
        hypotheses: [],
        priority: 'medium',
        tags: ['concurrent', 'performance']
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        investigations.map(inv => adwBridge.createInvestigation(inv))
      );
      const totalTime = Date.now() - startTime;

      // All investigations should be created successfully
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should handle concurrency efficiently
      expect(totalTime).toBeLessThan(5000); // 5 second limit
    });

    test('should maintain performance with large evidence datasets', async () => {
      const investigation = await adwBridge.createInvestigation({
        title: 'Large Dataset Investigation',
        description: 'Testing with large evidence dataset',
        status: 'active',
        methodology: 'pure-adw',
        investigator: 'data-tester',
        objectives: ['Test large dataset handling'],
        hypotheses: [],
        priority: 'medium',
        tags: ['large-data']
      });

      const investigationId = investigation.data!.id;

      // Collect many evidence pieces
      const evidencePromises = Array(50).fill(0).map((_, i) =>
        adwBridge.collectEvidence(investigationId, {
          type: 'metric',
          source: 'load-generator',
          data: {
            metric: `test_metric_${i}`,
            value: Math.random() * 100,
            timestamp: new Date()
          },
          confidence: 0.8,
          tags: ['load-test', 'metrics']
        })
      );

      const startTime = Date.now();
      const results = await Promise.all(evidencePromises);
      const totalTime = Date.now() - startTime;

      // All evidence should be collected successfully
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should handle large datasets efficiently
      expect(totalTime).toBeLessThan(10000); // 10 second limit

      // Summary generation should still work efficiently
      const summaryStart = Date.now();
      const summary = await adwBridge.generateInvestigationSummary(investigationId);
      const summaryTime = Date.now() - summaryStart;

      expect(summary.success).toBe(true);
      expect(summaryTime).toBeLessThan(5000); // 5 second limit
    });
  });
});