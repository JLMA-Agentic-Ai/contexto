/**
 * Contexto Plugin - RLMgw Evolution for Ruflo V3
 *
 * Inspired by ADW Skills architecture, this plugin provides:
 * - 98%+ context completeness through hybrid Ruflo V3 + RLMgw
 * - <100ms cached responses via HNSW semantic search
 * - <5s live exploration via RLMgw autonomous discovery
 * - Cross-session learning with persistent memory
 */

import { Plugin, PluginConfig, ContextRequest, ContextResponse } from '@claude-flow/core';
import { RufloV3Client } from './clients/ruflo-v3-client';
import { RLMgwClient } from './clients/rlmgw-client';
import { ContextRouter } from './routing/context-router';
import { MemoryIntegration } from './memory/memory-integration';
import { PerformanceMonitor } from './monitoring/performance-monitor';

export interface ContextoConfig extends PluginConfig {
  // Hybrid configuration
  rufloV3: {
    enabled: boolean;
    confidenceThreshold: number; // Route to RLMgw if below this
    maxCacheAge: number;
  };

  rlmgw: {
    enabled: boolean;
    endpoint: string;
    maxExplorationTime: number;
    feedbackIndexing: boolean; // Feed results back to Ruflo V3
  };

  // Performance targets (from investigation report)
  performance: {
    targetCachedResponseTime: number; // <100ms
    targetLiveResponseTime: number;   // <5s
    targetCompleteness: number;       // 98%+
    targetCacheHitRate: number;       // >70%
  };

  // Memory configuration
  memory: {
    namespaceStrategy: 'project' | 'domain' | 'mixed';
    persistentLearning: boolean;
    crossSessionEnabled: boolean;
  };
}

export class ContextoPlugin extends Plugin {
  private rufloClient: RufloV3Client;
  private rlmgwClient: RLMgwClient;
  private router: ContextRouter;
  private memory: MemoryIntegration;
  private monitor: PerformanceMonitor;

  constructor(private config: ContextoConfig) {
    super('contexto', '1.0.0');

    this.rufloClient = new RufloV3Client(config.rufloV3);
    this.rlmgwClient = new RLMgwClient(config.rlmgw);
    this.router = new ContextRouter(config);
    this.memory = new MemoryIntegration(config.memory);
    this.monitor = new PerformanceMonitor(config.performance);
  }

  async initialize(): Promise<void> {
    await Promise.all([
      this.rufloClient.initialize(),
      this.rlmgwClient.initialize(),
      this.memory.initialize(),
      this.monitor.initialize()
    ]);

    this.logger.info('Contexto plugin initialized - hybrid Ruflo V3 + RLMgw ready');
  }

  /**
   * Main context delivery endpoint
   * Implements the optimal hybrid architecture from investigation report
   */
  async getContext(request: ContextRequest): Promise<ContextResponse> {
    const startTime = Date.now();

    try {
      // Step 1: Try Ruflo V3 semantic search (fast path)
      const rufloResult = await this.rufloClient.semanticSearch(request.query);

      if (rufloResult.confidence > this.config.rufloV3.confidenceThreshold) {
        // High confidence - return cached result
        const response = this.createResponse(rufloResult, 'cached', startTime);
        this.monitor.recordCacheHit(response.metadata.responseTime);
        return response;
      }

      // Step 2: Low confidence - use RLMgw exploration
      this.logger.info(`Low confidence (${rufloResult.confidence}), routing to RLMgw`);
      const rlmgwResult = await this.rlmgwClient.explore(request.query);

      // Step 3: Feed back to Ruflo V3 for learning (if enabled)
      if (this.config.rlmgw.feedbackIndexing) {
        await this.memory.indexRLMgwResults(rlmgwResult, request.query);
      }

      const response = this.createResponse(rlmgwResult, 'live', startTime);
      this.monitor.recordLiveExploration(response.metadata.responseTime);
      return response;

    } catch (error) {
      this.logger.error('Context delivery failed:', error);
      return this.createErrorResponse(error, startTime);
    }
  }

  /**
   * ADW-inspired batch context processing
   * For handling multiple context requests efficiently
   */
  async getBatchContext(requests: ContextRequest[]): Promise<ContextResponse[]> {
    // Parallel processing with smart batching
    const batchResults = await Promise.allSettled(
      requests.map(req => this.getContext(req))
    );

    return batchResults.map(result =>
      result.status === 'fulfilled' ? result.value : this.createErrorResponse(result.reason)
    );
  }

  /**
   * Cross-project context discovery inspired by ADW skills
   */
  async discoverProjectPatterns(projectPaths: string[]): Promise<void> {
    const patterns = await this.rlmgwClient.analyzeProjectPatterns(projectPaths);
    await this.memory.storeProjectPatterns(patterns);
    this.logger.info(`Discovered and stored patterns for ${projectPaths.length} projects`);
  }

  /**
   * Performance optimization inspired by ADW methodology
   */
  async optimizePerformance(): Promise<void> {
    const metrics = await this.monitor.getCurrentMetrics();

    if (metrics.cacheHitRate < this.config.performance.targetCacheHitRate) {
      // Adjust confidence threshold to improve cache hits
      await this.router.adjustConfidenceThreshold(metrics);
    }

    if (metrics.averageResponseTime > this.config.performance.targetCachedResponseTime) {
      // Optimize HNSW indexing
      await this.rufloClient.optimizeIndexing();
    }

    this.logger.info('Performance optimization completed', { metrics });
  }

  private createResponse(result: any, source: 'cached' | 'live', startTime: number): ContextResponse {
    return {
      context: result.context,
      completeness: result.completeness,
      confidence: result.confidence,
      metadata: {
        source,
        responseTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        plugin: 'contexto',
        version: this.version
      }
    };
  }

  private createErrorResponse(error: Error, startTime?: number): ContextResponse {
    return {
      context: '',
      completeness: 0,
      confidence: 0,
      error: error.message,
      metadata: {
        source: 'error',
        responseTime: startTime ? Date.now() - startTime : 0,
        timestamp: new Date().toISOString(),
        plugin: 'contexto',
        version: this.version
      }
    };
  }

  // Plugin lifecycle methods
  async start(): Promise<void> {
    await this.initialize();
    this.logger.info('Contexto plugin started successfully');
  }

  async stop(): Promise<void> {
    await Promise.all([
      this.rufloClient.shutdown(),
      this.rlmgwClient.shutdown(),
      this.monitor.shutdown()
    ]);
    this.logger.info('Contexto plugin stopped');
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'degraded' | 'unhealthy'; details: any }> {
    const checks = await Promise.allSettled([
      this.rufloClient.healthCheck(),
      this.rlmgwClient.healthCheck(),
      this.memory.healthCheck()
    ]);

    const healthy = checks.filter(c => c.status === 'fulfilled').length;
    const total = checks.length;

    if (healthy === total) return { status: 'healthy', details: { checks } };
    if (healthy > 0) return { status: 'degraded', details: { checks } };
    return { status: 'unhealthy', details: { checks } };
  }
}

// Export plugin registration
export const contextoPl = (config: ContextoConfig): ContextoPlugin => {
  return new ContextoPlugin(config);
};
