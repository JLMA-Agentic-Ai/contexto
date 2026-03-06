/**
 * RLMgw Client - Integration with Recursive Language Models Gateway
 *
 * Provides intelligent context selection through RLM autonomous exploration
 * Based on the production RLMgw implementation from base_projects/rlmgw
 */

import { Logger } from '@claude-flow/core';
import axios, { AxiosInstance } from 'axios';

export interface RLMgwConfig {
  enabled: boolean;
  endpoint: string;
  maxExplorationTime: number;
  feedbackIndexing: boolean;
  maxInternalCalls?: number;
  maxContextPackChars?: number;
}

export interface RLMgwResult {
  context: string;
  completeness: number;
  confidence: number;
  files: string[];
  reasoning: string;
  explorationTime: number;
}

export interface ProjectPattern {
  pattern: string;
  confidence: number;
  files: string[];
  description: string;
}

export class RLMgwClient {
  private logger = new Logger('RLMgwClient');
  private client: AxiosInstance;
  private isHealthy = false;

  constructor(private config: RLMgwConfig) {
    this.client = axios.create({
      baseURL: config.endpoint,
      timeout: config.maxExplorationTime * 1000 + 5000, // Add 5s buffer
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'contexto-plugin/1.0.0'
      }
    });
  }

  async initialize(): Promise<void> {
    if (!this.config.enabled) {
      this.logger.info('RLMgw client disabled in configuration');
      return;
    }

    try {
      // Test connection to RLMgw
      const response = await this.client.get('/readyz');
      this.isHealthy = response.status === 200;

      if (this.isHealthy) {
        this.logger.info(`RLMgw client initialized successfully - endpoint: ${this.config.endpoint}`);
      } else {
        this.logger.warn(`RLMgw endpoint responded but may not be fully ready`);
      }
    } catch (error) {
      this.logger.error('Failed to initialize RLMgw client:', error);
      this.isHealthy = false;
      // Don't throw - allow degraded operation
    }
  }

  /**
   * Explore repository context using RLM autonomous exploration
   */
  async explore(query: string, sessionId?: string): Promise<RLMgwResult> {
    if (!this.config.enabled) {
      throw new Error('RLMgw client is disabled');
    }

    if (!this.isHealthy) {
      throw new Error('RLMgw client is not healthy');
    }

    const startTime = Date.now();

    try {
      // Build request in OpenAI-compatible format
      const request = {
        model: 'minimax-m2-1', // Default model for RLMgw
        messages: [
          {
            role: 'user' as const,
            content: query
          }
        ],
        max_tokens: this.config.maxContextPackChars || 12000,
        temperature: 0.1, // Low temperature for deterministic context selection
        // Optional session management
        ...(sessionId && { session_id: sessionId })
      };

      this.logger.debug('Sending exploration request to RLMgw', {
        query: query.substring(0, 100) + '...',
        sessionId
      });

      const response = await this.client.post('/v1/chat/completions', request);

      if (response.status !== 200) {
        throw new Error(`RLMgw returned status ${response.status}: ${response.statusText}`);
      }

      const explorationTime = Date.now() - startTime;

      // Parse RLMgw response
      const content = response.data.choices[0]?.message?.content || '';
      const usage = response.data.usage || {};

      // Extract context information from the response
      // RLMgw includes file paths and reasoning in its responses
      const result = this.parseRLMgwResponse(content, explorationTime);

      this.logger.info(`RLMgw exploration completed`, {
        explorationTime: `${explorationTime}ms`,
        filesFound: result.files.length,
        completeness: result.completeness,
        tokens: usage.total_tokens
      });

      return result;

    } catch (error) {
      this.logger.error('RLMgw exploration failed:', error);

      if (error.response) {
        this.logger.error('RLMgw error response:', {
          status: error.response.status,
          data: error.response.data
        });
      }

      throw new Error(`RLMgw exploration failed: ${error.message}`);
    }
  }

  /**
   * Analyze multiple projects to discover common patterns
   * Inspired by ADW cross-project intelligence
   */
  async analyzeProjectPatterns(projectPaths: string[]): Promise<ProjectPattern[]> {
    const patterns: ProjectPattern[] = [];

    for (const projectPath of projectPaths) {
      try {
        const query = `Analyze the architecture and patterns in project: ${projectPath}. Focus on common patterns, structure, and key components.`;
        const result = await this.explore(query);

        // Extract patterns from the exploration result
        const projectPatterns = this.extractPatternsFromResult(result, projectPath);
        patterns.push(...projectPatterns);

      } catch (error) {
        this.logger.warn(`Failed to analyze project ${projectPath}:`, error);
      }
    }

    // Consolidate similar patterns
    return this.consolidatePatterns(patterns);
  }

  /**
   * Parse RLMgw response to extract structured context information
   */
  private parseRLMgwResponse(content: string, explorationTime: number): RLMgwResult {
    // RLMgw responses typically include file listings and context
    // Extract file paths using regex patterns
    const filePathRegex = /(?:File:|Path:|Found:)\s*([^\n\r]+\.(ts|js|py|md|json|yaml|yml))/gi;
    const files: string[] = [];
    let match;

    while ((match = filePathRegex.exec(content)) !== null) {
      const filePath = match[1].trim();
      if (!files.includes(filePath)) {
        files.push(filePath);
      }
    }

    // Estimate completeness based on content length and file count
    const completeness = Math.min(0.98, // Cap at 98% as per investigation report
      Math.max(0.5, // Minimum 50% for any result
        (content.length / 8000) * 0.7 + (files.length / 10) * 0.3
      )
    );

    // Estimate confidence based on content structure and detail
    const hasStructuredInfo = /(?:class|function|import|export|def)/i.test(content);
    const hasFileStructure = files.length > 0;
    const confidence = Math.min(0.95,
      0.6 + (hasStructuredInfo ? 0.2 : 0) + (hasFileStructure ? 0.15 : 0)
    );

    // Extract reasoning from content (look for explanatory text)
    const reasoningMatch = content.match(/(?:Analysis|Summary|Overview|Context):\s*([^\n\r]{100,500})/i);
    const reasoning = reasoningMatch ? reasoningMatch[1].trim() :
      'RLMgw autonomous exploration provided comprehensive context analysis';

    return {
      context: content,
      completeness,
      confidence,
      files,
      reasoning,
      explorationTime
    };
  }

  /**
   * Extract patterns from exploration result
   */
  private extractPatternsFromResult(result: RLMgwResult, projectPath: string): ProjectPattern[] {
    const patterns: ProjectPattern[] = [];

    // Look for architectural patterns in the content
    const architecturalKeywords = [
      'MVC', 'MVP', 'MVVM', 'REST', 'GraphQL', 'microservice', 'monolith',
      'repository pattern', 'factory pattern', 'singleton', 'observer'
    ];

    for (const keyword of architecturalKeywords) {
      if (result.context.toLowerCase().includes(keyword.toLowerCase())) {
        patterns.push({
          pattern: keyword,
          confidence: 0.8,
          files: result.files.filter(f => f.includes(projectPath)),
          description: `${keyword} pattern detected in project structure`
        });
      }
    }

    return patterns;
  }

  /**
   * Consolidate similar patterns across projects
   */
  private consolidatePatterns(patterns: ProjectPattern[]): ProjectPattern[] {
    const consolidated = new Map<string, ProjectPattern>();

    for (const pattern of patterns) {
      const key = pattern.pattern.toLowerCase();

      if (consolidated.has(key)) {
        const existing = consolidated.get(key)!;
        existing.confidence = Math.max(existing.confidence, pattern.confidence);
        existing.files.push(...pattern.files);
      } else {
        consolidated.set(key, { ...pattern });
      }
    }

    return Array.from(consolidated.values())
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10); // Return top 10 patterns
  }

  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details: any }> {
    try {
      const response = await this.client.get('/readyz', { timeout: 5000 });
      this.isHealthy = response.status === 200;

      return {
        status: this.isHealthy ? 'healthy' : 'unhealthy',
        details: {
          endpoint: this.config.endpoint,
          enabled: this.config.enabled,
          responseTime: Date.now(),
          status: response.status
        }
      };
    } catch (error) {
      this.isHealthy = false;
      return {
        status: 'unhealthy',
        details: {
          endpoint: this.config.endpoint,
          enabled: this.config.enabled,
          error: error.message
        }
      };
    }
  }

  async shutdown(): Promise<void> {
    this.logger.info('RLMgw client shutting down');
    // No persistent connections to close for HTTP client
  }
}
