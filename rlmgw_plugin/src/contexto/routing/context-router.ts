/**
 * Context Router - Smart routing between Ruflo V3 and RLMgw
 *
 * Implements evidence-based routing logic from investigation report:
 * - High confidence (>60% similarity) → Ruflo V3 cached result
 * - Low confidence (<40%) → RLMgw live exploration
 * - Adaptive threshold tuning based on performance metrics
 */

import { ContextoConfig } from '../plugin';
import { Logger } from '@claude-flow/core';

export interface RoutingDecision {
  useRufloV3: boolean;
  useRLMgw: boolean;
  confidence: number;
  reasoning: string;
}

export interface PerformanceMetrics {
  cacheHitRate: number;
  averageResponseTime: number;
  contextCompleteness: number;
  errorRate: number;
}

export class ContextRouter {
  private logger = new Logger('ContextRouter');
  private confidenceThreshold: number;
  private adaptiveThresholdEnabled: boolean;

  constructor(private config: ContextoConfig) {
    this.confidenceThreshold = config.rufloV3.confidenceThreshold;
    this.adaptiveThresholdEnabled = true;
  }

  /**
   * Make routing decision based on query characteristics and confidence
   */
  async route(query: string, rufloConfidence?: number): Promise<RoutingDecision> {
    // If Ruflo V3 is disabled, always use RLMgw
    if (!this.config.rufloV3.enabled) {
      return {
        useRufloV3: false,
        useRLMgw: true,
        confidence: 0,
        reasoning: 'Ruflo V3 disabled in configuration'
      };
    }

    // If RLMgw is disabled, always use Ruflo V3
    if (!this.config.rlmgw.enabled) {
      return {
        useRufloV3: true,
        useRLMgw: false,
        confidence: rufloConfidence || 0,
        reasoning: 'RLMgw disabled in configuration'
      };
    }

    // If we have Ruflo confidence, use it for decision
    if (rufloConfidence !== undefined) {
      if (rufloConfidence > this.confidenceThreshold) {
        return {
          useRufloV3: true,
          useRLMgw: false,
          confidence: rufloConfidence,
          reasoning: `High confidence (${rufloConfidence.toFixed(2)}) above threshold (${this.confidenceThreshold})`
        };
      } else {
        return {
          useRufloV3: false,
          useRLMgw: true,
          confidence: rufloConfidence,
          reasoning: `Low confidence (${rufloConfidence.toFixed(2)}) below threshold (${this.confidenceThreshold})`
        };
      }
    }

    // Analyze query characteristics for initial routing
    const queryCharacteristics = this.analyzeQuery(query);

    if (queryCharacteristics.isExploratoryQuery) {
      return {
        useRufloV3: false,
        useRLMgw: true,
        confidence: 0,
        reasoning: 'Exploratory query detected - requires live exploration'
      };
    }

    if (queryCharacteristics.isSpecificQuery) {
      return {
        useRufloV3: true,
        useRLMgw: false,
        confidence: 0.8, // Assume high confidence for specific queries
        reasoning: 'Specific query detected - likely in cache'
      };
    }

    // Default: try Ruflo V3 first
    return {
      useRufloV3: true,
      useRLMgw: false,
      confidence: 0.5,
      reasoning: 'Default routing to Ruflo V3 for initial attempt'
    };
  }

  /**
   * Adaptive threshold adjustment based on performance metrics
   * Inspired by ADW evidence-based optimization
   */
  async adjustConfidenceThreshold(metrics: PerformanceMetrics): Promise<void> {
    if (!this.adaptiveThresholdEnabled) return;

    const oldThreshold = this.confidenceThreshold;

    // If cache hit rate is too low, lower threshold (more aggressive caching)
    if (metrics.cacheHitRate < this.config.performance.targetCacheHitRate) {
      this.confidenceThreshold = Math.max(0.3, this.confidenceThreshold - 0.05);
      this.logger.info(`Lowered confidence threshold: ${oldThreshold} → ${this.confidenceThreshold} (cache hit rate: ${metrics.cacheHitRate})`);
    }

    // If cache hit rate is too high but completeness is low, raise threshold
    if (metrics.cacheHitRate > 0.8 && metrics.contextCompleteness < this.config.performance.targetCompleteness) {
      this.confidenceThreshold = Math.min(0.8, this.confidenceThreshold + 0.05);
      this.logger.info(`Raised confidence threshold: ${oldThreshold} → ${this.confidenceThreshold} (completeness: ${metrics.contextCompleteness})`);
    }

    // If error rate is high, be more conservative (higher threshold)
    if (metrics.errorRate > 0.05) {
      this.confidenceThreshold = Math.min(0.8, this.confidenceThreshold + 0.1);
      this.logger.warn(`Raised confidence threshold due to high error rate: ${oldThreshold} → ${this.confidenceThreshold} (error rate: ${metrics.errorRate})`);
    }
  }

  /**
   * Analyze query to determine routing strategy
   */
  private analyzeQuery(query: string): {
    isExploratoryQuery: boolean;
    isSpecificQuery: boolean;
    complexity: 'low' | 'medium' | 'high';
  } {
    const exploratoryKeywords = [
      'find', 'search', 'explore', 'discover', 'what', 'how', 'why', 'where',
      'list all', 'show me', 'overview', 'summary', 'architecture'
    ];

    const specificKeywords = [
      'function', 'class', 'method', 'variable', 'import', 'export',
      'line', 'file', 'error', 'bug', 'fix', 'implement'
    ];

    const lowercaseQuery = query.toLowerCase();

    const isExploratory = exploratoryKeywords.some(keyword =>
      lowercaseQuery.includes(keyword)
    );

    const isSpecific = specificKeywords.some(keyword =>
      lowercaseQuery.includes(keyword)
    );

    // Determine complexity based on query length and structure
    let complexity: 'low' | 'medium' | 'high' = 'low';
    if (query.length > 100 || query.includes(' and ') || query.includes(' or ')) {
      complexity = 'medium';
    }
    if (query.length > 200 || (query.match(/\s+/g) || []).length > 20) {
      complexity = 'high';
    }

    return {
      isExploratoryQuery: isExploratory,
      isSpecificQuery: isSpecific && !isExploratory,
      complexity
    };
  }

  /**
   * Get current routing configuration
   */
  getRoutingConfig(): {
    confidenceThreshold: number;
    adaptiveThresholdEnabled: boolean;
    rufloV3Enabled: boolean;
    rlmgwEnabled: boolean;
  } {
    return {
      confidenceThreshold: this.confidenceThreshold,
      adaptiveThresholdEnabled: this.adaptiveThresholdEnabled,
      rufloV3Enabled: this.config.rufloV3.enabled,
      rlmgwEnabled: this.config.rlmgw.enabled
    };
  }

  /**
   * Manually override confidence threshold (for testing/tuning)
   */
  setConfidenceThreshold(threshold: number): void {
    if (threshold < 0 || threshold > 1) {
      throw new Error('Confidence threshold must be between 0 and 1');
    }

    const oldThreshold = this.confidenceThreshold;
    this.confidenceThreshold = threshold;
    this.logger.info(`Manual confidence threshold override: ${oldThreshold} → ${threshold}`);
  }

  /**
   * Enable or disable adaptive threshold adjustment
   */
  setAdaptiveThreshold(enabled: boolean): void {
    this.adaptiveThresholdEnabled = enabled;
    this.logger.info(`Adaptive threshold adjustment ${enabled ? 'enabled' : 'disabled'}`);
  }
}
