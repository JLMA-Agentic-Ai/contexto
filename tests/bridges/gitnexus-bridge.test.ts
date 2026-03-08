/**
 * GitNexusBridge Integration Tests
 * PRODUCTION CRITICAL: Tests code analysis and graph database operations
 */

import { GitNexusBridge, GitNexusConfig } from '../../src/bridges/GitNexusBridge';
import { createMockBridgeConfig } from '../setup';

describe('GitNexusBridge - Production Integration Tests', () => {
  let gitNexusBridge: GitNexusBridge;
  let mockConfig: GitNexusConfig;

  beforeEach(() => {
    mockConfig = {
      ...createMockBridgeConfig(),
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
        supportedLanguages: ['javascript', 'typescript', 'python', 'java']
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
    } as GitNexusConfig;

    gitNexusBridge = new GitNexusBridge(mockConfig);
  });

  afterEach(async () => {
    await gitNexusBridge.disconnect();
  });

  describe('Database Connection - CRITICAL', () => {
    test('should connect to Kuzu database successfully', async () => {
      const connectResult = await gitNexusBridge.connect();
      expect(connectResult.success).toBe(true);
      expect(await gitNexusBridge.isConnected()).toBe(true);
    });

    test('should handle database connection failure', async () => {
      const invalidConfig = {
        ...mockConfig,
        database: { ...mockConfig.database, kuzuPath: '/invalid/path/db.kuzu' }
      };

      const failingBridge = new GitNexusBridge(invalidConfig);
      const connectResult = await failingBridge.connect();

      expect(connectResult.success).toBe(false);
      expect(connectResult.error).toContain('database');
    });

    test('should maintain connection pool efficiently', async () => {
      await gitNexusBridge.connect();

      // Execute multiple concurrent queries to test pool
      const queries = Array(10).fill(0).map((_, i) =>
        gitNexusBridge.executeQuery({
          query: 'MATCH (s:Symbol) RETURN s LIMIT 1',
          parameters: {},
          timeout: 5000
        })
      );

      const results = await Promise.all(queries);
      results.forEach(result => {
        expect(result.success).toBe(true);
      });
    });
  });

  describe('Repository Management - PRODUCTION CRITICAL', () => {
    beforeEach(async () => {
      await gitNexusBridge.connect();
    });

    test('should add repository and initialize indexing', async () => {
      const repository = {
        id: 'test-repo-001',
        name: 'Production Test Repository',
        path: '/tmp/test-repository',
        remote: 'https://github.com/company/production-app.git',
        branch: 'main',
        languages: ['typescript', 'javascript'],
        excludePatterns: ['node_modules', '*.test.ts', 'dist']
      };

      const addResult = await gitNexusBridge.addRepository(repository);
      expect(addResult.success).toBe(true);
      expect(addResult.data?.name).toBe('Production Test Repository');
      expect(addResult.data?.indexing?.status).toBe('initialized');
    });

    test('should handle repository indexing with large codebase', async () => {
      const largeRepository = {
        id: 'large-repo',
        name: 'Large Production Codebase',
        path: '/tmp/large-codebase',
        remote: 'https://github.com/company/large-monorepo.git',
        branch: 'main',
        estimatedFiles: 10000,
        estimatedSize: '500MB'
      };

      const startTime = Date.now();
      const indexResult = await gitNexusBridge.addRepository(largeRepository);
      const indexingTime = Date.now() - startTime;

      expect(indexResult.success).toBe(true);
      expect(indexingTime).toBeLessThan(30000); // Should complete indexing within 30 seconds

      // Verify indexing statistics
      const stats = await gitNexusBridge.getRepositoryStats(largeRepository.id);
      expect(stats.success).toBe(true);
      expect(stats.data?.files).toBeGreaterThan(0);
      expect(stats.data?.symbols).toBeGreaterThan(0);
    });

    test('should sync repository changes incrementally', async () => {
      const repository = {
        id: 'sync-test-repo',
        name: 'Sync Test Repository',
        path: '/tmp/sync-test',
        remote: 'https://github.com/test/sync-repo.git',
        branch: 'main'
      };

      await gitNexusBridge.addRepository(repository);

      // Simulate repository changes
      const syncResult = await gitNexusBridge.syncRepository(repository.id, {
        incremental: true,
        changedFiles: ['src/main.ts', 'src/utils.ts'],
        deletedFiles: ['src/deprecated.ts']
      });

      expect(syncResult.success).toBe(true);
      expect(syncResult.data?.filesProcessed).toBe(2);
      expect(syncResult.data?.filesDeleted).toBe(1);
    });
  });

  describe('Code Analysis - PERFORMANCE CRITICAL', () => {
    beforeEach(async () => {
      await gitNexusBridge.connect();

      // Set up test repository
      await gitNexusBridge.addRepository({
        id: 'analysis-repo',
        name: 'Analysis Test Repository',
        path: '/tmp/analysis-test',
        remote: 'https://github.com/test/analysis.git',
        branch: 'main'
      });
    });

    test('should perform symbol analysis efficiently', async () => {
      const startTime = Date.now();

      const symbolResult = await gitNexusBridge.findSymbol('UserService', 'class', 'analysis-repo');
      const analysisTime = Date.now() - startTime;

      expect(symbolResult.success).toBe(true);
      expect(analysisTime).toBeLessThan(1000); // Sub-second symbol lookup
      expect(Array.isArray(symbolResult.data)).toBe(true);
    });

    test('should build accurate dependency graph', async () => {
      const dependencyResult = await gitNexusBridge.analyzeDependencies('analysis-repo', {
        includeExternal: true,
        maxDepth: 5,
        includeTypes: ['imports', 'calls', 'inheritance']
      });

      expect(dependencyResult.success).toBe(true);
      expect(dependencyResult.data?.nodes).toBeGreaterThan(0);
      expect(dependencyResult.data?.edges).toBeGreaterThan(0);
      expect(dependencyResult.data?.cycles).toBeDefined();
    });

    test('should detect code quality issues', async () => {
      const qualityResult = await gitNexusBridge.analyzeQuality('analysis-repo', {
        metrics: ['complexity', 'maintainability', 'testability'],
        threshold: 'production'
      });

      expect(qualityResult.success).toBe(true);
      expect(qualityResult.data?.overall.score).toBeGreaterThanOrEqual(0);
      expect(qualityResult.data?.overall.score).toBeLessThanOrEqual(100);
      expect(qualityResult.data?.issues).toBeDefined();
    });

    test('should trace function call paths', async () => {
      const traceResult = await gitNexusBridge.traceCallPath('analysis-repo', {
        fromSymbol: 'main',
        toSymbol: 'processData',
        maxDepth: 10
      });

      expect(traceResult.success).toBe(true);
      expect(Array.isArray(traceResult.data?.paths)).toBe(true);

      if (traceResult.data?.paths.length > 0) {
        const firstPath = traceResult.data.paths[0];
        expect(firstPath.steps).toBeGreaterThan(0);
        expect(firstPath.steps[0].symbol).toBe('main');
      }
    });
  });

  describe('Graph Database Queries - CRITICAL', () => {
    beforeEach(async () => {
      await gitNexusBridge.connect();
    });

    test('should execute Cypher-like queries efficiently', async () => {
      const queries = [
        {
          description: 'Find all classes',
          query: 'MATCH (s:Symbol) WHERE s.type = "class" RETURN s LIMIT 10',
          parameters: {},
          expectedMinResults: 0
        },
        {
          description: 'Find function dependencies',
          query: 'MATCH (f:Function)-[:CALLS]->(dep) RETURN f.name, dep.name LIMIT 5',
          parameters: {},
          expectedMinResults: 0
        },
        {
          description: 'Complex dependency analysis',
          query: `
            MATCH (s:Symbol)-[:IMPORTS*1..3]->(dep:Symbol)
            WHERE s.repository = $repoId
            RETURN s.name, collect(dep.name) as dependencies
            LIMIT 10
          `,
          parameters: { repoId: 'analysis-repo' },
          expectedMinResults: 0
        }
      ];

      for (const queryTest of queries) {
        const startTime = Date.now();
        const result = await gitNexusBridge.executeQuery({
          query: queryTest.query,
          parameters: queryTest.parameters,
          timeout: 10000
        });
        const queryTime = Date.now() - startTime;

        expect(result.success).toBe(true);
        expect(queryTime).toBeLessThan(5000); // Max 5 second query time
        expect(Array.isArray(result.data?.data)).toBe(true);
        expect(result.data?.data.length).toBeGreaterThanOrEqual(queryTest.expectedMinResults);
      }
    });

    test('should handle complex analytical queries', async () => {
      const complexQuery = {
        query: `
          MATCH (repo:Repository)
          OPTIONAL MATCH (repo)<-[:BELONGS_TO]-(file:File)
          OPTIONAL MATCH (file)<-[:DEFINED_IN]-(symbol:Symbol)
          RETURN repo.name,
                 count(file) as fileCount,
                 count(symbol) as symbolCount,
                 collect(DISTINCT symbol.type) as symbolTypes
          ORDER BY fileCount DESC
          LIMIT 5
        `,
        parameters: {},
        timeout: 15000
      };

      const result = await gitNexusBridge.executeQuery(complexQuery);

      expect(result.success).toBe(true);
      expect(result.data?.columns).toContain('repo.name');
      expect(result.data?.columns).toContain('fileCount');
      expect(result.data?.columns).toContain('symbolCount');
    });

    test('should maintain query performance under load', async () => {
      const concurrentQueries = Array(20).fill(0).map((_, i) => ({
        query: 'MATCH (s:Symbol) WHERE s.id = $symbolId RETURN s',
        parameters: { symbolId: `symbol-${i}` },
        timeout: 5000
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        concurrentQueries.map(q => gitNexusBridge.executeQuery(q))
      );
      const totalTime = Date.now() - startTime;

      // All queries should complete
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should handle concurrent load efficiently
      expect(totalTime).toBeLessThan(10000); // 10 second limit for 20 queries
    });
  });

  describe('Security & Data Integrity', () => {
    beforeEach(async () => {
      await gitNexusBridge.connect();
    });

    test('should prevent SQL injection in queries', async () => {
      const maliciousQuery = {
        query: 'MATCH (s:Symbol) WHERE s.name = $name RETURN s',
        parameters: {
          name: "'; DROP DATABASE production; --"
        },
        timeout: 5000
      };

      // Should execute safely without dropping anything
      const result = await gitNexusBridge.executeQuery(maliciousQuery);
      expect(result.success).toBe(true);

      // Database should still be functional
      const healthCheck = await gitNexusBridge.getHealth();
      expect(healthCheck.status).toBe('healthy');
    });

    test('should validate repository paths for security', async () => {
      const maliciousRepo = {
        id: 'malicious-repo',
        name: 'Malicious Repository',
        path: '/etc/passwd', // System file
        remote: 'https://malicious-site.com/repo.git',
        branch: 'main'
      };

      const result = await gitNexusBridge.addRepository(maliciousRepo);
      expect(result.success).toBe(false);
      expect(result.error).toContain('path validation');
    });

    test('should enforce query timeout limits', async () => {
      const longRunningQuery = {
        query: 'MATCH (a)-[*1..100]->(b) RETURN count(*)', // Potentially expensive
        parameters: {},
        timeout: 1000 // 1 second limit
      };

      const startTime = Date.now();
      const result = await gitNexusBridge.executeQuery(longRunningQuery);
      const actualTime = Date.now() - startTime;

      // Should timeout within reasonable time
      expect(actualTime).toBeLessThan(2000);

      if (!result.success) {
        expect(result.error).toContain('timeout');
      }
    });
  });

  describe('Performance Optimization', () => {
    beforeEach(async () => {
      await gitNexusBridge.connect();
    });

    test('should utilize query caching effectively', async () => {
      const query = {
        query: 'MATCH (s:Symbol) WHERE s.type = "class" RETURN count(s)',
        parameters: {},
        timeout: 5000
      };

      // First execution - cache miss
      const startTime1 = Date.now();
      const result1 = await gitNexusBridge.executeQuery(query);
      const time1 = Date.now() - startTime1;

      expect(result1.success).toBe(true);

      // Second execution - should be cached
      const startTime2 = Date.now();
      const result2 = await gitNexusBridge.executeQuery(query);
      const time2 = Date.now() - startTime2;

      expect(result2.success).toBe(true);
      expect(result2.data).toEqual(result1.data);

      // Cached query should be faster
      expect(time2).toBeLessThan(time1);
    });

    test('should optimize memory usage during large operations', async () => {
      const initialMemory = process.memoryUsage();

      // Simulate large repository analysis
      const largeAnalysis = await gitNexusBridge.analyzeRepository('analysis-repo', {
        includeAll: true,
        maxDepth: 10,
        includeTests: true,
        includeComments: true
      });

      expect(largeAnalysis.success).toBe(true);

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

      // Should not leak excessive memory
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // 100MB limit
    });

    test('should handle concurrent repository operations', async () => {
      const repositories = Array(5).fill(0).map((_, i) => ({
        id: `concurrent-repo-${i}`,
        name: `Concurrent Repo ${i}`,
        path: `/tmp/concurrent-${i}`,
        remote: `https://github.com/test/concurrent-${i}.git`,
        branch: 'main'
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        repositories.map(repo => gitNexusBridge.addRepository(repo))
      );
      const totalTime = Date.now() - startTime;

      // All operations should succeed
      results.forEach(result => {
        expect(result.success).toBe(true);
      });

      // Should handle concurrency efficiently
      expect(totalTime).toBeLessThan(15000); // 15 second limit for 5 repos
    });
  });

  describe('Error Recovery & Resilience', () => {
    test('should recover from database connection loss', async () => {
      await gitNexusBridge.connect();

      // Simulate connection loss
      await gitNexusBridge.disconnect();

      // Operations should trigger reconnection
      const query = {
        query: 'MATCH (s:Symbol) RETURN count(s)',
        parameters: {},
        timeout: 5000
      };

      const result = await gitNexusBridge.executeQuery(query);
      expect(result.success).toBe(true);
    });

    test('should handle corrupt repository data gracefully', async () => {
      const corruptRepo = {
        id: 'corrupt-repo',
        name: 'Corrupt Repository',
        path: '/tmp/corrupt-data',
        remote: 'https://github.com/test/corrupt.git',
        branch: 'main',
        simulateCorruption: true // Test parameter
      };

      const result = await gitNexusBridge.addRepository(corruptRepo);

      // Should fail gracefully without crashing
      if (!result.success) {
        expect(result.error).toContain('corruption');
      }

      // Bridge should remain operational
      const health = await gitNexusBridge.getHealth();
      expect(health.status).toBeOneOf(['healthy', 'degraded']);
    });
  });
});