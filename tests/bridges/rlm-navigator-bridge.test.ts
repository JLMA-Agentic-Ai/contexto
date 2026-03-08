/**
 * RLMNavigatorBridge Integration Tests
 * PRODUCTION CRITICAL: Tests AST navigation and code parsing
 */

import { RLMNavigatorBridge, RLMNavigatorConfig } from '../../src/bridges/RLMNavigatorBridge';
import { createMockBridgeConfig } from '../setup';

describe('RLMNavigatorBridge - Production Integration Tests', () => {
  let rlmBridge: RLMNavigatorBridge;
  let mockConfig: RLMNavigatorConfig;

  beforeEach(() => {
    mockConfig = {
      ...createMockBridgeConfig(),
      navigator: {
        mcpEndpoint: 'http://localhost:9000/mcp',
        protocol: 'http',
        maxConcurrentNavigations: 10,
        cacheEnabled: true,
        cacheTTL: 300000
      },
      ast: {
        supportedLanguages: ['javascript', 'typescript', 'python', 'java', 'go', 'rust'],
        parseTimeout: 30000,
        maxFileSize: 5 * 1024 * 1024, // 5MB
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
        watchFileChanges: true,
        debounceDelay: 1000
      }
    } as RLMNavigatorConfig;

    rlmBridge = new RLMNavigatorBridge(mockConfig);
  });

  afterEach(async () => {
    await rlmBridge.disconnect();
  });

  describe('Navigation Session Management - CRITICAL', () => {
    beforeEach(async () => {
      await rlmBridge.connect();
    });

    test('should create navigation session for TypeScript file', async () => {
      const mockFilePath = '/tmp/test-typescript.ts';
      const mockFileContent = `
        interface User {
          id: number;
          name: string;
          email: string;
        }

        class UserService {
          private users: User[] = [];

          constructor() {
            this.initializeUsers();
          }

          public createUser(userData: Omit<User, 'id'>): User {
            const newUser: User = {
              id: Date.now(),
              ...userData
            };
            this.users.push(newUser);
            return newUser;
          }

          private initializeUsers(): void {
            // Initialize with default users
          }
        }
      `;

      const session = await rlmBridge.createNavigationSession(mockFilePath, {
        fileContent: mockFileContent,
        language: 'typescript',
        parseOptions: {
          includeComments: true,
          includeTypes: true
        }
      });

      expect(session.success).toBe(true);
      expect(session.data?.file).toBe(mockFilePath);
      expect(session.data?.language).toBe('typescript');
      expect(session.data?.ast).toBeDefined();
      expect(session.data?.ast.type).toBe('program');
      expect(session.data?.symbols).toHaveLength(2); // User interface + UserService class
    });

    test('should handle large file parsing efficiently', async () => {
      const largeFilePath = '/tmp/large-file.js';
      const largeContent = Array(1000).fill(0).map((_, i) =>
        `function generatedFunction${i}() { return "Function ${i}"; }`
      ).join('\n');

      const startTime = Date.now();
      const session = await rlmBridge.createNavigationSession(largeFilePath, {
        fileContent: largeContent,
        language: 'javascript'
      });
      const parseTime = Date.now() - startTime;

      expect(session.success).toBe(true);
      expect(parseTime).toBeLessThan(5000); // Should parse within 5 seconds
      expect(session.data?.symbols).toHaveLength(1000);
    });

    test('should manage multiple concurrent navigation sessions', async () => {
      const files = [
        { path: '/tmp/file1.js', content: 'function test1() { return 1; }', lang: 'javascript' },
        { path: '/tmp/file2.py', content: 'def test2(): return 2', lang: 'python' },
        { path: '/tmp/file3.ts', content: 'const test3 = (): number => 3;', lang: 'typescript' }
      ];

      const sessionPromises = files.map(file =>
        rlmBridge.createNavigationSession(file.path, {
          fileContent: file.content,
          language: file.lang
        })
      );

      const results = await Promise.all(sessionPromises);

      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.data?.language).toBe(files[index].lang);
      });
    });

    test('should handle session cleanup and resource management', async () => {
      const session = await rlmBridge.createNavigationSession('/tmp/cleanup-test.js', {
        fileContent: 'function testCleanup() { console.log("test"); }',
        language: 'javascript'
      });

      expect(session.success).toBe(true);
      const sessionId = session.data!.id;

      // Close session explicitly
      const closeResult = await rlmBridge.closeNavigationSession(sessionId);
      expect(closeResult.success).toBe(true);

      // Attempting to use closed session should fail
      const searchResult = await rlmBridge.searchNodes(sessionId, 'testCleanup');
      expect(searchResult.success).toBe(false);
      expect(searchResult.error).toContain('session not found');
    });
  });

  describe('AST Navigation - PERFORMANCE CRITICAL', () => {
    let sessionId: string;

    beforeEach(async () => {
      await rlmBridge.connect();

      const complexCode = `
        import { EventEmitter } from 'events';
        import axios from 'axios';

        interface ApiResponse<T> {
          data: T;
          status: number;
          message?: string;
        }

        class ApiClient extends EventEmitter {
          private baseUrl: string;
          private timeout: number;

          constructor(baseUrl: string, timeout = 5000) {
            super();
            this.baseUrl = baseUrl;
            this.timeout = timeout;
          }

          async get<T>(endpoint: string): Promise<ApiResponse<T>> {
            try {
              const response = await axios.get(\`\${this.baseUrl}\${endpoint}\`, {
                timeout: this.timeout
              });

              this.emit('request', { method: 'GET', endpoint, status: response.status });

              return {
                data: response.data,
                status: response.status
              };
            } catch (error) {
              this.emit('error', error);
              throw error;
            }
          }

          async post<T, U>(endpoint: string, data: U): Promise<ApiResponse<T>> {
            const response = await axios.post(\`\${this.baseUrl}\${endpoint}\`, data, {
              timeout: this.timeout
            });

            return {
              data: response.data,
              status: response.status
            };
          }
        }

        export default ApiClient;
      `;

      const session = await rlmBridge.createNavigationSession('/tmp/api-client.ts', {
        fileContent: complexCode,
        language: 'typescript'
      });

      sessionId = session.data!.id;
    });

    test('should navigate to specific functions efficiently', async () => {
      const startTime = Date.now();
      const navigation = await rlmBridge.navigateToSymbol(sessionId, {
        symbolName: 'get',
        symbolType: 'method',
        className: 'ApiClient'
      });
      const navTime = Date.now() - startTime;

      expect(navigation.success).toBe(true);
      expect(navTime).toBeLessThan(500); // Sub-second navigation
      expect(navigation.data?.symbol.name).toBe('get');
      expect(navigation.data?.position).toBeDefined();
      expect(navigation.data?.context).toContain('ApiClient');
    });

    test('should search nodes with pattern matching', async () => {
      const searchResults = await rlmBridge.searchNodes(sessionId, 'async.*Promise', {
        searchType: 'regex',
        scope: 'functions',
        includePrivate: true
      });

      expect(searchResults.success).toBe(true);
      expect(searchResults.data?.matches).toHaveLength(2); // get and post methods
      expect(searchResults.data?.matches[0].type).toBe('method');
    });

    test('should analyze function dependencies', async () => {
      const dependencies = await rlmBridge.analyzeDependencies(sessionId, {
        target: 'get',
        direction: 'outgoing',
        maxDepth: 3,
        includeExternal: true
      });

      expect(dependencies.success).toBe(true);
      expect(dependencies.data?.dependencies).toContain('axios.get');
      expect(dependencies.data?.dependencies).toContain('this.emit');
    });

    test('should trace execution paths', async () => {
      const trace = await rlmBridge.traceExecutionPath(sessionId, {
        startFunction: 'get',
        endFunction: 'emit',
        includeConditional: true
      });

      expect(trace.success).toBe(true);
      expect(trace.data?.paths).toHaveLength(2); // Success and error paths
      expect(trace.data?.paths[0].steps).toContain('axios.get');
    });
  });

  describe('Semantic Analysis - CRITICAL', () => {
    let sessionId: string;

    beforeEach(async () => {
      await rlmBridge.connect();

      const semanticTestCode = `
        interface DatabaseConfig {
          host: string;
          port: number;
          database: string;
          ssl?: boolean;
        }

        class DatabaseConnection {
          private config: DatabaseConfig;
          private connection: any = null;

          constructor(config: DatabaseConfig) {
            this.config = config;
          }

          async connect(): Promise<boolean> {
            if (this.connection) {
              return true;
            }

            try {
              this.connection = await this.createConnection();
              return this.connection !== null;
            } catch (error) {
              console.error('Connection failed:', error);
              return false;
            }
          }

          private async createConnection() {
            // Simulate connection creation
            return { id: 'conn-123', status: 'connected' };
          }

          async query<T>(sql: string, params?: any[]): Promise<T[]> {
            if (!this.connection) {
              throw new Error('Not connected to database');
            }

            // Simulate query execution
            return [] as T[];
          }
        }
      `;

      const session = await rlmBridge.createNavigationSession('/tmp/database.ts', {
        fileContent: semanticTestCode,
        language: 'typescript'
      });

      sessionId = session.data!.id;
    });

    test('should perform type inference analysis', async () => {
      const typeAnalysis = await rlmBridge.performSemanticQuery(sessionId, {
        type: 'type_inference',
        target: 'connection',
        scope: 'class',
        className: 'DatabaseConnection'
      });

      expect(typeAnalysis.success).toBe(true);
      expect(typeAnalysis.data?.results.inferredType).toBe('any');
      expect(typeAnalysis.data?.results.usageContexts).toContain('condition');
      expect(typeAnalysis.data?.results.usageContexts).toContain('assignment');
    });

    test('should analyze control flow', async () => {
      const controlFlow = await rlmBridge.performSemanticQuery(sessionId, {
        type: 'control_flow',
        target: 'connect',
        includeExceptionPaths: true
      });

      expect(controlFlow.success).toBe(true);
      expect(controlFlow.data?.results.branches).toHaveLength(3); // Early return, try, catch
      expect(controlFlow.data?.results.exceptionHandling).toBe(true);
    });

    test('should detect potential issues', async () => {
      const issueAnalysis = await rlmBridge.performSemanticQuery(sessionId, {
        type: 'issue_detection',
        checks: ['null_safety', 'type_safety', 'error_handling'],
        severity: 'warning'
      });

      expect(issueAnalysis.success).toBe(true);
      expect(issueAnalysis.data?.results.issues).toBeInstanceOf(Array);

      // Should detect potential null access issue
      const nullIssues = issueAnalysis.data?.results.issues.filter(
        issue => issue.type === 'null_safety'
      );
      expect(nullIssues.length).toBeGreaterThan(0);
    });

    test('should analyze variable usage patterns', async () => {
      const usageAnalysis = await rlmBridge.performSemanticQuery(sessionId, {
        type: 'usage_analysis',
        target: 'config',
        scope: 'class'
      });

      expect(usageAnalysis.success).toBe(true);
      expect(usageAnalysis.data?.results.readCount).toBe(1); // Used in constructor assignment
      expect(usageAnalysis.data?.results.writeCount).toBe(1); // Assigned in constructor
      expect(usageAnalysis.data?.results.scope).toBe('class');
    });
  });

  describe('Bookmark & Navigation History', () => {
    let sessionId: string;

    beforeEach(async () => {
      await rlmBridge.connect();

      const session = await rlmBridge.createNavigationSession('/tmp/bookmarks-test.js', {
        fileContent: `
          function mainFunction() {
            helperFunction();
            anotherHelper();
          }

          function helperFunction() {
            // Important logic here
          }

          function anotherHelper() {
            // More logic
          }
        `,
        language: 'javascript'
      });

      sessionId = session.data!.id;
    });

    test('should create and manage bookmarks', async () => {
      const bookmark1 = await rlmBridge.addBookmark(sessionId, {
        name: 'Main Entry Point',
        nodeId: 'mainFunction',
        position: { line: 1, column: 10 },
        context: 'function mainFunction()',
        tags: ['entry-point', 'important'],
        description: 'Primary entry point for the module'
      });

      expect(bookmark1.success).toBe(true);
      expect(bookmark1.data?.name).toBe('Main Entry Point');

      const bookmark2 = await rlmBridge.addBookmark(sessionId, {
        name: 'Helper Logic',
        nodeId: 'helperFunction',
        position: { line: 6, column: 10 },
        context: 'function helperFunction()',
        tags: ['helper', 'core-logic']
      });

      expect(bookmark2.success).toBe(true);

      // Retrieve all bookmarks
      const bookmarks = await rlmBridge.getBookmarks(sessionId);
      expect(bookmarks.success).toBe(true);
      expect(bookmarks.data).toHaveLength(2);
    });

    test('should navigate between bookmarks efficiently', async () => {
      // Create multiple bookmarks
      const bookmarkIds = [];
      for (let i = 0; i < 3; i++) {
        const bookmark = await rlmBridge.addBookmark(sessionId, {
          name: `Bookmark ${i + 1}`,
          nodeId: `node-${i}`,
          position: { line: i + 1, column: 1 },
          context: `Context ${i + 1}`,
          tags: ['test']
        });
        bookmarkIds.push(bookmark.data!.id);
      }

      // Navigate to each bookmark
      for (const bookmarkId of bookmarkIds) {
        const startTime = Date.now();
        const navigation = await rlmBridge.navigateToBookmark(sessionId, bookmarkId);
        const navTime = Date.now() - startTime;

        expect(navigation.success).toBe(true);
        expect(navTime).toBeLessThan(100); // Very fast bookmark navigation
      }
    });

    test('should maintain navigation history', async () => {
      // Perform several navigation actions
      await rlmBridge.navigateToSymbol(sessionId, { symbolName: 'mainFunction' });
      await rlmBridge.navigateToSymbol(sessionId, { symbolName: 'helperFunction' });
      await rlmBridge.navigateToSymbol(sessionId, { symbolName: 'anotherHelper' });

      const history = await rlmBridge.getNavigationHistory(sessionId);
      expect(history.success).toBe(true);
      expect(history.data?.history).toHaveLength(3);
      expect(history.data?.current).toBe(2); // Last navigation

      // Navigate back
      const backResult = await rlmBridge.navigateBack(sessionId);
      expect(backResult.success).toBe(true);
      expect(backResult.data?.symbol.name).toBe('helperFunction');

      // Navigate forward
      const forwardResult = await rlmBridge.navigateForward(sessionId);
      expect(forwardResult.success).toBe(true);
      expect(forwardResult.data?.symbol.name).toBe('anotherHelper');
    });
  });

  describe('Real-time Code Changes', () => {
    let sessionId: string;

    beforeEach(async () => {
      await rlmBridge.connect();

      const session = await rlmBridge.createNavigationSession('/tmp/live-code.ts', {
        fileContent: `
          class Calculator {
            add(a: number, b: number): number {
              return a + b;
            }
          }
        `,
        language: 'typescript'
      });

      sessionId = session.data!.id;
    });

    test('should handle incremental code updates', async () => {
      const newContent = `
        class Calculator {
          add(a: number, b: number): number {
            return a + b;
          }

          subtract(a: number, b: number): number {
            return a - b;
          }

          multiply(a: number, b: number): number {
            return a * b;
          }
        }
      `;

      const updateResult = await rlmBridge.updateSessionContent(sessionId, {
        content: newContent,
        incremental: true,
        changes: [
          { type: 'addition', range: { start: { line: 6, column: 0 }, end: { line: 14, column: 1 } } }
        ]
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.data?.symbols).toHaveLength(3); // add, subtract, multiply

      // Verify new methods are navigable
      const navigation = await rlmBridge.navigateToSymbol(sessionId, { symbolName: 'multiply' });
      expect(navigation.success).toBe(true);
    });

    test('should maintain performance during frequent updates', async () => {
      const updates = Array(10).fill(0).map((_, i) => ({
        content: `
          class Calculator {
            method${i}(x: number): number {
              return x * ${i};
            }
          }
        `,
        incremental: false
      }));

      const startTime = Date.now();

      for (const update of updates) {
        const result = await rlmBridge.updateSessionContent(sessionId, update);
        expect(result.success).toBe(true);
      }

      const totalTime = Date.now() - startTime;
      expect(totalTime).toBeLessThan(3000); // Should handle rapid updates efficiently
    });

    test('should detect and handle syntax errors gracefully', async () => {
      const invalidContent = `
        class Calculator {
          add(a: number, b: number): number {
            return a + // Syntax error - missing operand
          }
        }
      `;

      const updateResult = await rlmBridge.updateSessionContent(sessionId, {
        content: invalidContent,
        incremental: false
      });

      // Should handle gracefully with error information
      if (!updateResult.success) {
        expect(updateResult.error).toContain('syntax error');
      } else {
        expect(updateResult.data?.errors).toBeDefined();
        expect(updateResult.data?.errors.length).toBeGreaterThan(0);
      }

      // Session should remain usable
      const health = await rlmBridge.getSessionHealth(sessionId);
      expect(health.success).toBe(true);
    });
  });

  describe('Performance & Memory Management', () => {
    beforeEach(async () => {
      await rlmBridge.connect();
    });

    test('should handle large codebases efficiently', async () => {
      // Create a large synthetic codebase
      const largeCodebase = Array(100).fill(0).map((_, i) => `
        class Service${i} {
          private data: Map<string, any> = new Map();

          async process${i}(input: string): Promise<string> {
            this.data.set('key${i}', input);
            return this.transform${i}(input);
          }

          private transform${i}(input: string): string {
            return input.toUpperCase() + '_${i}';
          }
        }
      `).join('\n');

      const startTime = Date.now();
      const session = await rlmBridge.createNavigationSession('/tmp/large-codebase.ts', {
        fileContent: largeCodebase,
        language: 'typescript'
      });
      const parseTime = Date.now() - startTime;

      expect(session.success).toBe(true);
      expect(parseTime).toBeLessThan(10000); // Should parse large file within 10 seconds
      expect(session.data?.symbols.length).toBe(300); // 100 classes * 3 methods each
    });

    test('should manage memory usage with multiple sessions', async () => {
      const initialMemory = process.memoryUsage();

      // Create multiple sessions
      const sessions = [];
      for (let i = 0; i < 10; i++) {
        const session = await rlmBridge.createNavigationSession(`/tmp/session-${i}.js`, {
          fileContent: `function test${i}() { return ${i}; }`,
          language: 'javascript'
        });
        sessions.push(session.data!.id);
      }

      const peakMemory = process.memoryUsage();

      // Close all sessions
      for (const sessionId of sessions) {
        await rlmBridge.closeNavigationSession(sessionId);
      }

      const finalMemory = process.memoryUsage();

      // Memory should be reasonable and cleaned up
      const memoryIncrease = peakMemory.heapUsed - initialMemory.heapUsed;
      const memoryAfterCleanup = finalMemory.heapUsed - initialMemory.heapUsed;

      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB for 10 sessions
      expect(memoryAfterCleanup).toBeLessThan(memoryIncrease * 0.5); // Significant cleanup
    });

    test('should cache parsing results effectively', async () => {
      const fileContent = 'function cached() { return "test"; }';

      // First parse
      const startTime1 = Date.now();
      const session1 = await rlmBridge.createNavigationSession('/tmp/cached-file.js', {
        fileContent,
        language: 'javascript'
      });
      const time1 = Date.now() - startTime1;

      await rlmBridge.closeNavigationSession(session1.data!.id);

      // Second parse of same content - should be cached
      const startTime2 = Date.now();
      const session2 = await rlmBridge.createNavigationSession('/tmp/cached-file.js', {
        fileContent,
        language: 'javascript'
      });
      const time2 = Date.now() - startTime2;

      expect(session1.success).toBe(true);
      expect(session2.success).toBe(true);
      expect(time2).toBeLessThan(time1); // Cached parse should be faster

      await rlmBridge.closeNavigationSession(session2.data!.id);
    });
  });

  describe('Error Recovery & Resilience', () => {
    beforeEach(async () => {
      await rlmBridge.connect();
    });

    test('should recover from MCP connection issues', async () => {
      // Simulate connection issue
      const invalidConfig = {
        ...mockConfig,
        navigator: { ...mockConfig.navigator, mcpEndpoint: 'http://invalid-endpoint' }
      };

      const faultyBridge = new RLMNavigatorBridge(invalidConfig);

      // Connection should fail initially
      const connectResult = await faultyBridge.connect();
      expect(connectResult.success).toBe(false);

      // Should attempt reconnection and handle gracefully
      await faultyBridge.disconnect();
    });

    test('should handle malformed code gracefully', async () => {
      const malformedCode = `
        function incomplete(
        // Missing closing parenthesis and brace
        const invalid syntax here
        random tokens } ] )
      `;

      const session = await rlmBridge.createNavigationSession('/tmp/malformed.js', {
        fileContent: malformedCode,
        language: 'javascript'
      });

      // Should either succeed with error reporting or fail gracefully
      if (!session.success) {
        expect(session.error).toContain('parse error');
      } else {
        expect(session.data?.errors).toBeDefined();
      }

      // Bridge should remain operational
      const health = await rlmBridge.getHealth();
      expect(['healthy', 'degraded']).toContain(health.status);
    });
  });
});