/**
 * Hybrid Context Engine - Core coordination between RLMgw and Ruflo V3
 */

import { RLMgwIntegration } from '../integrations/rlmgw';
import { RufloV3Integration } from '../integrations/ruflo-v3';
import { ContextResult, UserFeedback } from '../contexto-plugin';

export interface HybridContextConfig {
  rlmgw: RLMgwIntegration;
  ruflo: RufloV3Integration;
  performanceTargets: {
    cacheHitRateTarget: number;
    cachedResponseTarget: number;
    liveExplorationTarget: number;
  };
}

export interface ContextRequest {
  forceRefresh: boolean;
  maxLatency: number;
}

export class HybridContextEngine {
  private cacheHitRate: number = 0;
  private totalRequests: number = 0;
  private cacheHits: number = 0;

  constructor(private config: HybridContextConfig) {}

  /**
   * Intelligent context selection algorithm
   * 1. Check Ruflo V3 cache first (HNSW semantic search)
   * 2. If cache miss or low confidence, use RLMgw live exploration
   * 3. Merge results for maximum completeness
   */
  async getContext(query: string, request: ContextRequest): Promise<ContextResult> {
    this.totalRequests++;
    const startTime = performance.now();

    try {
      // Phase 1: Ruflo V3 cached lookup (target <100ms)
      if (!request.forceRefresh) {
        const cachedResult = await this.config.ruflo.getCachedContext(query, {
          maxLatency: Math.min(request.maxLatency, this.config.performanceTargets.cachedResponseTarget)
        });

        if (cachedResult && this.isResultSufficient(cachedResult)) {
          this.cacheHits++;
          this.updateCacheHitRate();

          return {
            content: cachedResult.content,
            completeness: cachedResult.completeness,
            source: 'cache',
            latency: performance.now() - startTime,
            confidence: cachedResult.confidence
          };
        }
      }

      // Phase 2: RLMgw live exploration (target <5s)
      const remainingLatency = request.maxLatency - (performance.now() - startTime);
      const liveResult = await this.config.rlmgw.getLiveContext(query, {
        maxLatency: Math.min(remainingLatency, this.config.performanceTargets.liveExplorationTarget)
      });

      // Phase 3: Hybrid merge for maximum completeness
      const hybridResult = await this.mergeResults(
        cachedResult || null,
        liveResult,
        query
      );

      // Cache the new result for future use
      await this.config.ruflo.cacheResult(query, hybridResult);

      this.updateCacheHitRate();

      return {
        content: hybridResult.content,
        completeness: hybridResult.completeness,
        source: cachedResult ? 'hybrid' : 'live',
        latency: performance.now() - startTime,
        confidence: hybridResult.confidence
      };

    } catch (error) {
      throw new Error(`Hybrid context engine failed: ${error.message}`);
    }
  }

  /**
   * Learn from user feedback for cross-session improvement
   */
  async learn(learningData: {
    query: string;
    result: ContextResult;
    feedback: UserFeedback;
    timestamp: Date;
  }): Promise<void> {
    // Store learning patterns for both systems
    await Promise.all([
      this.config.ruflo.learn(learningData),
      this.config.rlmgw.learn(learningData)
    ]);
  }

  /**
   * Determine if cached result meets completeness threshold
   */
  private isResultSufficient(result: any): boolean {
    return result.completeness >= 0.85 && result.confidence >= 0.75;
  }

  /**
   * Merge cached and live results for maximum completeness
   */
  private async mergeResults(cached: any | null, live: any, query: string): Promise<any> {
    if (!cached) {
      return live;
    }

    // Smart merging algorithm
    const mergedContent = [
      ...cached.content,
      ...live.content.filter((item: any) =>
        !this.isDuplicate(item, cached.content)
      )
    ];

    return {
      content: mergedContent,
      completeness: Math.max(cached.completeness, live.completeness,
        this.calculateMergedCompleteness(cached, live)),
      confidence: (cached.confidence * 0.6) + (live.confidence * 0.4),
    };
  }

  private isDuplicate(item: any, existingContent: any[]): boolean {
    return existingContent.some(existing =>
      JSON.stringify(item).slice(0, 100) === JSON.stringify(existing).slice(0, 100)
    );
  }

  private calculateMergedCompleteness(cached: any, live: any): number {
    const baseCompleteness = Math.max(cached.completeness, live.completeness);
    const additionalValue = (cached.content.length + live.content.length) /
                           Math.max(cached.content.length, live.content.length);

    return Math.min(baseCompleteness * additionalValue, 1.0);
  }

  private updateCacheHitRate(): void {
    this.cacheHitRate = this.cacheHits / this.totalRequests;
  }

  getMetrics(): { cacheHitRate: number; totalRequests: number } {
    return {
      cacheHitRate: this.cacheHitRate,
      totalRequests: this.totalRequests
    };
  }
}
