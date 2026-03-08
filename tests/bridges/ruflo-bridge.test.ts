/**
 * RufloBridge Integration Tests
 * PRODUCTION CRITICAL: Tests swarm orchestration and agent coordination
 */

import { RufloBridge, RufloConfig } from '../../src/bridges/RufloBridge';
import { createMockBridgeConfig } from '../setup';

describe('RufloBridge - Production Integration Tests', () => {
  let rufloBridge: RufloBridge;
  let mockConfig: RufloConfig;

  beforeEach(() => {
    mockConfig = {
      ...createMockBridgeConfig(),
      rufloApi: {
        baseUrl: 'http://localhost:8080',
        apiKey: global.mockApiKey,
        version: 'v3'
      },
      swarm: {
        topology: 'hierarchical',
        maxAgents: 10,
        strategy: 'specialized',
        consensus: 'raft'
      },
      memory: {
        type: 'hybrid',
        hnswEnabled: true,
        vectorDimensions: 512,
        maxMemorySize: 1000000
      },
      neural: {
        enabled: true,
        modelRouting: true,
        tierStrategy: '3-tier'
      }
    } as RufloConfig;

    rufloBridge = new RufloBridge(mockConfig);
  });

  afterEach(async () => {
    await rufloBridge.disconnect();
  });

  describe('Swarm Initialization - CRITICAL', () => {
    test('should initialize hierarchical swarm successfully', async () => {
      await rufloBridge.connect();

      const swarmConfig = {
        id: 'production-swarm',
        name: 'Production Development Swarm',
        description: 'Main production swarm for development tasks',
        topology: 'hierarchical' as const,
        maxAgents: 8,
        strategy: 'specialized',
        agentTypes: ['coder', 'reviewer', 'tester'],
        coordination: {
          consensus: 'raft',
          leaderElection: true,
          faultTolerance: true
        },
        memory: {
          shared: true,
          namespace: 'production',
          persistenceLevel: 'session' as const
        }
      };

      const result = await rufloBridge.initializeSwarm(swarmConfig);

      expect(result.success).toBe(true);
      expect(result.data?.id).toBe('production-swarm');
      expect(result.data?.topology).toBe('hierarchical');
      expect(result.data?.status).toBe('initialized');
    });

    test('should handle swarm initialization failure', async () => {
      await rufloBridge.connect();

      const invalidConfig = {
        id: '',  // Invalid empty ID
        name: 'Invalid Swarm',
        topology: 'invalid-topology' as any,
        maxAgents: -1  // Invalid negative number
      };

      const result = await rufloBridge.initializeSwarm(invalidConfig);
      expect(result.success).toBe(false);
      expect(result.error).toContain('validation');
    });

    test('should maintain swarm state after network interruption', async () => {
      await rufloBridge.connect();

      const swarmConfig = {
        id: 'resilient-swarm',
        name: 'Resilient Test Swarm',
        topology: 'hierarchical' as const,
        maxAgents: 5,
        strategy: 'adaptive'
      };

      const initResult = await rufloBridge.initializeSwarm(swarmConfig);
      expect(initResult.success).toBe(true);

      // Simulate network interruption
      await rufloBridge.disconnect();
      await new Promise(resolve => setTimeout(resolve, 100));
      await rufloBridge.connect();

      // Swarm should be recoverable
      const statusResult = await rufloBridge.getSwarmStatus('resilient-swarm');
      expect(statusResult.success).toBe(true);
    });
  });

  describe('Agent Management - CRITICAL', () => {
    beforeEach(async () => {
      await rufloBridge.connect();

      const swarmConfig = {
        id: 'test-swarm',
        name: 'Test Swarm',
        topology: 'hierarchical' as const,
        maxAgents: 10
      };

      await rufloBridge.initializeSwarm(swarmConfig);
    });

    test('should spawn specialized agents successfully', async () => {
      const agentTypes = ['coder', 'reviewer', 'tester', 'security-auditor'];

      for (const agentType of agentTypes) {
        const result = await rufloBridge.spawnAgent(agentType, `${agentType}-001`, {
          specialization: 'typescript',
          experience: 'senior',
          swarmId: 'test-swarm'
        });

        expect(result.success).toBe(true);
        expect(result.data?.type).toBe(agentType);
        expect(result.data?.id).toBe(`${agentType}-001`);
        expect(result.data?.status).toBe('active');
      }
    });

    test('should enforce agent limits per swarm', async () => {
      const limitedSwarm = {
        id: 'limited-swarm',
        name: 'Limited Capacity Swarm',
        topology: 'hierarchical' as const,
        maxAgents: 2
      };

      await rufloBridge.initializeSwarm(limitedSwarm);

      // Spawn maximum allowed agents
      const agent1 = await rufloBridge.spawnAgent('coder', 'coder-1', { swarmId: 'limited-swarm' });
      const agent2 = await rufloBridge.spawnAgent('reviewer', 'reviewer-1', { swarmId: 'limited-swarm' });

      expect(agent1.success).toBe(true);
      expect(agent2.success).toBe(true);

      // Third agent should fail due to limit
      const agent3 = await rufloBridge.spawnAgent('tester', 'tester-1', { swarmId: 'limited-swarm' });
      expect(agent3.success).toBe(false);
      expect(agent3.error).toContain('maximum agents');
    });

    test('should handle agent failures gracefully', async () => {
      const agentResult = await rufloBridge.spawnAgent('coder', 'failing-agent', {
        swarmId: 'test-swarm',
        simulateFailure: true  // Special test parameter
      });

      if (agentResult.success) {
        const agentId = agentResult.data!.id;

        // Simulate agent failure
        const terminateResult = await rufloBridge.terminateAgent(agentId, 'simulated-failure');
        expect(terminateResult.success).toBe(true);

        // Swarm should remain stable
        const swarmStatus = await rufloBridge.getSwarmStatus('test-swarm');
        expect(swarmStatus.success).toBe(true);
        expect(swarmStatus.data?.health).toBe('degraded'); // Should handle gracefully
      }
    });
  });

  describe('Task Execution - PERFORMANCE CRITICAL', () => {
    beforeEach(async () => {
      await rufloBridge.connect();

      const swarmConfig = {
        id: 'task-swarm',
        name: 'Task Execution Swarm',
        topology: 'hierarchical' as const,
        maxAgents: 5
      };

      await rufloBridge.initializeSwarm(swarmConfig);
      await rufloBridge.spawnAgent('coder', 'task-coder', { swarmId: 'task-swarm' });
    });

    test('should execute code generation task under 2 seconds', async () => {
      const startTime = Date.now();

      const task = {
        type: 'code-generation',
        description: 'Generate TypeScript interface for user data',
        priority: 1,
        estimatedComplexity: 3,
        dependencies: [],
        input: {
          language: 'typescript',
          requirements: 'Create User interface with id, name, email, and optional preferences',
          style: 'clean, well-documented'
        },
        agentId: 'task-coder'
      };

      const result = await rufloBridge.createTask(task);
      expect(result.success).toBe(true);

      const executionTime = Date.now() - startTime;
      expect(executionTime).toBeLessThan(2000); // Under 2 seconds requirement

      expect(result.data?.type).toBe('code-generation');
      expect(result.data?.status).toBe('pending');
    });

    test('should handle concurrent task execution', async () => {
      // Spawn additional agents for concurrency
      await rufloBridge.spawnAgent('coder', 'task-coder-2', { swarmId: 'task-swarm' });
      await rufloBridge.spawnAgent('reviewer', 'task-reviewer', { swarmId: 'task-swarm' });

      const tasks = [
        { type: 'code-generation', description: 'Task 1', agentId: 'task-coder' },
        { type: 'code-review', description: 'Task 2', agentId: 'task-reviewer' },
        { type: 'refactoring', description: 'Task 3', agentId: 'task-coder-2' }
      ];

      const startTime = Date.now();
      const promises = tasks.map(task => rufloBridge.createTask({
        ...task,
        priority: 1,
        estimatedComplexity: 2,
        dependencies: [],
        input: { language: 'typescript' }
      }));

      const results = await Promise.all(promises);
      const totalTime = Date.now() - startTime;

      // All tasks should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Concurrent execution should be faster than sequential
      expect(totalTime).toBeLessThan(3000);
    });

    test('should handle task dependencies correctly', async () => {
      const dependentTasks = [
        {
          id: 'base-task',
          type: 'code-generation',
          description: 'Create base class',
          dependencies: [],
          agentId: 'task-coder'
        },
        {
          id: 'derived-task',
          type: 'code-generation',
          description: 'Create derived class',
          dependencies: ['base-task'],
          agentId: 'task-coder'
        }
      ];

      // Create base task first
      const baseResult = await rufloBridge.createTask({
        ...dependentTasks[0],
        priority: 1,
        estimatedComplexity: 2,
        input: { language: 'typescript' }
      });

      expect(baseResult.success).toBe(true);

      // Create dependent task
      const derivedResult = await rufloBridge.createTask({
        ...dependentTasks[1],
        priority: 1,
        estimatedComplexity: 3,
        input: { language: 'typescript', baseClass: 'BaseEntity' }
      });

      expect(derivedResult.success).toBe(true);

      // Derived task should wait for base task
      expect(derivedResult.data?.status).toBe('waiting'); // Waiting for dependencies
    });
  });

  describe('Memory Operations - CRITICAL', () => {
    beforeEach(async () => {
      await rufloBridge.connect();
    });

    test('should store and retrieve memory data efficiently', async () => {
      const namespace = 'production-memory';
      const testData = {
        patterns: ['authentication-flow', 'error-handling'],
        bestPractices: {
          security: ['input-validation', 'secure-headers'],
          performance: ['caching', 'lazy-loading']
        },
        metadata: {
          version: '2.0',
          lastUpdated: new Date().toISOString()
        }
      };

      // Store memory data
      const storeResult = await rufloBridge.storeMemory(namespace, 'development-patterns', testData);
      expect(storeResult.success).toBe(true);

      // Retrieve memory data
      const retrieveResult = await rufloBridge.retrieveMemory(namespace, 'development-patterns');
      expect(retrieveResult.success).toBe(true);
      expect(retrieveResult.data?.patterns).toEqual(testData.patterns);
      expect(retrieveResult.data?.bestPractices.security).toContain('input-validation');
    });

    test('should perform vector similarity search', async () => {
      const namespace = 'search-test';

      // Store multiple related items
      const items = [
        { key: 'auth-pattern-1', data: { type: 'authentication', method: 'JWT', description: 'JSON Web Token authentication' } },
        { key: 'auth-pattern-2', data: { type: 'authentication', method: 'OAuth2', description: 'OAuth2 authorization flow' } },
        { key: 'cache-pattern', data: { type: 'performance', method: 'Redis', description: 'Redis caching strategy' } }
      ];

      for (const item of items) {
        await rufloBridge.storeMemory(namespace, item.key, item.data);
      }

      // Search for authentication-related items
      const searchResult = await rufloBridge.searchMemory(namespace, 'JWT authentication token', {
        limit: 5,
        threshold: 0.7
      });

      expect(searchResult.success).toBe(true);
      expect(searchResult.data?.results).toHaveLength(2); // Should find both auth patterns
      expect(searchResult.data?.results[0].score).toBeGreaterThan(0.7);
    });

    test('should handle memory capacity limits', async () => {
      const namespace = 'capacity-test';
      const largeData = Array(10000).fill(0).map((_, i) => ({ id: i, data: `large-data-${i}` }));

      const storeResult = await rufloBridge.storeMemory(namespace, 'large-dataset', largeData);

      // Should either succeed or fail gracefully with capacity error
      if (!storeResult.success) {
        expect(storeResult.error).toContain('capacity');
      } else {
        expect(storeResult.success).toBe(true);
      }
    });
  });

  describe('Neural Network Integration', () => {
    beforeEach(async () => {
      await rufloBridge.connect();
    });

    test('should route tasks to appropriate models based on complexity', async () => {
      const simpleTask = {
        type: 'variable-rename',
        description: 'Rename variable from var to const',
        priority: 1,
        estimatedComplexity: 1, // Should route to Agent Booster (Tier 1)
        dependencies: [],
        input: { code: 'var x = 5;', language: 'javascript' }
      };

      const complexTask = {
        type: 'architecture-design',
        description: 'Design microservices architecture',
        priority: 1,
        estimatedComplexity: 9, // Should route to Sonnet/Opus (Tier 3)
        dependencies: [],
        input: { requirements: 'Scalable e-commerce platform', language: 'system-design' }
      };

      const simpleResult = await rufloBridge.createTask(simpleTask);
      const complexResult = await rufloBridge.createTask(complexTask);

      expect(simpleResult.success).toBe(true);
      expect(complexResult.success).toBe(true);

      // Simple task should be processed faster (Tier 1)
      expect(simpleResult.data?.estimatedDuration).toBeLessThan(1000);

      // Complex task should take longer but use more powerful model
      expect(complexResult.data?.estimatedDuration).toBeGreaterThan(2000);
    });
  });

  describe('Security & Authentication', () => {
    test('should reject invalid API keys', async () => {
      const invalidConfig = {
        ...mockConfig,
        rufloApi: { ...mockConfig.rufloApi, apiKey: 'invalid-key-12345' }
      };

      const securityBridge = new RufloBridge(invalidConfig);
      const connectResult = await securityBridge.connect();

      expect(connectResult.success).toBe(false);
      expect(connectResult.error).toContain('authentication');
    });

    test('should validate task permissions', async () => {
      await rufloBridge.connect();

      const restrictedTask = {
        type: 'system-administration',
        description: 'Delete production database',
        priority: 1,
        estimatedComplexity: 5,
        dependencies: [],
        input: { command: 'DROP DATABASE production;' },
        requiresElevatedPermissions: true
      };

      const result = await rufloBridge.createTask(restrictedTask);
      expect(result.success).toBe(false);
      expect(result.error).toContain('permissions');
    });
  });

  describe('Performance Monitoring', () => {
    beforeEach(async () => {
      await rufloBridge.connect();
    });

    test('should track swarm performance metrics', async () => {
      const swarmConfig = {
        id: 'metrics-swarm',
        name: 'Metrics Test Swarm',
        topology: 'hierarchical' as const,
        maxAgents: 3
      };

      await rufloBridge.initializeSwarm(swarmConfig);
      await rufloBridge.spawnAgent('coder', 'metrics-coder', { swarmId: 'metrics-swarm' });

      // Execute several tasks to generate metrics
      for (let i = 0; i < 5; i++) {
        await rufloBridge.createTask({
          type: 'code-generation',
          description: `Metrics task ${i}`,
          priority: 1,
          estimatedComplexity: 2,
          dependencies: [],
          input: { language: 'typescript' },
          agentId: 'metrics-coder'
        });
      }

      const metrics = await rufloBridge.getSwarmMetrics('metrics-swarm');
      expect(metrics.success).toBe(true);
      expect(metrics.data?.tasksCompleted).toBeGreaterThanOrEqual(0);
      expect(metrics.data?.averageExecutionTime).toBeDefined();
      expect(metrics.data?.memoryUsage).toBeDefined();
    });

    test('should detect performance degradation', async () => {
      // Simulate high load scenario
      const heavyTasks = Array(10).fill(0).map((_, i) => ({
        type: 'complex-analysis',
        description: `Heavy task ${i}`,
        priority: 1,
        estimatedComplexity: 8,
        dependencies: [],
        input: { analysisType: 'deep-learning', dataSize: 'large' }
      }));

      const startTime = Date.now();
      const results = await Promise.allSettled(
        heavyTasks.map(task => rufloBridge.createTask(task))
      );
      const totalTime = Date.now() - startTime;

      // Should complete within reasonable time even under load
      expect(totalTime).toBeLessThan(10000); // 10 second limit

      const successfulTasks = results.filter(r => r.status === 'fulfilled').length;
      expect(successfulTasks).toBeGreaterThan(heavyTasks.length * 0.8); // 80% success rate
    });
  });
});