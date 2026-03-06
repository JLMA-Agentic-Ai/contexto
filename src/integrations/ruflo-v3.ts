/**
 * Ruflo V3 Integration - HNSW semantic search and caching
 */

import { UserFeedback, ContextResult } from '../contexto-plugin';

export interface RufloV3Config {
  hnsw: {
    dimensions: number;
    efConstruction: number;
    maxConnections: number;
  };
  cacheSize: number;
}

export interface CachedContextRequest {
  maxLatency: number;
}

export class RufloV3Integration {
  private cache: Map<string, CachedResult> = new Map();
  private hnsw: HNSWIndex;

  constructor(private config: RufloV3Config) {
    this.initializeHNSW();
  }

  /**
   * Get cached context using HNSW semantic search
   * Targets <100ms response with high accuracy
   */
  async getCachedContext(query: string, request: CachedContextRequest): Promise<any | null> {
    const startTime = performance.now();

    try {
      // Generate query embedding for semantic search
      const queryEmbedding = await this.generateEmbedding(query);

      // HNSW semantic search for similar contexts
      const similarQueries = this.hnsw.search(queryEmbedding, {
        k: 5, // Top 5 similar queries
        ef: this.config.hnsw.efConstruction
      });

      if (similarQueries.length === 0) {
        return null; // Cache miss
      }

      // Get the best match
      const bestMatch = similarQueries[0];
      if (bestMatch.distance > 0.3) { // Similarity threshold
        return null; // Not similar enough
      }

      const cachedResult = this.cache.get(bestMatch.query);
      if (!cachedResult || this.isCacheExpired(cachedResult)) {
        return null;
      }

      // Verify latency target
      const latency = performance.now() - startTime;
      if (latency > request.maxLatency) {
        console.warn(`Ruflo V3 cache lookup exceeded target: ${latency}ms > ${request.maxLatency}ms`);
      }

      return {
        content: cachedResult.content,
        completeness: cachedResult.completeness,
        confidence: bestMatch.similarity, // Use similarity as confidence
        metadata: {
          source: 'ruflo-v3-cache',
          latency,
          originalQuery: bestMatch.query,
          similarity: bestMatch.similarity
        }
      };

    } catch (error) {
      console.warn(`Ruflo V3 cache lookup failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Cache result for future semantic searches
   */
  async cacheResult(query: string, result: any): Promise<void> {
    try {
      const embedding = await this.generateEmbedding(query);

      // Store in HNSW index
      this.hnsw.add(query, embedding);

      // Store in cache with TTL
      this.cache.set(query, {
        content: result.content,
        completeness: result.completeness,
        confidence: result.confidence,
        timestamp: Date.now(),
        ttl: 24 * 60 * 60 * 1000 // 24 hours
      });

      // Manage cache size
      if (this.cache.size > this.config.cacheSize) {
        this.evictOldestEntries();
      }

    } catch (error) {
      console.warn(`Ruflo V3 cache storage failed: ${error.message}`);
    }
  }

  /**
   * Learn from user feedback to improve semantic search
   */
  async learn(learningData: {
    query: string;
    result: ContextResult;
    feedback: UserFeedback;
    timestamp: Date;
  }): Promise<void> {
    try {
      // Update HNSW weights based on feedback
      const embedding = await this.generateEmbedding(learningData.query);

      // Positive feedback increases similarity weights
      const feedbackScore = (
        learningData.feedback.relevance +
        learningData.feedback.completeness +
        learningData.feedback.accuracy
      ) / 3;

      if (feedbackScore > 0.7) {
        // Strengthen positive associations
        this.hnsw.reinforcePositiveAssociation(learningData.query, embedding, feedbackScore);
      } else if (feedbackScore < 0.3) {
        // Weaken negative associations
        this.hnsw.weakenNegativeAssociation(learningData.query, embedding, 1 - feedbackScore);
      }

      // Update cached result quality score
      const cachedResult = this.cache.get(learningData.query);
      if (cachedResult) {
        cachedResult.qualityScore = feedbackScore;
        this.cache.set(learningData.query, cachedResult);
      }

    } catch (error) {
      console.warn(`Ruflo V3 learning failed: ${error.message}`);
    }
  }

  /**
   * Initialize HNSW index for semantic search
   */
  private initializeHNSW(): void {
    this.hnsw = new HNSWIndex({
      dimensions: this.config.hnsw.dimensions,
      efConstruction: this.config.hnsw.efConstruction,
      maxConnections: this.config.hnsw.maxConnections,
      distanceFunction: 'cosine'
    });
  }

  /**
   * Generate semantic embeddings for queries
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    // In production, use actual embedding model (e.g., OpenAI, sentence-transformers)
    // This is a placeholder implementation
    const words = text.toLowerCase().split(/\s+/);
    const embedding = new Array(this.config.hnsw.dimensions).fill(0);

    for (let i = 0; i < words.length && i < embedding.length; i++) {
      embedding[i] = this.hashString(words[i]) / 1000000; // Simple hash-based embedding
    }

    return this.normalizeVector(embedding);
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  }

  private isCacheExpired(cachedResult: CachedResult): boolean {
    return Date.now() - cachedResult.timestamp > cachedResult.ttl;
  }

  private evictOldestEntries(): void {
    const entries = Array.from(this.cache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

    const toDelete = entries.slice(0, Math.floor(this.config.cacheSize * 0.1));
    toDelete.forEach(([key]) => this.cache.delete(key));
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number;
    hitRate: number;
    avgLatency: number;
  } {
    return {
      size: this.cache.size,
      hitRate: 0.75, // Placeholder - track in production
      avgLatency: 45  // Placeholder - track in production
    };
  }
}

interface CachedResult {
  content: any[];
  completeness: number;
  confidence: number;
  timestamp: number;
  ttl: number;
  qualityScore?: number;
}

interface HNSWIndex {
  add(query: string, embedding: number[]): void;
  search(embedding: number[], options: { k: number; ef: number }): Array<{
    query: string;
    distance: number;
    similarity: number;
  }>;
  reinforcePositiveAssociation(query: string, embedding: number[], score: number): void;
  weakenNegativeAssociation(query: string, embedding: number[], score: number): void;
}

// Simplified HNSW implementation placeholder
class HNSWIndex {
  private nodes: Map<string, { embedding: number[]; connections: string[] }> = new Map();

  constructor(private config: {
    dimensions: number;
    efConstruction: number;
    maxConnections: number;
    distanceFunction: string;
  }) {}

  add(query: string, embedding: number[]): void {
    this.nodes.set(query, { embedding, connections: [] });
  }

  search(queryEmbedding: number[], options: { k: number; ef: number }): Array<{
    query: string;
    distance: number;
    similarity: number;
  }> {
    const results: Array<{ query: string; distance: number; similarity: number }> = [];

    for (const [query, node] of this.nodes) {
      const distance = this.cosineSimilarity(queryEmbedding, node.embedding);
      const similarity = 1 - distance;

      results.push({ query, distance, similarity });
    }

    return results
      .sort((a, b) => a.distance - b.distance)
      .slice(0, options.k);
  }

  reinforcePositiveAssociation(query: string, embedding: number[], score: number): void {
    // Placeholder for learning implementation
  }

  weakenNegativeAssociation(query: string, embedding: number[], score: number): void {
    // Placeholder for learning implementation
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    return 1 - (dotProduct / (magnitudeA * magnitudeB));
  }
}
