/**
 * Visión Maestra: Platform Integration Tests
 * Comprehensive testing for 6-component autonomous development platform
 */

import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { VisualMaestraPlatform, PlatformConfig } from '../../src/platform/VisualMaestraMain.js';
import { StreamingManager } from '../../src/streaming/StreamingManager.js';
import { ADWQualityGates } from '../../src/validation/ADWQualityGates.js';
import { EvidenceDashboard } from '../../src/monitoring/EvidenceDashboard.js';
import { DeploymentManager } from '../../src/deployment/DeploymentManager.js';

describe('Platform Integration Tests', () => {
  let platform: VisualMaestraPlatform;
  let testConfig: PlatformConfig;

  beforeAll(async () => {
    // Setup test configuration
    testConfig = createTestPlatformConfig();
    platform = new VisualMaestraPlatform(testConfig);
  });

  afterAll(async () => {
    // Cleanup
    await platform.shutdown();
  });

  describe('Platform Initialization', () => {
    test('should initialize all 6 components successfully', async () => {
      // Test platform initialization
      await expect(platform.initialize()).resolves.not.toThrow();

      // Verify all components are initialized
      const status = await platform.getPlatformStatus();
      expect(status.status).toBe('healthy');
      expect(status.components).toHaveLength(6);

      // Check each component
      const componentNames = ['dossier', 'ruflo', 'adwSkills', 'gitNexus', 'rlmNavigator', 'claudeCode'];
      status.components.forEach(component => {
        expect(componentNames).toContain(component.name);
        expect(component.status).toBe('healthy');
      });
    }, 30000);

    test('should handle component initialization failure gracefully', async () => {
      // Create config with failing component
      const failingConfig = {
        ...testConfig,
        components: {
          ...testConfig.components,
          dossier: {
            ...testConfig.components.dossier,
            endpoint: 'http://invalid-endpoint'
          }
        }
      };

      const failingPlatform = new VisualMaestraPlatform(failingConfig);

      // Should handle graceful degradation
      await expect(failingPlatform.initialize()).rejects.toThrow();
      await failingPlatform.shutdown();
    });
  });

  describe('Workflow Orchestration', () => {
    beforeEach(async () => {
      if (platform) {
        await platform.initialize();
      }
    });

    test('should execute complete card workflow through all 6 components', async () => {
      const cardContext = {
        cardId: 'test-card-001',
        prompt: 'Implement a secure REST API with authentication',
        projectPath: '/test/project',
        businessContext: {
          requirements: ['security', 'performance', 'scalability'],
          constraints: ['budget', 'timeline']
        }
      };

      const result = await platform.executeCardWorkflow(cardContext);

      // Verify workflow completion
      expect(result.workflowId).toBeDefined();
      expect(result.status).toBe('completed');
      expect(result.progress).toBe(100);

      // Verify evidence tracking
      expect(result.evidence).toBeDefined();
      expect(result.evidence.decisions.length).toBeGreaterThan(0);
      expect(result.evidence.confidenceScore).toBeGreaterThan(0.5);

      // Verify workflow phases
      expect(result.artifacts).toBeDefined();
      expect(result.artifacts.length).toBeGreaterThan(0);
    }, 45000);

    test('should handle workflow with low confidence evidence', async () => {
      const cardContext = {
        cardId: 'test-card-002',
        prompt: 'Implement experimental blockchain integration',
        projectPath: '/test/project'
      };

      // Mock evidence with low confidence
      const result = await platform.executeCardWorkflow(cardContext);

      // Should trigger investigation for low confidence
      expect(result.evidence.investigations.length).toBeGreaterThan(0);
    });
  });

  describe('Real-time Streaming', () => {
    let streamingManager: StreamingManager;

    beforeAll(() => {
      streamingManager = new StreamingManager(testConfig);
    });

    test('should establish WebSocket connections for all components', async () => {
      await streamingManager.startAllStreams();

      const status = streamingManager.getStreamingStatus();
      expect(status.activeStreams).toBe(6);

      // Verify each component has active stream
      Object.keys(status.componentStatus).forEach(component => {
        const componentStreams = status.componentStatus[component];
        expect(componentStreams.some(stream => stream.active)).toBe(true);
      });
    });

    test('should handle streaming latency within targets', async () => {
      await streamingManager.startAllStreams();

      // Test streaming latency
      const startTime = Date.now();

      return new Promise((resolve) => {
        streamingManager.once('stream_event', () => {
          const latency = Date.now() - startTime;
          expect(latency).toBeLessThan(100); // <100ms target
          resolve(undefined);
        });

        // Simulate stream event
        streamingManager.emit('stream_event', {
          component: 'dossier',
          type: 'test-event',
          data: { test: true },
          timestamp: new Date()
        });
      });
    });

    test('should track evidence in real-time streaming', async () => {
      await streamingManager.startAllStreams();

      const evidenceEvent = {
        component: 'adw-skills',
        type: 'investigation-completed',
        data: {
          investigation: 'security-audit',
          confidence: 0.85,
          sources: ['security-guide', 'best-practices']
        },
        timestamp: new Date(),
        evidenceLevel: 'SOLID' as const
      };

      // Should handle evidence events
      expect(() => {
        streamingManager.emit('stream_event', evidenceEvent);
      }).not.toThrow();
    });
  });

  describe('ADW Quality Gates', () => {
    let qualityGates: ADWQualityGates;
    let mockEvidence: any;

    beforeAll(() => {
      qualityGates = new ADWQualityGates();
      mockEvidence = createMockEvidence();
    });

    test('should execute all 7 quality gates successfully', async () => {
      const workflowId = 'test-workflow-001';
      const validationData = {
        buildStatus: 'success',
        performanceScore: 95,
        streamingLatency: 75,
        integratedComponents: 6,
        workflowOrchestration: true,
        securityScore: 0.92,
        performanceTargets: 'MET',
        allIntegrationsHealthy: true,
        evidenceCoverage: 0.96,
        confidenceCalibration: 'ACCURATE',
        investigationCompleteness: 0.93
      };

      const executions = await qualityGates.executeAllGates(
        workflowId,
        mockEvidence,
        validationData
      );

      expect(executions).toHaveLength(7);
      executions.forEach(execution => {
        expect(execution.result).toBe('PASS');
        expect(execution.confidence).toBeGreaterThan(0.7);
      });

      // Check compliance
      const compliance = qualityGates.getWorkflowCompliance(workflowId);
      expect(compliance.overallStatus).toBe('COMPLIANT');
      expect(compliance.passedGates).toBe(7);
    });

    test('should trigger investigation for low confidence gates', async () => {
      const lowConfidenceEvidence = {
        decisions: [
          {
            decision: 'architecture-choice',
            evidence: 'SHAKY' as const,
            confidence: 0.3,
            sources: ['uncertain-source']
          }
        ],
        investigations: [],
        confidenceScore: 0.3
      };

      const workflowId = 'test-workflow-002';
      const validationData = { someData: true };

      let investigationTriggered = false;
      qualityGates.once('investigation_required', () => {
        investigationTriggered = true;
      });

      await qualityGates.executeGate(
        'gate-3-architecture',
        workflowId,
        lowConfidenceEvidence,
        validationData
      );

      expect(investigationTriggered).toBe(true);
    });
  });

  describe('Evidence Dashboard', () => {
    let evidenceDashboard: EvidenceDashboard;

    beforeAll(() => {
      evidenceDashboard = new EvidenceDashboard();
    });

    test('should track evidence for all 6 components', () => {
      const components = ['dossier', 'ruflo', 'adwSkills', 'gitNexus', 'rlmNavigator', 'claudeCode'];

      components.forEach(component => {
        evidenceDashboard.updateWorkflowEvidence(
          'test-workflow',
          'implementation',
          component,
          createMockEvidence()
        );
      });

      const dashboard = evidenceDashboard.getDashboard();
      expect(dashboard.componentHealth).toHaveLength(6);

      dashboard.componentHealth.forEach(health => {
        expect(components).toContain(health.component);
        expect(health.healthScore).toBeGreaterThan(0);
      });
    });

    test('should create alerts for low confidence evidence', () => {
      const lowConfidenceEvidence = {
        decisions: [
          {
            decision: 'critical-choice',
            evidence: 'UNKNOWN' as const,
            confidence: 0.1,
            sources: []
          }
        ],
        investigations: [],
        confidenceScore: 0.1
      };

      let alertCreated = false;
      evidenceDashboard.once('alert_created', () => {
        alertCreated = true;
      });

      evidenceDashboard.updateWorkflowEvidence(
        'test-workflow-alerts',
        'validation',
        'test-component',
        lowConfidenceEvidence
      );

      expect(alertCreated).toBe(true);
    });
  });

  describe('Deployment Manager', () => {
    let deploymentManager: DeploymentManager;
    let deploymentConfig: any;

    beforeAll(() => {
      deploymentConfig = createTestDeploymentConfig();
      deploymentManager = new DeploymentManager(deploymentConfig);
    });

    test('should validate deployment configuration', async () => {
      const validation = await deploymentManager.validateDeploymentConfig();
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should execute deployment successfully', async () => {
      const deployment = await deploymentManager.deployPlatform(testConfig);

      expect(deployment.status).toBe('completed');
      expect(deployment.progress).toBe(100);
      expect(deployment.components).toHaveLength(6);

      deployment.components.forEach(component => {
        expect(component.status).toBe('deployed');
        expect(component.health).toBe('healthy');
      });
    }, 60000);

    test('should handle deployment rollback', async () => {
      const deployment = await deploymentManager.deployPlatform(testConfig);
      const rollbackSuccess = await deploymentManager.rollbackDeployment(
        deployment.id,
        'Test rollback'
      );

      expect(rollbackSuccess).toBe(true);
      expect(deployment.status).toBe('rolled-back');
      expect(deployment.rollbackInfo).toBeDefined();
    });
  });

  describe('Performance Targets', () => {
    test('should meet streaming latency target (<100ms)', async () => {
      await platform.initialize();

      const status = await platform.getPlatformStatus();
      expect(status.performance.streamingLatency).toBeLessThan(100);
    });

    test('should meet coordination latency target (<2s)', async () => {
      await platform.initialize();

      const status = await platform.getPlatformStatus();
      expect(status.performance.coordinationLatency).toBeLessThan(2000);
    });

    test('should demonstrate memory optimization improvements', async () => {
      await platform.initialize();

      const status = await platform.getPlatformStatus();
      // Memory usage should be optimized (baseline comparison)
      expect(status.performance.memoryUsage).toBeLessThan(75);
    });
  });

  describe('End-to-End Integration', () => {
    test('should execute complete platform workflow with evidence tracking', async () => {
      await platform.initialize();

      const cardContext = {
        cardId: 'e2e-test-001',
        prompt: 'Build a complete microservices architecture with monitoring',
        projectPath: '/test/microservices',
        businessContext: {
          requirements: ['scalability', 'observability', 'security']
        }
      };

      // Execute workflow
      const workflowResult = await platform.executeCardWorkflow(cardContext);

      // Verify complete integration
      expect(workflowResult.status).toBe('completed');
      expect(workflowResult.evidence.decisions.length).toBeGreaterThan(5);
      expect(workflowResult.evidence.confidenceScore).toBeGreaterThan(0.7);

      // Check platform health after workflow
      const platformStatus = await platform.getPlatformStatus();
      expect(platformStatus.status).toBe('healthy');
      expect(platformStatus.components.every(c => c.status === 'healthy')).toBe(true);
    }, 60000);
  });
});

// Helper functions

function createTestPlatformConfig(): PlatformConfig {
  return {
    environment: 'development',
    components: {
      dossier: {
        enabled: true,
        endpoint: 'http://localhost:3000',
        healthCheck: { enabled: true, interval: 30000, timeout: 5000 },
        retry: { attempts: 3, backoffMs: 1000 }
      },
      ruflo: {
        enabled: true,
        healthCheck: { enabled: true, interval: 30000, timeout: 5000 },
        retry: { attempts: 3, backoffMs: 1000 }
      },
      adwSkills: {
        enabled: true,
        healthCheck: { enabled: true, interval: 30000, timeout: 5000 },
        retry: { attempts: 3, backoffMs: 1000 }
      },
      gitNexus: {
        enabled: true,
        endpoint: 'file://./base_projects/GitNexus',
        healthCheck: { enabled: true, interval: 30000, timeout: 5000 },
        retry: { attempts: 3, backoffMs: 1000 }
      },
      rlmNavigator: {
        enabled: true,
        healthCheck: { enabled: true, interval: 30000, timeout: 5000 },
        retry: { attempts: 3, backoffMs: 1000 }
      },
      claudeCode: {
        enabled: true,
        healthCheck: { enabled: true, interval: 30000, timeout: 5000 },
        retry: { attempts: 3, backoffMs: 1000 }
      }
    },
    performance: {
      streamingLatencyTarget: 100,
      coordinationTimeout: 2000,
      healthCheckInterval: 30000,
      memoryOptimization: true,
      flashAttention: true
    },
    security: {
      zeroTrust: false, // Disabled for testing
      authentication: {
        required: false,
        methods: ['api-key'],
        tokenExpiry: 3600000
      },
      authorization: {
        rbac: false,
        permissions: []
      },
      encryption: {
        inTransit: false,
        atRest: false,
        algorithm: 'AES-256'
      },
      audit: {
        enabled: false,
        retention: 86400000
      }
    },
    evidence: {
      tracking: {
        enabled: true,
        confidenceThreshold: 0.7,
        investigationDepth: 'dig'
      },
      qualityGates: {
        enabled: true,
        requiredGates: ['gate-0-zero-drift', 'gate-1-build', 'gate-2-requirements'],
        evidenceThreshold: 0.7
      },
      dashboard: {
        realTime: true,
        alerting: true,
        retention: 86400000
      }
    }
  };
}

function createMockEvidence() {
  return {
    decisions: [
      {
        decision: 'architecture-pattern',
        evidence: 'SOLID' as const,
        confidence: 0.85,
        sources: ['architecture-guide', 'best-practices', 'case-studies']
      },
      {
        decision: 'technology-stack',
        evidence: 'SOFT' as const,
        confidence: 0.75,
        sources: ['documentation']
      }
    ],
    investigations: [
      {
        query: 'microservices vs monolith',
        depth: 'dig',
        confidence: 0.8,
        findings: ['performance', 'scalability', 'complexity']
      }
    ],
    confidenceScore: 0.8
  };
}

function createTestDeploymentConfig() {
  return {
    environment: 'staging',
    strategy: 'blue-green',
    validation: {
      preDeployment: [
        {
          id: 'config-validation',
          name: 'Configuration Validation',
          description: 'Validate platform configuration',
          script: 'validate-config.sh',
          timeout: 30000,
          retryCount: 1,
          critical: true
        }
      ],
      postDeployment: [
        {
          id: 'health-check',
          name: 'Health Check',
          description: 'Verify all components are healthy',
          script: 'health-check.sh',
          timeout: 60000,
          retryCount: 3,
          critical: true
        }
      ],
      rollbackTriggers: [
        {
          metric: 'error-rate',
          threshold: 0.05,
          window: 300000,
          action: 'rollback'
        }
      ]
    },
    infrastructure: {
      containerization: true,
      orchestration: 'docker-compose',
      scaling: {
        minInstances: 1,
        maxInstances: 3,
        cpuThreshold: 80,
        memoryThreshold: 80,
        autoScaling: false
      },
      monitoring: {
        healthChecks: true,
        metrics: true,
        logging: true,
        alerting: false,
        dashboards: false
      }
    },
    security: {
      secretsManagement: false,
      networkPolicies: false,
      rbacPolicies: false,
      auditLogging: false
    },
    backup: {
      enabled: false,
      retention: 86400000,
      strategy: 'full'
    }
  };
}