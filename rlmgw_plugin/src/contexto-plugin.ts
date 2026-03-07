/**
 * Contexto Plugin - RLMgw + Ruflo V3 Integration
 *
 * Hybrid context selection engine targeting:
 * - 98%+ context completeness
 * - <100ms cached responses
 * - <5s live exploration
 * - 4.75x performance improvement
 */

import { RLMgwIntegration } from './integrations/rlmgw';
import { RufloV3Integration } from './integrations/ruflo-v3';
import { HybridContextEngine } from './core/hybrid-context-engine';
import { PerformanceOptimizer } from './optimization/performance-optimizer';
import { SecurityManager } from './security/security-manager';

export interface ContextoPluginConfig {
  rlmgwConfig: {
    apiEndpoint: string;
    timeout: number;
  };
  rufloConfig: {
    hnsw: {
      dimensions: number;
      efConstruction: number;
      maxConnections: number;
    };
    cacheSize: number;
  };
  performance: {
    cacheHitRateTarget: number; // >70%
    cachedResponseTarget: number; // <100ms
    liveExplorationTarget: number; // <5s
  };
}

export class ContextoPlugin {
  private rlmgwIntegration: RLMgwIntegration;
  private rufloV3Integration: RufloV3Integration;
  private hybridEngine: HybridContextEngine;
  private performanceOptimizer: PerformanceOptimizer;
  private securityManager: SecurityManager;

  constructor(private config: ContextoPluginConfig) {
    this.initializeComponents();
  }

  private initializeComponents(): void {
    this.rlmgwIntegration = new RLMgwIntegration(this.config.rlmgwConfig);
    this.rufloV3Integration = new RufloV3Integration(this.config.rufloConfig);

    this.hybridEngine = new HybridContextEngine({
      rlmgw: this.rlmgwIntegration,
      ruflo: this.rufloV3Integration,
      performanceTargets: this.config.performance
    });

    this.performanceOptimizer = new PerformanceOptimizer(this.config.performance);
    this.securityManager = new SecurityManager();
  }

  /**
   * Get context with hybrid approach
   * Priority: Cached (Ruflo V3) → Live (RLMgw) → Fallback
   */
  async getContext(query: string, options?: {
    forceRefresh?: boolean;
    maxLatency?: number;
    securityLevel?: 'normal' | 'high';
  }): Promise<ContextResult> {
    const startTime = performance.now();

    try {
      // Security validation
      await this.securityManager.validateRequest(query, options?.securityLevel || 'normal');

      // Hybrid context retrieval
      const result = await this.hybridEngine.getContext(query, {
        forceRefresh: options?.forceRefresh || false,
        maxLatency: options?.maxLatency || this.config.performance.cachedResponseTarget,
      });

      // Performance optimization
      this.performanceOptimizer.recordMetrics({
        query,
        latency: performance.now() - startTime,
        cacheHit: result.source === 'cache',
        completeness: result.completeness,
      });

      return result;
    } catch (error) {
      throw new ContextoError(`Context retrieval failed: ${error.message}`, {
        query,
        latency: performance.now() - startTime,
        error,
      });
    }
  }

  /**
   * Learn from context usage for cross-session improvement
   */
  async learnFromUsage(query: string, result: ContextResult, feedback: UserFeedback): Promise<void> {
    await this.hybridEngine.learn({
      query,
      result,
      feedback,
      timestamp: new Date(),
    });
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    return this.performanceOptimizer.getCurrentMetrics();
  }
}

export interface ContextResult {
  content: any[];
  completeness: number; // 0-1, targeting >0.98
  source: 'cache' | 'live' | 'hybrid';
  latency: number;
  confidence: number;
}

export interface UserFeedback {
  relevance: number; // 0-1
  completeness: number; // 0-1
  accuracy: number; // 0-1
  comments?: string;
}

export interface PerformanceMetrics {
  cacheHitRate: number;
  avgCachedLatency: number;
  avgLiveLatency: number;
  avgCompleteness: number;
  performanceImprovement: number; // vs baseline
}

export class ContextoError extends Error {
  constructor(message: string, public details: Record<string, any>) {
    super(message);
    this.name = 'ContextoError';
  }
}
