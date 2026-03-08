/**
 * Integration Tests for All Bridge Implementations
 * Tests the complete bridge integration system
 */

import { DossierBridge, DossierConfig } from '../bridges/DossierBridge.js';
import { RufloBridge, RufloConfig } from '../bridges/RufloBridge.js';
import { GitNexusBridge, GitNexusConfig } from '../bridges/GitNexusBridge.js';
import { ADWSkillsBridge, ADWConfig } from '../bridges/ADWSkillsBridge.js';
import { RLMNavigatorBridge, RLMNavigatorConfig } from '../bridges/RLMNavigatorBridge.js';
import { ClaudeCodeBridge, ClaudeCodeConfig } from '../bridges/ClaudeCodeBridge.js';

describe('Bridge Integration Tests', () => {
  let dossierBridge: DossierBridge;
  let rufloBridge: RufloBridge;
  let gitNexusBridge: GitNexusBridge;
  let adwSkillsBridge: ADWSkillsBridge;
  let rlmNavigatorBridge: RLMNavigatorBridge;
  let claudeCodeBridge: ClaudeCodeBridge;

  beforeAll(async () => {
    // Initialize all bridges with test configurations
    await initializeTestBridges();
  });

  afterAll(async () => {
    // Cleanup all bridges
    await cleanupTestBridges();
  });

  describe('DossierBridge', () => {
    test('should connect and handle UI interactions', async () => {
      const result = await dossierBridge.isConnected();
      expect(result).toBeTruthy();

      // Test task creation
      const task = await dossierBridge.createTask({
        type: 'investigation',
        title: 'Test Investigation',
        description: 'Testing Dossier integration',
        priority: 'medium',
        status: 'pending',
        metadata: { test: true }
      });

      expect(task.success).toBeTruthy();
      expect(task.data?.title).toBe('Test Investigation');
    });

    test('should update UI state correctly', async () => {
      const result = await dossierBridge.updateUIState('test-component', {
        status: 'active',
        progress: 50
      });

      expect(result.success).toBeTruthy();

      const state = await dossierBridge.getUIState('test-component');
      expect(state.success).toBeTruthy();
      expect(state.data?.state.progress).toBe(50);
    });
  });

  describe('RufloBridge', () => {
    test('should initialize swarm and spawn agents', async () => {
      const swarmConfig = {
        id: 'test-swarm',
        name: 'Test Swarm',
        description: 'Integration test swarm',
        topology: 'hierarchical' as const,
        maxAgents: 5,
        strategy: 'specialized',
        agentTypes: ['coder', 'reviewer'],
        coordination: {
          consensus: 'raft',
          leaderElection: true,
          faultTolerance: true
        },
        memory: {
          shared: true,
          namespace: 'test',
          persistenceLevel: 'session' as const
        }
      };

      const swarmResult = await rufloBridge.initializeSwarm(swarmConfig);
      expect(swarmResult.success).toBeTruthy();
      expect(swarmResult.data?.id).toBe('test-swarm');

      // Test agent spawning
      const agentResult = await rufloBridge.spawnAgent('coder', 'test-coder', { test: true });
      expect(agentResult.success).toBeTruthy();
      expect(agentResult.data?.type).toBe('coder');
    });

    test('should create and execute tasks', async () => {
      const task = await rufloBridge.createTask({
        type: 'code-generation',
        description: 'Generate test code',
        priority: 1,
        estimatedComplexity: 5,
        dependencies: [],
        input: { language: 'typescript', requirements: 'Create a test function' }
      });

      expect(task.success).toBeTruthy();
      expect(task.data?.type).toBe('code-generation');
    });

    test('should handle memory operations', async () => {
      const storeResult = await rufloBridge.storeMemory('test', 'key1', { data: 'test value' });
      expect(storeResult.success).toBeTruthy();

      const retrieveResult = await rufloBridge.retrieveMemory('test', 'key1');
      expect(retrieveResult.success).toBeTruthy();
      expect(retrieveResult.data?.data).toBe('test value');
    });
  });

  describe('GitNexusBridge', () => {
    test('should add and index repository', async () => {
      const repo = {
        id: 'test-repo',
        name: 'Test Repository',
        path: '/tmp/test-repo',
        remote: 'https://github.com/test/test-repo.git',
        branch: 'main'
      };

      const addResult = await gitNexusBridge.addRepository(repo);
      expect(addResult.success).toBeTruthy();
      expect(addResult.data?.name).toBe('Test Repository');

      // Note: Indexing would require actual repository structure
      // This would be mocked in a real test environment
    });

    test('should execute graph queries', async () => {
      const query = {
        query: 'MATCH (s:Symbol) RETURN s LIMIT 5',
        parameters: {},
        timeout: 5000
      };

      const result = await gitNexusBridge.executeQuery(query);
      expect(result.success).toBeTruthy();
      expect(result.data?.columns).toBeDefined();
    });

    test('should find symbols by name', async () => {
      const result = await gitNexusBridge.findSymbol('test', 'function', 'test-repo');
      expect(result.success).toBeTruthy();
      expect(Array.isArray(result.data)).toBeTruthy();
    });
  });

  describe('ADWSkillsBridge', () => {
    test('should create investigation and add hypotheses', async () => {
      const investigation = await adwSkillsBridge.createInvestigation({
        title: 'Test Investigation',
        description: 'Testing ADW skills integration',
        status: 'planning',
        methodology: 'pure-adw',
        investigator: 'test-user',
        objectives: ['Test objective 1', 'Test objective 2'],
        hypotheses: [],
        priority: 'medium',
        tags: ['test']
      });

      expect(investigation.success).toBeTruthy();
      expect(investigation.data?.title).toBe('Test Investigation');

      // Add hypothesis
      const hypothesis = await adwSkillsBridge.addHypothesis(investigation.data!.id, {
        statement: 'The system performs optimally under normal load',
        type: 'primary',
        confidence: 0.5,
        status: 'proposed',
        supportingEvidence: [],
        contradictingEvidence: [],
        createdBy: 'test-user'
      });

      expect(hypothesis.success).toBeTruthy();
      expect(hypothesis.data?.statement).toContain('system performs');
    });

    test('should execute ADW skills', async () => {
      const skillResult = await adwSkillsBridge.executeSkill('observe_system_behavior', {
        duration: 5,
        metrics: ['performance', 'errors']
      });

      expect(skillResult.success).toBeTruthy();
      expect(skillResult.data?.data?.observations).toBeDefined();
    });

    test('should collect and analyze evidence', async () => {
      const investigation = await adwSkillsBridge.createInvestigation({
        title: 'Evidence Test',
        description: 'Testing evidence collection',
        status: 'active',
        methodology: 'pure-adw',
        investigator: 'test-user',
        objectives: ['Collect evidence'],
        hypotheses: [],
        priority: 'medium',
        tags: ['evidence-test']
      });

      const evidence = await adwSkillsBridge.collectEvidence(investigation.data!.id, {
        type: 'observation',
        source: 'test-source',
        data: { metric: 'response_time', value: 150, unit: 'ms' },
        confidence: 0.8,
        tags: ['performance']
      });

      expect(evidence.success).toBeTruthy();
      expect(evidence.data?.type).toBe('observation');
    });
  });

  describe('RLMNavigatorBridge', () => {
    test('should create navigation session and parse AST', async () => {
      // This would require an actual file for real testing
      const mockFilePath = '/tmp/test.js';

      const session = await rlmNavigatorBridge.createNavigationSession(mockFilePath);
      expect(session.success).toBeTruthy();
      expect(session.data?.file).toBe(mockFilePath);

      // Test AST navigation
      const rootNode = session.data!.ast;
      expect(rootNode.type).toBe('program');
    });

    test('should search nodes and add bookmarks', async () => {
      const session = await rlmNavigatorBridge.createNavigationSession('/tmp/test.js');
      const sessionId = session.data!.id;

      const searchResult = await rlmNavigatorBridge.searchNodes(sessionId, 'main');
      expect(searchResult.success).toBeTruthy();

      const bookmark = await rlmNavigatorBridge.addBookmark(sessionId, {
        name: 'Test Bookmark',
        nodeId: 'test-node',
        position: { line: 5, column: 1 },
        context: 'function main',
        tags: ['function']
      });

      expect(bookmark.success).toBeTruthy();
      expect(bookmark.data?.name).toBe('Test Bookmark');
    });

    test('should perform semantic queries', async () => {
      const session = await rlmNavigatorBridge.createNavigationSession('/tmp/test.js');
      const sessionId = session.data!.id;

      const semanticResult = await rlmNavigatorBridge.performSemanticQuery(sessionId, {
        type: 'find_usages',
        target: 'main',
        scope: 'file'
      });

      expect(semanticResult.success).toBeTruthy();
      expect(semanticResult.data?.results).toBeDefined();
    });
  });

  describe('ClaudeCodeBridge', () => {
    test('should execute code and track metrics', async () => {
      const execution = await claudeCodeBridge.executeCode({
        type: 'snippet',
        language: 'javascript',
        code: 'console.log("Hello, World!");',
        context: {
          id: 'test-context',
          type: 'code_execution',
          initiator: 'test',
          environment: 'sandbox',
          permissions: {
            fileSystem: { read: [], write: [], execute: [] },
            network: { allowedDomains: [], allowedPorts: [], restrictLocal: true },
            system: { allowProcessSpawn: false, maxMemoryMB: 256, maxCPUPercent: 50, allowedCommands: [] }
          },
          resources: {
            maxMemoryMB: 256,
            maxCPUTime: 5000,
            maxWallTime: 10000,
            maxOutputSize: 1024,
            tempDirectoryQuota: 1048576
          },
          constraints: {
            timeout: 10000,
            maxRetries: 3,
            requireApproval: false,
            auditLevel: 'basic'
          },
          metadata: {},
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 3600000)
        }
      });

      expect(execution.success).toBeTruthy();
      expect(execution.data?.language).toBe('javascript');
    });

    test('should spawn agents and assign tasks', async () => {
      const agent = await claudeCodeBridge.spawnAgent('coder', 'Test Coder', {
        specialization: 'typescript'
      });

      expect(agent.success).toBeTruthy();
      expect(agent.data?.type).toBe('coder');

      const taskId = await claudeCodeBridge.assignTask(agent.data!.id, {
        type: 'code-generation',
        requirements: 'Create a TypeScript interface'
      });

      expect(taskId.success).toBeTruthy();
    });

    test('should coordinate multiple tasks', async () => {
      const coordination = await claudeCodeBridge.coordinateTasks({
        name: 'Test Coordination',
        description: 'Test parallel task execution',
        type: 'parallel',
        tasks: [
          {
            id: 'task-1',
            name: 'Task 1',
            type: 'execution',
            input: { code: 'console.log("Task 1");', language: 'javascript' },
            status: 'pending',
            retryCount: 0,
            maxRetries: 3,
            timeout: 5000,
            dependencies: []
          },
          {
            id: 'task-2',
            name: 'Task 2',
            type: 'execution',
            input: { code: 'console.log("Task 2");', language: 'javascript' },
            status: 'pending',
            retryCount: 0,
            maxRetries: 3,
            timeout: 5000,
            dependencies: []
          }
        ],
        dependencies: [],
        coordinator: 'claude-code-bridge',
        metadata: { test: true }
      });

      expect(coordination.success).toBeTruthy();
      expect(coordination.data?.tasks.length).toBe(2);
    });
  });

  describe('Cross-Bridge Integration', () => {
    test('should coordinate workflow across all bridges', async () => {
      // This test demonstrates how bridges work together

      // 1. Create investigation in ADW Skills
      const investigation = await adwSkillsBridge.createInvestigation({
        title: 'Cross-Bridge Integration Test',
        description: 'Test coordinated workflow',
        status: 'planning',
        methodology: 'pure-adw',
        investigator: 'integration-test',
        objectives: ['Test cross-bridge coordination'],
        hypotheses: [],
        priority: 'high',
        tags: ['integration', 'workflow']
      });

      expect(investigation.success).toBeTruthy();

      // 2. Create task in Dossier for visualization
      const dossierTask = await dossierBridge.createTask({
        type: 'workflow',
        title: 'Integration Workflow',
        description: 'Cross-bridge integration workflow',
        priority: 'high',
        status: 'running',
        metadata: {
          investigationId: investigation.data!.id,
          bridges: ['adw-skills', 'dossier', 'ruflo', 'claude-code']
        }
      });

      expect(dossierTask.success).toBeTruthy();

      // 3. Spawn agents via ruflo for task execution
      const agent = await rufloBridge.spawnAgent('coder', 'integration-coder', {
        task: 'integration-test'
      });

      expect(agent.success).toBeTruthy();

      // 4. Execute code via Claude Code bridge
      const codeExecution = await claudeCodeBridge.executeCode({
        type: 'script',
        language: 'javascript',
        code: `
          // Integration test code
          const result = {
            bridges: ['dossier', 'ruflo', 'gitnexus', 'adw-skills', 'rlm-navigator', 'claude-code'],
            status: 'integration-complete',
            timestamp: new Date().toISOString()
          };
          console.log(JSON.stringify(result, null, 2));
        `,
        context: {
          id: 'integration-context',
          type: 'workflow',
          initiator: 'integration-test',
          environment: 'sandbox',
          permissions: {
            fileSystem: { read: [], write: [], execute: [] },
            network: { allowedDomains: [], allowedPorts: [], restrictLocal: true },
            system: { allowProcessSpawn: false, maxMemoryMB: 256, maxCPUPercent: 50, allowedCommands: [] }
          },
          resources: {
            maxMemoryMB: 256,
            maxCPUTime: 10000,
            maxWallTime: 20000,
            maxOutputSize: 2048,
            tempDirectoryQuota: 1048576
          },
          constraints: {
            timeout: 20000,
            maxRetries: 3,
            requireApproval: false,
            auditLevel: 'detailed'
          },
          metadata: {
            investigationId: investigation.data!.id,
            taskId: dossierTask.data!.id
          },
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 3600000)
        }
      });

      expect(codeExecution.success).toBeTruthy();

      // 5. Collect evidence from execution
      const evidence = await adwSkillsBridge.collectEvidence(investigation.data!.id, {
        type: 'test',
        source: 'integration-test',
        data: {
          executionId: codeExecution.data!.id,
          bridges_tested: 6,
          success: true
        },
        confidence: 0.95,
        tags: ['integration', 'automated-test']
      });

      expect(evidence.success).toBeTruthy();

      // 6. Update Dossier task status
      const taskUpdate = await dossierBridge.updateTask(dossierTask.data!.id, {
        status: 'completed',
        metadata: {
          ...dossierTask.data!.metadata,
          executionId: codeExecution.data!.id,
          evidenceId: evidence.data!.id,
          completedAt: new Date()
        }
      });

      expect(taskUpdate.success).toBeTruthy();

      console.log('✅ Cross-bridge integration test completed successfully');
      console.log(`📊 Investigation: ${investigation.data!.id}`);
      console.log(`📋 Task: ${dossierTask.data!.id}`);
      console.log(`🤖 Agent: ${agent.data!.id}`);
      console.log(`⚡ Execution: ${codeExecution.data!.id}`);
      console.log(`🔍 Evidence: ${evidence.data!.id}`);
    });
  });

  // Helper functions
  async function initializeTestBridges() {
    const dossierConfig: DossierConfig = {
      name: 'test-dossier',
      version: '1.0.0',
      enabled: true,
      timeout: 10000,
      retryAttempts: 3,
      circuitBreakerThreshold: 5,
      healthCheckInterval: 30000,
      dossierApi: {
        baseUrl: 'http://localhost:3000/api',
        apiKey: 'test-api-key',
        version: 'v1'
      },
      ui: {
        webSocketUrl: 'ws://localhost:3000/ws',
        theme: 'dark',
        refreshInterval: 5000
      },
      orchestration: {
        maxConcurrentTasks: 10,
        taskTimeout: 30000,
        priorityLevels: ['low', 'medium', 'high', 'critical']
      }
    };

    const rufloConfig: RufloConfig = {
      name: 'test-ruflo',
      version: '1.0.0',
      enabled: true,
      timeout: 10000,
      retryAttempts: 3,
      circuitBreakerThreshold: 5,
      healthCheckInterval: 30000,
      rufloApi: {
        baseUrl: 'http://localhost:8080',
        apiKey: 'test-ruflo-key',
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
    };

    const gitNexusConfig: GitNexusConfig = {
      name: 'test-gitnexus',
      version: '1.0.0',
      enabled: true,
      timeout: 10000,
      retryAttempts: 3,
      circuitBreakerThreshold: 5,
      healthCheckInterval: 30000,
      database: {
        kuzuPath: '/tmp/test-kuzu.db',
        connectionPool: 5,
        queryTimeout: 30000,
        maxMemory: '1GB'
      },
      indexing: {
        autoIndexing: true,
        indexInterval: 300000,
        parallelWorkers: 4,
        supportedLanguages: ['javascript', 'typescript', 'python']
      },
      analysis: {
        maxDepth: 10,
        includeTests: false,
        includeComments: false,
        callGraphEnabled: true
      },
      git: {
        repositories: [],
        autoSync: false,
        syncInterval: 600000
      }
    };

    const adwConfig: ADWConfig = {
      name: 'test-adw',
      version: '1.0.0',
      enabled: true,
      timeout: 10000,
      retryAttempts: 3,
      circuitBreakerThreshold: 5,
      healthCheckInterval: 30000,
      methodology: {
        version: '2.0',
        strictMode: false,
        evidenceThreshold: 0.7,
        hypothesisLifetime: 86400000
      },
      investigation: {
        maxParallelInvestigations: 5,
        defaultTimeout: 30000,
        evidenceStorage: 'hybrid'
      },
      skills: {
        enabledSkills: ['observe_system_behavior', 'code_quality_investigation'],
        skillRegistry: 'built-in',
        autoDiscovery: true
      },
      workflow: {
        templates: [],
        customSteps: true,
        approvalRequired: false
      }
    };

    const rlmConfig: RLMNavigatorConfig = {
      name: 'test-rlm',
      version: '1.0.0',
      enabled: true,
      timeout: 10000,
      retryAttempts: 3,
      circuitBreakerThreshold: 5,
      healthCheckInterval: 30000,
      navigator: {
        mcpEndpoint: 'http://localhost:9000/mcp',
        protocol: 'http',
        maxConcurrentNavigations: 5,
        cacheEnabled: true,
        cacheTTL: 300000
      },
      ast: {
        supportedLanguages: ['javascript', 'typescript', 'python'],
        parseTimeout: 30000,
        maxFileSize: 1048576,
        includeComments: false,
        includeWhitespace: false
      },
      analysis: {
        semanticAnalysis: true,
        typeInference: true,
        controlFlowAnalysis: true,
        dataFlowAnalysis: true
      },
      indexing: {
        incrementalUpdates: true,
        watchFileChanges: false,
        debounceDelay: 1000
      }
    };

    const claudeCodeConfig: ClaudeCodeConfig = {
      name: 'test-claude-code',
      version: '1.0.0',
      enabled: true,
      timeout: 10000,
      retryAttempts: 3,
      circuitBreakerThreshold: 5,
      healthCheckInterval: 30000,
      execution: {
        apiEndpoint: 'http://localhost:7000/api',
        apiKey: 'test-claude-key',
        maxConcurrentExecutions: 5,
        executionTimeout: 30000,
        sandboxMode: true
      },
      agents: {
        coordinatorEndpoint: 'http://localhost:7001/coordinator',
        maxActiveAgents: 10,
        agentPoolSize: 20,
        heartbeatInterval: 30000
      },
      tools: {
        availableTools: ['read', 'write', 'execute', 'search'],
        customToolRegistry: '',
        toolExecutionTimeout: 15000,
        toolRateLimits: { 'execute': 10, 'search': 50 }
      },
      coordination: {
        workflow: 'hybrid',
        failureStrategy: 'continue',
        resultAggregation: 'merge'
      }
    };

    // Initialize bridges (mocked connections for testing)
    dossierBridge = new DossierBridge(dossierConfig);
    rufloBridge = new RufloBridge(rufloConfig);
    gitNexusBridge = new GitNexusBridge(gitNexusConfig);
    adwSkillsBridge = new ADWSkillsBridge(adwConfig);
    rlmNavigatorBridge = new RLMNavigatorBridge(rlmConfig);
    claudeCodeBridge = new ClaudeCodeBridge(claudeCodeConfig);

    // Note: In real tests, you would mock the external connections
    console.log('Test bridges initialized');
  }

  async function cleanupTestBridges() {
    try {
      await dossierBridge?.disconnect();
      await rufloBridge?.disconnect();
      await gitNexusBridge?.disconnect();
      await adwSkillsBridge?.disconnect();
      await rlmNavigatorBridge?.disconnect();
      await claudeCodeBridge?.disconnect();

      console.log('Test bridges cleaned up');
    } catch (error) {
      console.error('Error during bridge cleanup:', error);
    }
  }
});