/**
 * Memory Integration - Advanced memory patterns for cross-session learning
 *
 * Implements sophisticated memory management inspired by ADW skills:
 * - Feedback indexing (RLMgw results → Ruflo V3)
 * - Cross-project pattern recognition
 * - Adaptive namespace organization
 * - Persistent learning optimization
 */

import { Logger } from '@claude-flow/core';
import { RLMgwResult } from '../clients/rlmgw-client';
import { RufloV3Client, MemoryStoreRequest } from '../clients/ruflo-v3-client';

export interface MemoryConfig {
  namespaceStrategy: 'project' | 'domain' | 'mixed';
  persistentLearning: boolean;
  crossSessionEnabled: boolean;
}

export interface LearningPattern {
  pattern: string;
  frequency: number;
  confidence: number;
  contexts: string[];
  lastSeen: Date;
}

export interface MemoryNamespace {
  name: string;
  description: string;
  entryCount: number;
  averageConfidence: number;
}

export class MemoryIntegration {
  private logger = new Logger('MemoryIntegration');
  private rufloClient?: RufloV3Client;
  private learningPatterns = new Map<string, LearningPattern>();
  private namespaceStats = new Map<string, MemoryNamespace>();

  constructor(private config: MemoryConfig) {}

  async initialize(): Promise<void> {
    this.logger.info('Memory integration initializing', { config: this.config });

    if (this.config.persistentLearning) {
      await this.loadExistingPatterns();
    }

    this.logger.info('Memory integration ready');
  }

  /**
   * Set Ruflo V3 client for memory operations
   */
  setRufloClient(client: RufloV3Client): void {
    this.rufloClient = client;
  }

  /**
   * Index RLMgw exploration results into Ruflo V3 memory
   * This enables cross-session learning and improves cache hit rates
   */
  async indexRLMgwResults(result: RLMgwResult, originalQuery: string): Promise<void> {
    if (!this.rufloClient) {
      this.logger.warn('Ruflo V3 client not available for indexing');
      return;
    }

    try {
      // Generate memory key based on query and context
      const memoryKey = this.generateMemoryKey(originalQuery, result);

      // Determine namespace using configured strategy
      const namespace = this.determineNamespace(originalQuery, result);

      // Create comprehensive memory entry
      const memoryEntry: MemoryStoreRequest = {
        key: memoryKey,
        value: this.buildContextValue(result, originalQuery),
        namespace,
        tags: this.generateTags(result, originalQuery),
        ttl: this.calculateTTL(result.confidence)
      };

      // Store in Ruflo V3 memory
      await this.rufloClient.storeContext(memoryEntry);

      // Update learning patterns
      if (this.config.persistentLearning) {
        await this.updateLearningPatterns(originalQuery, result);
      }

      // Update namespace statistics
      this.updateNamespaceStats(namespace, result.confidence);

      this.logger.info('Successfully indexed RLMgw result', {
        key: memoryKey,
        namespace,
        confidence: result.confidence,
        filesCount: result.files.length
      });

    } catch (error) {
      this.logger.error('Failed to index RLMgw result:', error);
    }
  }

  /**
   * Store project patterns discovered through cross-project analysis
   */
  async storeProjectPatterns(patterns: any[]): Promise<void> {
    if (!this.rufloClient) {
      return;
    }

    const requests: MemoryStoreRequest[] = patterns.map(pattern => ({
      key: `pattern-${pattern.pattern.toLowerCase().replace(/\\s+/g, '-')}`,
      value: JSON.stringify(pattern),
      namespace: 'architecture-patterns',
      tags: ['pattern', 'cross-project', 'architecture'],
      ttl: 86400 * 30 // 30 days for patterns
    }));

    await this.rufloClient.batchStoreContext(requests);

    this.logger.info(`Stored ${patterns.length} project patterns`);
  }

  /**
   * Optimize memory organization based on usage patterns
   */
  async optimizeNamespaces(): Promise<void> {
    if (!this.config.persistentLearning) {
      return;
    }

    // Analyze namespace effectiveness
    const stats = Array.from(this.namespaceStats.values());

    // Identify underperforming namespaces
    const lowPerformingNamespaces = stats.filter(
      ns => ns.entryCount > 50 && ns.averageConfidence < 0.6
    );

    if (lowPerformingNamespaces.length > 0) {
      this.logger.info('Detected underperforming namespaces', {
        count: lowPerformingNamespaces.length,
        namespaces: lowPerformingNamespaces.map(ns => ns.name)
      });

      // In a full implementation, this would:
      // 1. Re-categorize memory entries
      // 2. Merge similar namespaces
      // 3. Split large namespaces by domain
      // 4. Update namespace strategy
    }

    // Identify high-performing patterns
    const topPatterns = Array.from(this.learningPatterns.values())
      .sort((a, b) => b.frequency * b.confidence - a.frequency * a.confidence)
      .slice(0, 10);

    this.logger.info('Top learning patterns identified', {
      patterns: topPatterns.map(p => ({ pattern: p.pattern, score: p.frequency * p.confidence }))
    });
  }

  /**
   * Generate memory key for consistent indexing
   */
  private generateMemoryKey(query: string, result: RLMgwResult): string {
    // Create a deterministic key based on query semantics
    const queryHash = this.hashString(query.toLowerCase().trim());
    const contextHash = this.hashString(result.files.join(','));

    return `rlmgw-${queryHash}-${contextHash}`;
  }

  /**
   * Determine appropriate namespace based on strategy
   */
  private determineNamespace(query: string, result: RLMgwResult): string {
    switch (this.config.namespaceStrategy) {
      case 'project':
        // Use project name from file paths
        const projectPath = result.files[0] || '';
        const projectMatch = projectPath.match(/\\/([^\\/]+)\\/[^\\/]*$/);
        return projectMatch ? `project-${projectMatch[1]}` : 'default-project';

      case 'domain':
        // Classify by domain/topic
        if (this.isDatabaseQuery(query)) return 'database-patterns';
        if (this.isAuthQuery(query)) return 'auth-patterns';
        if (this.isAPIQuery(query)) return 'api-patterns';
        if (this.isTestingQuery(query)) return 'testing-patterns';
        return 'general-patterns';

      case 'mixed':
        // Hybrid approach - project + domain
        const project = this.determineNamespace(query, result);
        const domain = this.determineNamespace(query, result);
        return `${project}-${domain}`.replace('project-', '');

      default:
        return 'contexto-default';
    }
  }

  /**
   * Build comprehensive context value for memory storage
   */
  private buildContextValue(result: RLMgwResult, originalQuery: string): string {
    const metadata = {
      originalQuery,
      explorationTime: result.explorationTime,
      confidence: result.confidence,
      completeness: result.completeness,
      files: result.files,
      reasoning: result.reasoning,
      indexed: new Date().toISOString()
    };

    return JSON.stringify({
      context: result.context,
      metadata
    });
  }

  /**
   * Generate relevant tags for memory entry
   */
  private generateTags(result: RLMgwResult, query: string): string[] {
    const tags = ['rlmgw-indexed', 'contexto-plugin'];

    // Add domain-specific tags
    if (this.isCodeQuery(query)) tags.push('source-code');
    if (this.isArchitectureQuery(query)) tags.push('architecture');
    if (this.isDocumentationQuery(query)) tags.push('documentation');

    // Add confidence-based tags
    if (result.confidence > 0.8) tags.push('high-confidence');
    else if (result.confidence > 0.5) tags.push('medium-confidence');
    else tags.push('low-confidence');

    // Add file-type tags
    const fileExtensions = new Set(
      result.files.map(f => f.split('.').pop()).filter(Boolean)
    );
    fileExtensions.forEach(ext => tags.push(`filetype-${ext}`));

    return tags;
  }

  /**
   * Calculate TTL based on result confidence
   */
  private calculateTTL(confidence: number): number {
    // Higher confidence = longer TTL
    const baseTTL = 86400; // 1 day in seconds
    const maxTTL = 86400 * 30; // 30 days

    return Math.min(maxTTL, baseTTL * (1 + confidence * 10));
  }

  /**
   * Update learning patterns based on query and result
   */
  private async updateLearningPatterns(query: string, result: RLMgwResult): Promise<void> {
    const patternKey = this.extractPattern(query);

    if (this.learningPatterns.has(patternKey)) {
      const pattern = this.learningPatterns.get(patternKey)!;
      pattern.frequency++;
      pattern.confidence = (pattern.confidence + result.confidence) / 2; // Average
      pattern.lastSeen = new Date();
      pattern.contexts.push(result.context.substring(0, 200) + '...');

      // Keep only recent contexts (max 5)
      if (pattern.contexts.length > 5) {
        pattern.contexts = pattern.contexts.slice(-5);
      }
    } else {
      this.learningPatterns.set(patternKey, {
        pattern: patternKey,
        frequency: 1,
        confidence: result.confidence,
        contexts: [result.context.substring(0, 200) + '...'],
        lastSeen: new Date()
      });
    }
  }

  /**
   * Extract pattern from query for learning
   */
  private extractPattern(query: string): string {
    // Normalize query to identify patterns
    return query
      .toLowerCase()
      .replace(/\\b(find|search|show|get|list)\\b/g, 'QUERY')
      .replace(/\\b(function|method|class|component)\\b/g, 'CODE_ELEMENT')
      .replace(/\\b(auth|authentication|login|session)\\b/g, 'AUTH')
      .replace(/\\b(database|db|sql|query)\\b/g, 'DATABASE')
      .replace(/\\s+/g, ' ')
      .trim();
  }

  /**
   * Update namespace statistics
   */
  private updateNamespaceStats(namespace: string, confidence: number): void {
    if (this.namespaceStats.has(namespace)) {
      const stats = this.namespaceStats.get(namespace)!;
      stats.entryCount++;
      stats.averageConfidence = (stats.averageConfidence + confidence) / 2;
    } else {
      this.namespaceStats.set(namespace, {
        name: namespace,
        description: `Auto-generated namespace: ${namespace}`,
        entryCount: 1,
        averageConfidence: confidence
      });
    }
  }

  // Query classification helpers
  private isDatabaseQuery(query: string): boolean {
    return /\\b(database|db|sql|query|table|schema|migration)\\b/i.test(query);
  }

  private isAuthQuery(query: string): boolean {
    return /\\b(auth|authentication|login|session|jwt|oauth|permission)\\b/i.test(query);
  }

  private isAPIQuery(query: string): boolean {
    return /\\b(api|endpoint|route|rest|graphql|controller)\\b/i.test(query);
  }

  private isTestingQuery(query: string): boolean {
    return /\\b(test|spec|mock|assert|describe|it\\s+should)\\b/i.test(query);
  }

  private isCodeQuery(query: string): boolean {
    return /\\b(function|method|class|component|module|import)\\b/i.test(query);
  }

  private isArchitectureQuery(query: string): boolean {
    return /\\b(architecture|pattern|design|structure|overview|diagram)\\b/i.test(query);
  }

  private isDocumentationQuery(query: string): boolean {
    return /\\b(documentation|docs|readme|guide|tutorial)\\b/i.test(query);
  }

  /**
   * Simple hash function for generating deterministic keys
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Load existing patterns from persistent storage
   */
  private async loadExistingPatterns(): Promise<void> {
    // In a real implementation, this would load from persistent storage
    // For now, initialize with empty patterns
    this.learningPatterns.clear();
    this.logger.debug('Learning patterns initialized');
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    return {
      status: 'healthy',
      details: {
        config: this.config,
        patternsCount: this.learningPatterns.size,
        namespacesCount: this.namespaceStats.size,
        rufloClientAvailable: !!this.rufloClient
      }
    };
  }
}
