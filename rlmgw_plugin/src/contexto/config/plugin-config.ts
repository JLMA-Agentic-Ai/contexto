/**
 * Plugin Configuration - Default configuration inspired by ADW investigation report
 */

import { ContextoConfig } from '../plugin';

export const defaultContextoConfig: ContextoConfig = {
  name: 'contexto',
  version: '1.0.0',
  enabled: true,

  // Hybrid configuration based on investigation findings
  rufloV3: {
    enabled: true,
    confidenceThreshold: 0.4, // Route to RLMgw if below 40%
    maxCacheAge: 86400 * 7, // 7 days
  },

  rlmgw: {
    enabled: true,
    endpoint: 'http://127.0.0.1:8010', // Default RLMgw endpoint
    maxExplorationTime: 5000, // 5s target from investigation
    feedbackIndexing: true, // Enable learning
  },

  // Performance targets from investigation report
  performance: {
    targetCachedResponseTime: 100, // <100ms
    targetLiveResponseTime: 5000,   // <5s
    targetCompleteness: 0.98,       // 98%+
    targetCacheHitRate: 0.70,       // >70%
  },

  // Memory configuration
  memory: {
    namespaceStrategy: 'mixed', // Project + domain hybrid
    persistentLearning: true,
    crossSessionEnabled: true,
  },
};

/**
 * Validate configuration
 */
export function validateConfig(config: Partial<ContextoConfig>): ContextoConfig {
  const merged = { ...defaultContextoConfig, ...config };

  // Validate thresholds
  if (merged.rufloV3.confidenceThreshold < 0 || merged.rufloV3.confidenceThreshold > 1) {
    throw new Error('Ruflo V3 confidence threshold must be between 0 and 1');
  }

  if (merged.performance.targetCompleteness < 0 || merged.performance.targetCompleteness > 1) {
    throw new Error('Target completeness must be between 0 and 1');
  }

  if (merged.performance.targetCacheHitRate < 0 || merged.performance.targetCacheHitRate > 1) {
    throw new Error('Target cache hit rate must be between 0 and 1');
  }

  // Validate timeouts
  if (merged.rlmgw.maxExplorationTime < 1000) {
    throw new Error('RLMgw max exploration time must be at least 1000ms');
  }

  return merged;
}

/**
 * Load configuration from environment variables
 */
export function loadConfigFromEnv(): Partial<ContextoConfig> {
  return {
    rufloV3: {
      enabled: process.env.CONTEXTO_RUFLO_V3_ENABLED !== 'false',
      confidenceThreshold: parseFloat(process.env.CONTEXTO_CONFIDENCE_THRESHOLD || '0.4'),
      maxCacheAge: parseInt(process.env.CONTEXTO_CACHE_MAX_AGE || '604800'), // 7 days
    },

    rlmgw: {
      enabled: process.env.CONTEXTO_RLMGW_ENABLED !== 'false',
      endpoint: process.env.CONTEXTO_RLMGW_ENDPOINT || 'http://127.0.0.1:8010',
      maxExplorationTime: parseInt(process.env.CONTEXTO_MAX_EXPLORATION_TIME || '5000'),
      feedbackIndexing: process.env.CONTEXTO_FEEDBACK_INDEXING !== 'false',
    },

    performance: {
      targetCachedResponseTime: parseInt(process.env.CONTEXTO_TARGET_CACHED_TIME || '100'),
      targetLiveResponseTime: parseInt(process.env.CONTEXTO_TARGET_LIVE_TIME || '5000'),
      targetCompleteness: parseFloat(process.env.CONTEXTO_TARGET_COMPLETENESS || '0.98'),
      targetCacheHitRate: parseFloat(process.env.CONTEXTO_TARGET_CACHE_HIT_RATE || '0.70'),
    },

    memory: {
      namespaceStrategy: (process.env.CONTEXTO_NAMESPACE_STRATEGY as any) || 'mixed',
      persistentLearning: process.env.CONTEXTO_PERSISTENT_LEARNING !== 'false',
      crossSessionEnabled: process.env.CONTEXTO_CROSS_SESSION !== 'false',
    },
  };
}
