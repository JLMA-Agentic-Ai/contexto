/**
 * RLMgw Integration - Live context exploration
 */

import { UserFeedback, ContextResult } from '../contexto-plugin';

export interface RLMgwConfig {
  apiEndpoint: string;
  timeout: number;
}

export interface RLMgwContextRequest {
  maxLatency: number;
}

export class RLMgwIntegration {
  constructor(private config: RLMgwConfig) {}

  /**
   * Get live context from RLMgw with autonomous discovery
   * Targets <5s response time with high completeness
   */
  async getLiveContext(query: string, request: RLMgwContextRequest): Promise<any> {
    const startTime = performance.now();

    try {
      const response = await this.fetchWithTimeout(
        `${this.config.apiEndpoint}/context/live`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            maxLatency: request.maxLatency,
            includeMetadata: true,
            explorationDepth: 'deep'
          })
        },
        request.maxLatency
      );

      const data = await response.json();

      return {
        content: data.context || [],
        completeness: data.completeness || 0.9,
        confidence: data.confidence || 0.8,
        metadata: {
          source: 'rlmgw-live',
          latency: performance.now() - startTime,
          explorationPaths: data.paths || []
        }
      };

    } catch (error) {
      throw new Error(`RLMgw live context failed: ${error.message}`);
    }
  }

  /**
   * Learn from user feedback to improve future context discovery
   */
  async learn(learningData: {
    query: string;
    result: ContextResult;
    feedback: UserFeedback;
    timestamp: Date;
  }): Promise<void> {
    try {
      await this.fetchWithTimeout(
        `${this.config.apiEndpoint}/learning/feedback`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: learningData.query,
            result: {
              completeness: learningData.result.completeness,
              confidence: learningData.result.confidence,
              source: learningData.result.source
            },
            feedback: learningData.feedback,
            timestamp: learningData.timestamp.toISOString(),
            sessionId: this.generateSessionId()
          })
        },
        5000 // Learning timeout
      );
    } catch (error) {
      console.warn(`RLMgw learning failed: ${error.message}`);
      // Non-critical failure - don't throw
    }
  }

  /**
   * Fetch with timeout wrapper
   */
  private async fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private generateSessionId(): string {
    return `rlmgw-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Health check for RLMgw service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.config.apiEndpoint}/health`,
        { method: 'GET' },
        2000
      );
      return response.ok;
    } catch {
      return false;
    }
  }
}
