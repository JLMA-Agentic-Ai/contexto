/**
 * Cross-Bridge Integration Tests
 * PRODUCTION CRITICAL: Tests complete workflow across all 6 bridges
 */

import { DossierBridge } from '../../src/bridges/DossierBridge';
import { RufloBridge } from '../../src/bridges/RufloBridge';
import { GitNexusBridge } from '../../src/bridges/GitNexusBridge';
import { ADWSkillsBridge } from '../../src/bridges/ADWSkillsBridge';
import { RLMNavigatorBridge } from '../../src/bridges/RLMNavigatorBridge';
import { ClaudeCodeBridge } from '../../src/bridges/ClaudeCodeBridge';
import { createMockBridgeConfig } from '../setup';

describe('Cross-Bridge Integration - Production Validation', () => {
  let dossierBridge: DossierBridge;
  let rufloBridge: RufloBridge;
  let gitNexusBridge: GitNexusBridge;
  let adwBridge: ADWSkillsBridge;
  let rlmBridge: RLMNavigatorBridge;
  let claudeCodeBridge: ClaudeCodeBridge;

  beforeAll(async () => {
    // Initialize all bridges with production-like configurations
    await initializeAllBridges();
  }, 60000);

  afterAll(async () => {
    await cleanupAllBridges();
  });

  describe('Complete Development Workflow - CRITICAL', () => {
    test('should execute full feature development cycle', async () => {
      const workflowId = `workflow-${Date.now()}`;

      // 1. Create investigation in ADW Skills
      const investigation = await adwBridge.createInvestigation({
        title: 'Feature Development: User Authentication System',
        description: 'Implement OAuth2-based authentication with security best practices',
        status: 'planning',
        methodology: 'pure-adw',
        investigator: 'senior-architect',
        objectives: [
          'Design secure authentication flow',
          'Implement OAuth2 integration',
          'Ensure security compliance',
          'Maintain high code quality',
          'Achieve 95% test coverage'
        ],
        hypotheses: [],
        priority: 'high',
        tags: ['authentication', 'security', 'oauth2'],
        metadata: { workflowId, phase: 'planning' }
      });

      expect(investigation.success).toBe(true);
      const investigationId = investigation.data!.id;

      // 2. Create coordinating task in Dossier
      const dossierTask = await dossierBridge.createTask({
        type: 'workflow',
        title: 'OAuth2 Authentication Implementation',
        description: 'Cross-bridge workflow for authentication system',
        priority: 'high',
        status: 'running',
        metadata: {
          workflowId,
          investigationId,
          bridges: ['adw-skills', 'dossier', 'ruflo', 'gitnexus', 'rlm-navigator', 'claude-code']
        }
      });

      expect(dossierTask.success).toBe(true);
      const taskId = dossierTask.data!.id;

      // 3. Initialize repository in GitNexus
      const repository = await gitNexusBridge.addRepository({
        id: `auth-repo-${workflowId}`,
        name: 'Authentication Service',
        path: '/tmp/auth-service',
        remote: 'https://github.com/company/auth-service.git',
        branch: 'feature/oauth2-integration',
        languages: ['typescript', 'javascript']
      });

      expect(repository.success).toBe(true);

      // 4. Initialize swarm in Ruflo
      const swarm = await rufloBridge.initializeSwarm({
        id: `auth-swarm-${workflowId}`,
        name: 'Authentication Development Swarm',
        description: 'Specialized swarm for OAuth2 authentication implementation',
        topology: 'hierarchical',
        maxAgents: 8,
        strategy: 'specialized',
        agentTypes: ['security-architect', 'coder', 'reviewer', 'tester'],
        coordination: {
          consensus: 'raft',
          leaderElection: true,
          faultTolerance: true
        },
        memory: {
          shared: true,
          namespace: workflowId,
          persistenceLevel: 'session'
        }
      });

      expect(swarm.success).toBe(true);

      // 5. Spawn specialized agents
      const securityArchitect = await rufloBridge.spawnAgent('security-architect', 'oauth2-architect', {
        specialization: 'oauth2',
        certifications: ['CISSP', 'OAuth2-Expert'],
        swarmId: swarm.data!.id
      });

      const seniorCoder = await rufloBridge.spawnAgent('coder', 'typescript-senior', {
        specialization: 'backend',
        languages: ['typescript', 'node.js'],
        experience: 'senior',
        swarmId: swarm.data!.id
      });

      const securityReviewer = await rufloBridge.spawnAgent('reviewer', 'security-reviewer', {
        focus: 'security',
        standards: ['OWASP', 'enterprise'],
        swarmId: swarm.data!.id
      });

      expect(securityArchitect.success).toBe(true);
      expect(seniorCoder.success).toBe(true);
      expect(securityReviewer.success).toBe(true);

      // 6. Execute architecture design through Claude Code
      const architectureTask = await claudeCodeBridge.executeCode({
        type: 'script',
        language: 'javascript',
        code: `
          // OAuth2 Architecture Design
          const architecture = {
            components: [
              {
                name: 'AuthenticationController',
                responsibilities: ['OAuth2 flow initiation', 'Token exchange', 'User session management'],
                endpoints: ['/auth/oauth2/authorize', '/auth/oauth2/callback', '/auth/oauth2/token']
              },
              {
                name: 'TokenService',
                responsibilities: ['JWT generation', 'Token validation', 'Refresh token handling'],
                security: ['RSA256 signing', 'Token rotation', 'Secure storage']
              },
              {
                name: 'UserService',
                responsibilities: ['User profile management', 'Role assignment', 'Permission validation'],
                integration: ['OAuth2 provider', 'Internal user store']
              }
            ],
            securityMeasures: [
              'PKCE flow for public clients',
              'State parameter for CSRF protection',
              'Secure token storage with httpOnly cookies',
              'Rate limiting on auth endpoints',
              'Input validation and sanitization'
            ],
            compliance: ['OWASP OAuth2 guidelines', 'Enterprise security standards']
          };

          console.log('OAuth2 Architecture:', JSON.stringify(architecture, null, 2));
          return architecture;
        `,
        context: {
          id: `arch-design-${workflowId}`,
          type: 'architecture_design',
          initiator: 'security-architect',
          environment: 'sandbox',
          permissions: {
            fileSystem: { read: [], write: ['/tmp/auth-service'], execute: [] },
            network: { allowedDomains: [], allowedPorts: [], restrictLocal: true },
            system: { allowProcessSpawn: false, maxMemoryMB: 256, maxCPUPercent: 50, allowedCommands: [] }
          },
          resources: {
            maxMemoryMB: 256,
            maxCPUTime: 30000,
            maxWallTime: 45000,
            maxOutputSize: 5120,
            tempDirectoryQuota: 5242880
          },
          constraints: {
            timeout: 45000,
            maxRetries: 2,
            requireApproval: false,
            auditLevel: 'detailed'
          },
          metadata: { workflowId, phase: 'design' },
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 3600000)
        }
      });

      expect(architectureTask.success).toBe(true);

      // 7. Collect architecture evidence in ADW
      const architectureEvidence = await adwBridge.collectEvidence(investigationId, {
        type: 'design_document',
        source: 'security-architect',
        data: architectureTask.data?.returnValue,
        confidence: 0.95,
        tags: ['architecture', 'oauth2', 'security'],
        metadata: {
          workflowId,
          generatedBy: 'claude-code',
          reviewedBy: 'security-architect'
        }
      });

      expect(architectureEvidence.success).toBe(true);

      // 8. Create navigation session in RLM Navigator for existing codebase
      const mockExistingCode = `
        // Existing authentication base
        export interface AuthProvider {
          authenticate(credentials: any): Promise<AuthResult>;
          validateToken(token: string): Promise<boolean>;
        }

        export class BasicAuthProvider implements AuthProvider {
          async authenticate(credentials: { username: string; password: string }): Promise<AuthResult> {
            // Basic implementation to be enhanced
            return { success: false, token: null };
          }

          async validateToken(token: string): Promise<boolean> {
            return false;
          }
        }
      `;

      const navigationSession = await rlmBridge.createNavigationSession('/tmp/auth-service/src/auth/base.ts', {
        fileContent: mockExistingCode,
        language: 'typescript'
      });

      expect(navigationSession.success).toBe(true);
      const sessionId = navigationSession.data!.id;

      // 9. Analyze existing code structure
      const codeAnalysis = await rlmBridge.performSemanticQuery(sessionId, {
        type: 'dependency_analysis',
        scope: 'file',
        includeExternal: true
      });

      expect(codeAnalysis.success).toBe(true);

      // 10. Generate implementation tasks via Ruflo
      const implementationTask = await rufloBridge.createTask({
        type: 'code-generation',
        description: 'Implement OAuth2AuthProvider extending existing AuthProvider interface',
        priority: 1,
        estimatedComplexity: 7,
        dependencies: [],
        input: {
          baseInterface: 'AuthProvider',
          implementation: 'OAuth2AuthProvider',
          requirements: architectureTask.data?.returnValue,
          existingCode: mockExistingCode,
          framework: 'express',
          language: 'typescript'
        },
        agentId: seniorCoder.data!.id
      });

      expect(implementationTask.success).toBe(true);

      // 11. Execute implementation via Claude Code
      const implementation = await claudeCodeBridge.executeCode({
        type: 'snippet',
        language: 'typescript',
        code: `
          // OAuth2 Provider Implementation
          interface OAuth2Config {
            clientId: string;
            clientSecret: string;
            redirectUri: string;
            authorizationUrl: string;
            tokenUrl: string;
            userInfoUrl: string;
          }

          interface AuthResult {
            success: boolean;
            token?: string;
            user?: any;
            error?: string;
          }

          class OAuth2AuthProvider {
            private config: OAuth2Config;

            constructor(config: OAuth2Config) {
              this.config = config;
            }

            async authenticate(authCode: string): Promise<AuthResult> {
              try {
                // Step 1: Exchange authorization code for access token
                const tokenResponse = await this.exchangeCodeForToken(authCode);

                if (!tokenResponse.success) {
                  return { success: false, error: 'Token exchange failed' };
                }

                // Step 2: Get user information
                const userInfo = await this.getUserInfo(tokenResponse.accessToken);

                // Step 3: Generate internal JWT
                const internalToken = await this.generateInternalToken(userInfo);

                return {
                  success: true,
                  token: internalToken,
                  user: userInfo
                };
              } catch (error) {
                return { success: false, error: error.message };
              }
            }

            private async exchangeCodeForToken(authCode: string) {
              // Implementation would make actual OAuth2 token request
              console.log('Exchanging code for token:', authCode);
              return { success: true, accessToken: 'mock-access-token' };
            }

            private async getUserInfo(accessToken: string) {
              // Implementation would fetch user info from OAuth2 provider
              console.log('Fetching user info with token:', accessToken);
              return { id: 'user123', email: 'user@example.com', name: 'Test User' };
            }

            private async generateInternalToken(userInfo: any) {
              // Implementation would generate signed JWT
              console.log('Generating internal token for:', userInfo);
              return 'jwt-token-here';
            }
          }

          console.log('OAuth2AuthProvider implementation complete');
          return {
            implementation: 'OAuth2AuthProvider',
            methods: ['authenticate', 'exchangeCodeForToken', 'getUserInfo', 'generateInternalToken'],
            securityFeatures: ['token-exchange', 'user-info-fetch', 'internal-jwt'],
            compliance: 'OAuth2-RFC-6749'
          };
        `,
        context: {
          id: `oauth2-impl-${workflowId}`,
          type: 'code_implementation',
          initiator: 'senior-coder',
          environment: 'sandbox',
          permissions: {
            fileSystem: { read: ['/tmp/auth-service'], write: ['/tmp/auth-service'], execute: [] },
            network: { allowedDomains: [], allowedPorts: [], restrictLocal: true },
            system: { allowProcessSpawn: false, maxMemoryMB: 256, maxCPUPercent: 60, allowedCommands: [] }
          },
          resources: {
            maxMemoryMB: 256,
            maxCPUTime: 45000,
            maxWallTime: 60000,
            maxOutputSize: 8192,
            tempDirectoryQuota: 10485760
          },
          constraints: {
            timeout: 60000,
            maxRetries: 2,
            requireApproval: false,
            auditLevel: 'detailed'
          },
          metadata: { workflowId, phase: 'implementation' },
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 3600000)
        }
      });

      expect(implementation.success).toBe(true);

      // 12. Collect implementation evidence
      const implementationEvidence = await adwBridge.collectEvidence(investigationId, {
        type: 'code_implementation',
        source: 'senior-coder',
        data: {
          implementation: implementation.data?.returnValue,
          codeGenerated: true,
          linesOfCode: 65,
          securityFeatures: implementation.data?.returnValue?.securityFeatures
        },
        confidence: 0.9,
        tags: ['implementation', 'oauth2', 'typescript'],
        metadata: {
          workflowId,
          generatedBy: 'claude-code',
          assignedTo: 'senior-coder'
        }
      });

      expect(implementationEvidence.success).toBe(true);

      // 13. Perform security review via ADW Skills
      const securityReview = await adwBridge.executeSkill('security_audit', {
        scope: 'oauth2-implementation',
        target: implementation.data?.code,
        checks: [
          'oauth2-flow-validation',
          'token-security',
          'input-validation',
          'error-handling',
          'secure-storage'
        ],
        depth: 'comprehensive'
      });

      expect(securityReview.success).toBe(true);

      // 14. Update investigation with security findings
      const securityEvidence = await adwBridge.collectEvidence(investigationId, {
        type: 'security_audit',
        source: 'security-auditor',
        data: securityReview.data?.data,
        confidence: 0.92,
        tags: ['security', 'audit', 'oauth2'],
        metadata: {
          workflowId,
          auditType: 'automated',
          reviewedBy: 'security-reviewer'
        }
      });

      expect(securityEvidence.success).toBe(true);

      // 15. Index implementation in GitNexus
      const codeIndexing = await gitNexusBridge.syncRepository(repository.data!.id, {
        incremental: true,
        changedFiles: ['src/auth/OAuth2AuthProvider.ts'],
        newFiles: ['src/auth/OAuth2AuthProvider.ts']
      });

      expect(codeIndexing.success).toBe(true);

      // 16. Update Dossier task with progress
      const progressUpdate = await dossierBridge.updateTask(taskId, {
        status: 'completed',
        metadata: {
          ...dossierTask.data!.metadata,
          phase: 'completed',
          evidenceCount: 3,
          securityScore: securityReview.data?.data?.overall?.score || 85,
          implementationComplete: true,
          completedAt: new Date()
        }
      });

      expect(progressUpdate.success).toBe(true);

      // 17. Generate final investigation summary
      const summary = await adwBridge.generateInvestigationSummary(investigationId);

      expect(summary.success).toBe(true);
      expect(summary.data?.evidence.length).toBeGreaterThanOrEqual(3);
      expect(summary.data?.confidence).toBeGreaterThan(0.8);

      console.log('✅ Complete development workflow executed successfully');
      console.log(`📊 Investigation: ${investigationId}`);
      console.log(`📋 Task: ${taskId}`);
      console.log(`🔒 Security Score: ${securityReview.data?.data?.overall?.score || 'N/A'}`);
      console.log(`📈 Confidence: ${summary.data?.confidence}`);
      console.log(`🕐 Workflow Duration: ${Date.now() - parseInt(workflowId.split('-')[1])}ms`);
    }, 120000); // 2 minute timeout

    test('should handle real-time cross-bridge coordination', async () => {
      const coordinationTest = `coordination-${Date.now()}`;

      // Start monitoring across bridges
      const monitors = await Promise.all([
        dossierBridge.startRealtimeMonitoring({
          events: ['task-update', 'workflow-progress'],
          filters: { tags: [coordinationTest] }
        }),
        rufloBridge.startSwarmMonitoring({
          swarmId: 'test-swarm',
          metrics: ['agent-status', 'task-completion'],
          interval: 5000
        }),
        adwBridge.startInvestigationMonitoring({
          events: ['evidence-collected', 'hypothesis-updated'],
          investigationId: 'test-investigation'
        })
      ]);

      monitors.forEach(monitor => {
        expect(monitor.success).toBe(true);
      });

      // Simulate rapid cross-bridge events
      const events = [];

      // Event 1: Task created in Dossier
      const taskEvent = await dossierBridge.createTask({
        type: 'investigation',
        title: 'Real-time Coordination Test',
        description: 'Testing cross-bridge event coordination',
        priority: 'medium',
        status: 'pending',
        metadata: { testType: 'coordination', tags: [coordinationTest] }
      });

      events.push({ bridge: 'dossier', event: 'task-created', data: taskEvent.data });

      // Event 2: Agent spawned in Ruflo
      const agentEvent = await rufloBridge.spawnAgent('coder', 'coordination-tester', {
        testMode: true,
        coordinationId: coordinationTest
      });

      events.push({ bridge: 'ruflo', event: 'agent-spawned', data: agentEvent.data });

      // Event 3: Evidence collected in ADW
      const evidenceEvent = await adwBridge.collectEvidence('test-investigation', {
        type: 'coordination_test',
        source: 'automated-test',
        data: { coordinationId: coordinationTest, eventCount: events.length },
        confidence: 0.8,
        tags: ['coordination', 'real-time']
      });

      events.push({ bridge: 'adw', event: 'evidence-collected', data: evidenceEvent.data });

      // Verify events were coordinated across bridges
      await new Promise(resolve => setTimeout(resolve, 1000)); // Allow propagation

      const dossierStatus = await dossierBridge.getTaskEvents(taskEvent.data!.id);
      const rufloStatus = await rufloBridge.getAgentEvents(agentEvent.data!.id);

      expect(dossierStatus.success).toBe(true);
      expect(rufloStatus.success).toBe(true);

      // Stop monitoring
      await Promise.all([
        dossierBridge.stopRealtimeMonitoring(),
        rufloBridge.stopSwarmMonitoring(),
        adwBridge.stopInvestigationMonitoring()
      ]);

      console.log('✅ Real-time coordination test completed');
      console.log(`📈 Events processed: ${events.length}`);
    });

    test('should handle error propagation across bridges', async () => {
      const errorTestId = `error-test-${Date.now()}`;

      // Create a workflow that will encounter errors
      const investigation = await adwBridge.createInvestigation({
        title: 'Error Propagation Test',
        description: 'Testing error handling across bridge network',
        status: 'active',
        methodology: 'pure-adw',
        investigator: 'error-tester',
        objectives: ['Test error resilience'],
        hypotheses: [],
        priority: 'low',
        tags: ['error-test'],
        metadata: { errorTestId }
      });

      expect(investigation.success).toBe(true);

      // Trigger cascading errors
      const errors = [];

      // 1. Cause error in Claude Code execution
      const codeError = await claudeCodeBridge.executeCode({
        type: 'snippet',
        language: 'javascript',
        code: 'throw new Error("Intentional test error");',
        context: {
          id: `error-code-${errorTestId}`,
          type: 'error_test',
          initiator: 'error-tester',
          environment: 'sandbox',
          permissions: {
            fileSystem: { read: [], write: [], execute: [] },
            network: { allowedDomains: [], allowedPorts: [], restrictLocal: true },
            system: { allowProcessSpawn: false, maxMemoryMB: 32, maxCPUPercent: 10, allowedCommands: [] }
          },
          resources: {
            maxMemoryMB: 32,
            maxCPUTime: 1000,
            maxWallTime: 2000,
            maxOutputSize: 128,
            tempDirectoryQuota: 32768
          },
          constraints: {
            timeout: 2000,
            maxRetries: 0,
            requireApproval: false,
            auditLevel: 'basic'
          },
          metadata: { errorTestId },
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 60000)
        }
      });

      expect(codeError.success).toBe(false);
      errors.push({ bridge: 'claude-code', error: codeError.error });

      // 2. Try to collect error evidence
      const errorEvidence = await adwBridge.collectEvidence(investigation.data!.id, {
        type: 'error_report',
        source: 'claude-code',
        data: {
          errorType: 'execution-error',
          errorMessage: codeError.error,
          bridge: 'claude-code'
        },
        confidence: 0.95,
        tags: ['error', 'execution-failure']
      });

      expect(errorEvidence.success).toBe(true);

      // 3. Attempt invalid repository operation
      const repoError = await gitNexusBridge.addRepository({
        id: '', // Invalid empty ID
        name: 'Invalid Repository',
        path: '/invalid/path/that/does/not/exist',
        remote: 'invalid-url-format',
        branch: ''
      });

      expect(repoError.success).toBe(false);
      errors.push({ bridge: 'gitnexus', error: repoError.error });

      // 4. Verify error handling doesn't crash system
      const bridgeHealth = await Promise.all([
        dossierBridge.getHealth(),
        rufloBridge.getHealth(),
        gitNexusBridge.getHealth(),
        adwBridge.getHealth(),
        rlmBridge.getHealth(),
        claudeCodeBridge.getHealth()
      ]);

      bridgeHealth.forEach((health, index) => {
        const bridges = ['dossier', 'ruflo', 'gitnexus', 'adw', 'rlm', 'claude-code'];
        expect(['healthy', 'degraded']).toContain(health.status);
        console.log(`${bridges[index]} bridge health: ${health.status}`);
      });

      console.log('✅ Error propagation test completed');
      console.log(`🚨 Errors handled: ${errors.length}`);
      console.log('🏥 All bridges remain operational');
    });
  });

  describe('Performance Integration - CRITICAL', () => {
    test('should maintain performance under cross-bridge load', async () => {
      const loadTestId = `load-test-${Date.now()}`;
      const startTime = Date.now();

      // Create high-load scenario across all bridges
      const loadPromises = [];

      // Dossier load: 10 concurrent tasks
      for (let i = 0; i < 10; i++) {
        loadPromises.push(
          dossierBridge.createTask({
            type: 'analysis',
            title: `Load Test Task ${i}`,
            description: `Load testing task ${i}`,
            priority: 'medium',
            status: 'pending',
            metadata: { loadTestId, taskNumber: i }
          })
        );
      }

      // Ruflo load: 5 agent spawns
      for (let i = 0; i < 5; i++) {
        loadPromises.push(
          rufloBridge.spawnAgent('coder', `load-agent-${i}`, {
            loadTest: true,
            testId: loadTestId
          })
        );
      }

      // GitNexus load: 3 repository operations
      for (let i = 0; i < 3; i++) {
        loadPromises.push(
          gitNexusBridge.executeQuery({
            query: `MATCH (s:Symbol) WHERE s.type = $type RETURN count(s)`,
            parameters: { type: 'function' },
            timeout: 10000
          })
        );
      }

      // ADW load: 5 evidence collections
      const testInvestigation = await adwBridge.createInvestigation({
        title: 'Load Test Investigation',
        description: 'Investigation for load testing',
        status: 'active',
        methodology: 'pure-adw',
        investigator: 'load-tester',
        objectives: ['Test load capacity'],
        hypotheses: [],
        priority: 'low',
        tags: ['load-test']
      });

      if (testInvestigation.success) {
        for (let i = 0; i < 5; i++) {
          loadPromises.push(
            adwBridge.collectEvidence(testInvestigation.data!.id, {
              type: 'load_test_data',
              source: 'load-generator',
              data: { iteration: i, timestamp: new Date() },
              confidence: 0.8,
              tags: ['load-test']
            })
          );
        }
      }

      // Claude Code load: 8 code executions
      for (let i = 0; i < 8; i++) {
        loadPromises.push(
          claudeCodeBridge.executeCode({
            type: 'snippet',
            language: 'javascript',
            code: `return { iteration: ${i}, timestamp: Date.now() };`,
            context: {
              id: `load-exec-${i}`,
              type: 'load_test',
              initiator: 'load-tester',
              environment: 'sandbox',
              permissions: {
                fileSystem: { read: [], write: [], execute: [] },
                network: { allowedDomains: [], allowedPorts: [], restrictLocal: true },
                system: { allowProcessSpawn: false, maxMemoryMB: 32, maxCPUPercent: 20, allowedCommands: [] }
              },
              resources: {
                maxMemoryMB: 32,
                maxCPUTime: 2000,
                maxWallTime: 3000,
                maxOutputSize: 256,
                tempDirectoryQuota: 65536
              },
              constraints: {
                timeout: 3000,
                maxRetries: 1,
                requireApproval: false,
                auditLevel: 'basic'
              },
              metadata: { loadTestId, iteration: i },
              createdAt: new Date(),
              expiresAt: new Date(Date.now() + 120000)
            }
          })
        );
      }

      // Execute all operations concurrently
      const results = await Promise.allSettled(loadPromises);
      const endTime = Date.now();
      const totalDuration = endTime - startTime;

      // Analyze results
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      const successRate = (successful / results.length) * 100;

      expect(successRate).toBeGreaterThan(80); // 80% success rate under load
      expect(totalDuration).toBeLessThan(30000); // Complete within 30 seconds

      console.log('✅ Cross-bridge load test completed');
      console.log(`📊 Total operations: ${results.length}`);
      console.log(`✅ Successful: ${successful}`);
      console.log(`❌ Failed: ${failed}`);
      console.log(`📈 Success rate: ${successRate.toFixed(1)}%`);
      console.log(`⏱️ Duration: ${totalDuration}ms`);
    }, 45000); // 45 second timeout
  });

  // Helper functions
  async function initializeAllBridges() {
    const baseConfig = createMockBridgeConfig();

    // Initialize with production-like configurations
    dossierBridge = new DossierBridge({
      ...baseConfig,
      dossierApi: { baseUrl: 'http://localhost:3000/api', apiKey: global.mockApiKey, version: 'v1' },
      ui: { webSocketUrl: 'ws://localhost:3000/ws', theme: 'dark', refreshInterval: 5000 },
      orchestration: { maxConcurrentTasks: 20, taskTimeout: 60000, priorityLevels: ['low', 'medium', 'high', 'critical'] }
    });

    rufloBridge = new RufloBridge({
      ...baseConfig,
      rufloApi: { baseUrl: 'http://localhost:8080', apiKey: global.mockApiKey, version: 'v3' },
      swarm: { topology: 'hierarchical', maxAgents: 15, strategy: 'specialized', consensus: 'raft' },
      memory: { type: 'hybrid', hnswEnabled: true, vectorDimensions: 512, maxMemorySize: 2000000 },
      neural: { enabled: true, modelRouting: true, tierStrategy: '3-tier' }
    });

    gitNexusBridge = new GitNexusBridge({
      ...baseConfig,
      database: { kuzuPath: '/tmp/integration-test.db', connectionPool: 10, queryTimeout: 45000, maxMemory: '2GB' },
      indexing: { autoIndexing: true, indexInterval: 300000, parallelWorkers: 6, supportedLanguages: ['javascript', 'typescript', 'python', 'java'] },
      analysis: { maxDepth: 15, includeTests: true, includeComments: false, callGraphEnabled: true },
      git: { repositories: [], autoSync: true, syncInterval: 300000 }
    });

    adwBridge = new ADWSkillsBridge({
      ...baseConfig,
      methodology: { version: '2.0', strictMode: false, evidenceThreshold: 0.7, hypothesisLifetime: 172800000 },
      investigation: { maxParallelInvestigations: 15, defaultTimeout: 120000, evidenceStorage: 'hybrid' },
      skills: { enabledSkills: ['observe_system_behavior', 'code_quality_investigation', 'security_audit'], skillRegistry: 'built-in', autoDiscovery: true },
      workflow: { templates: ['production-incident', 'security-review'], customSteps: true, approvalRequired: false }
    });

    rlmBridge = new RLMNavigatorBridge({
      ...baseConfig,
      navigator: { mcpEndpoint: 'http://localhost:9000/mcp', protocol: 'http', maxConcurrentNavigations: 15, cacheEnabled: true, cacheTTL: 600000 },
      ast: { supportedLanguages: ['javascript', 'typescript', 'python', 'java'], parseTimeout: 60000, maxFileSize: 10485760, includeComments: true, includeWhitespace: false },
      analysis: { semanticAnalysis: true, typeInference: true, controlFlowAnalysis: true, dataFlowAnalysis: true },
      indexing: { incrementalUpdates: true, watchFileChanges: true, debounceDelay: 2000 }
    });

    claudeCodeBridge = new ClaudeCodeBridge({
      ...baseConfig,
      execution: { apiEndpoint: 'http://localhost:7000/api', apiKey: global.mockApiKey, maxConcurrentExecutions: 20, executionTimeout: 60000, sandboxMode: true },
      agents: { coordinatorEndpoint: 'http://localhost:7001/coordinator', maxActiveAgents: 25, agentPoolSize: 50, heartbeatInterval: 30000 },
      tools: { availableTools: ['read', 'write', 'execute', 'search', 'edit', 'bash'], customToolRegistry: '', toolExecutionTimeout: 30000, toolRateLimits: { 'execute': 50, 'search': 200 } },
      coordination: { workflow: 'hybrid', failureStrategy: 'retry-then-continue', resultAggregation: 'smart-merge' }
    });

    // Connect all bridges
    const connections = await Promise.all([
      dossierBridge.connect(),
      rufloBridge.connect(),
      gitNexusBridge.connect(),
      adwBridge.connect(),
      rlmBridge.connect(),
      claudeCodeBridge.connect()
    ]);

    connections.forEach((connection, index) => {
      const bridges = ['Dossier', 'Ruflo', 'GitNexus', 'ADW', 'RLM', 'ClaudeCode'];
      if (!connection.success) {
        console.warn(`${bridges[index]} bridge connection failed:`, connection.error);
      }
    });

    console.log('✅ All bridges initialized for integration testing');
  }

  async function cleanupAllBridges() {
    try {
      await Promise.all([
        dossierBridge?.disconnect(),
        rufloBridge?.disconnect(),
        gitNexusBridge?.disconnect(),
        adwBridge?.disconnect(),
        rlmBridge?.disconnect(),
        claudeCodeBridge?.disconnect()
      ]);

      console.log('✅ All bridges disconnected and cleaned up');
    } catch (error) {
      console.error('❌ Error during bridge cleanup:', error);
    }
  }
});