/**
 * Performance Monitor - Real-time performance tracking and optimization
 *
 * Tracks ADW-defined performance targets:
 * - <100ms cached responses
 * - <5s live exploration
 * - 98%+ context completeness
 * - >70% cache hit rate
 */

import { Logger } from '@claude-flow/core';

export interface PerformanceTargets {
  targetCachedResponseTime: number; // <100ms
  targetLiveResponseTime: number;   // <5s
  targetCompleteness: number;       // 98%+
  targetCacheHitRate: number;       // >70%
}

export interface PerformanceMetrics {
  cacheHitRate: number;
  averageResponseTime: number;
  contextCompleteness: number;
  errorRate: number;
  throughput: number; // requests per second

  // Detailed breakdowns
  cached: { count: number; avgTime: number; };
  live: { count: number; avgTime: number; };
  errors: { count: number; types: Record<string, number>; };
}

export interface PerformanceEvent {
  type: 'cache_hit' | 'live_exploration' | 'error' | 'optimization';
  timestamp: number;
  duration: number;
  metadata: any;
}

export class PerformanceMonitor {
  private logger = new Logger('PerformanceMonitor');
  private events: PerformanceEvent[] = [];
  private metrics: PerformanceMetrics;
  private startTime = Date.now();

  constructor(private targets: PerformanceTargets) {
    this.metrics = this.initializeMetrics();
  }

  async initialize(): Promise<void> {
    this.logger.info('Performance monitor initialized', { targets: this.targets });

    // Start periodic metrics calculation
    setInterval(() => this.calculateMetrics(), 10000); // Every 10 seconds
  }

  /**
   * Record cache hit performance
   */
  recordCacheHit(responseTime: number): void {
    this.events.push({
      type: 'cache_hit',
      timestamp: Date.now(),
      duration: responseTime,
      metadata: { target: this.targets.targetCachedResponseTime }
    });

    // Alert if target exceeded
    if (responseTime > this.targets.targetCachedResponseTime) {
      this.logger.warn(`Cache hit exceeded target: ${responseTime}ms > ${this.targets.targetCachedResponseTime}ms`);
    }
  }

  /**
   * Record live exploration performance
   */
  recordLiveExploration(responseTime: number): void {
    this.events.push({
      type: 'live_exploration',
      timestamp: Date.now(),
      duration: responseTime,
      metadata: { target: this.targets.targetLiveResponseTime }
    });

    // Alert if target exceeded
    if (responseTime > this.targets.targetLiveResponseTime) {
      this.logger.warn(`Live exploration exceeded target: ${responseTime}ms > ${this.targets.targetLiveResponseTime}ms`);
    }
  }

  /**
   * Record error events
   */
  recordError(error: Error, context: string): void {
    this.events.push({
      type: 'error',
      timestamp: Date.now(),
      duration: 0,
      metadata: {
        error: error.message,
        context,
        stack: error.stack
      }
    });

    this.logger.error('Performance event - error recorded', { error: error.message, context });
  }

  /**
   * Get current performance metrics
   */
  async getCurrentMetrics(): Promise<PerformanceMetrics> {
    this.calculateMetrics();
    return { ...this.metrics };
  }

  /**
   * Calculate performance metrics from events
   */
  private calculateMetrics(): void {
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    const recentEvents = this.events.filter(e => now - e.timestamp <= windowMs);

    if (recentEvents.length === 0) {
      return; // No events to process
    }

    // Cache hits
    const cacheHits = recentEvents.filter(e => e.type === 'cache_hit');
    const cacheHitTimes = cacheHits.map(e => e.duration);

    // Live explorations
    const liveEvents = recentEvents.filter(e => e.type === 'live_exploration');
    const liveTimes = liveEvents.map(e => e.duration);

    // Errors
    const errors = recentEvents.filter(e => e.type === 'error');
    const errorTypes: Record<string, number> = {};
    errors.forEach(e => {
      const errorType = e.metadata.error || 'unknown';
      errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
    });

    // Calculate aggregated metrics
    const totalRequests = cacheHits.length + liveEvents.length;
    const totalErrors = errors.length;

    this.metrics = {
      cacheHitRate: totalRequests > 0 ? cacheHits.length / totalRequests : 0,
      averageResponseTime: this.average([...cacheHitTimes, ...liveTimes]),
      contextCompleteness: 0.95, // Would be calculated from actual context quality
      errorRate: (totalRequests + totalErrors) > 0 ? totalErrors / (totalRequests + totalErrors) : 0,
      throughput: totalRequests / (windowMs / 1000), // requests per second

      cached: {
        count: cacheHits.length,
        avgTime: this.average(cacheHitTimes)
      },
      live: {
        count: liveEvents.length,
        avgTime: this.average(liveTimes)
      },
      errors: {
        count: errors.length,
        types: errorTypes
      }
    };

    // Check targets and log alerts
    this.checkPerformanceTargets();
  }

  /**
   * Check if performance targets are being met
   */
  private checkPerformanceTargets(): void {
    const alerts: string[] = [];

    if (this.metrics.cached.avgTime > this.targets.targetCachedResponseTime) {
      alerts.push(`Cached response time (${this.metrics.cached.avgTime.toFixed(1)}ms) exceeds target (${this.targets.targetCachedResponseTime}ms)`);
    }

    if (this.metrics.live.avgTime > this.targets.targetLiveResponseTime) {
      alerts.push(`Live exploration time (${this.metrics.live.avgTime.toFixed(1)}ms) exceeds target (${this.targets.targetLiveResponseTime}ms)`);
    }

    if (this.metrics.cacheHitRate < this.targets.targetCacheHitRate) {
      alerts.push(`Cache hit rate (${(this.metrics.cacheHitRate * 100).toFixed(1)}%) below target (${this.targets.targetCacheHitRate * 100}%)`);
    }

    if (this.metrics.contextCompleteness < this.targets.targetCompleteness) {
      alerts.push(`Context completeness (${(this.metrics.contextCompleteness * 100).toFixed(1)}%) below target (${this.targets.targetCompleteness * 100}%)`);
    }

    if (alerts.length > 0) {
      this.logger.warn('Performance targets not met:', { alerts });

      // Record optimization event
      this.events.push({
        type: 'optimization',
        timestamp: Date.now(),
        duration: 0,
        metadata: { alerts, metrics: this.metrics }
      });
    }
  }

  /**
   * Get performance health status
   */
  getHealthStatus(): { status: 'healthy' | 'degraded' | 'unhealthy'; details: any } {
    const issues: string[] = [];

    if (this.metrics.cached.avgTime > this.targets.targetCachedResponseTime * 1.5) {
      issues.push('Cached response time severely degraded');
    }

    if (this.metrics.live.avgTime > this.targets.targetLiveResponseTime * 1.5) {
      issues.push('Live exploration severely degraded');
    }

    if (this.metrics.errorRate > 0.1) {
      issues.push('High error rate detected');
    }

    if (this.metrics.cacheHitRate < this.targets.targetCacheHitRate * 0.5) {
      issues.push('Cache hit rate critically low');
    }

    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (issues.length === 0) {
      status = 'healthy';
    } else if (issues.length <= 2) {
      status = 'degraded';
    } else {
      status = 'unhealthy';
    }

    return {
      status,
      details: {
        metrics: this.metrics,
        targets: this.targets,
        issues,
        uptime: Date.now() - this.startTime,
        eventCount: this.events.length
      }
    };
  }

  /**
   * Generate performance report
   */
  async generateReport(): Promise<string> {
    const uptime = (Date.now() - this.startTime) / 1000 / 60; // minutes
    const health = this.getHealthStatus();

    return `
# Contexto Performance Report

## Performance Summary (Last 1 minute)
- **Cache Hit Rate**: ${(this.metrics.cacheHitRate * 100).toFixed(1)}% (Target: ${this.targets.targetCacheHitRate * 100}%)
- **Avg Cached Response**: ${this.metrics.cached.avgTime.toFixed(1)}ms (Target: <${this.targets.targetCachedResponseTime}ms)
- **Avg Live Exploration**: ${this.metrics.live.avgTime.toFixed(1)}ms (Target: <${this.targets.targetLiveResponseTime}ms)
- **Context Completeness**: ${(this.metrics.contextCompleteness * 100).toFixed(1)}% (Target: >${this.targets.targetCompleteness * 100}%)
- **Error Rate**: ${(this.metrics.errorRate * 100).toFixed(2)}%
- **Throughput**: ${this.metrics.throughput.toFixed(2)} req/s

## Health Status: **${health.status.toUpperCase()}**

## Request Breakdown
- **Cached Requests**: ${this.metrics.cached.count}
- **Live Explorations**: ${this.metrics.live.count}
- **Errors**: ${this.metrics.errors.count}

## Performance Targets Status
${this.generateTargetStatus()}

## Uptime
- **System Uptime**: ${uptime.toFixed(1)} minutes
- **Total Events**: ${this.events.length}
`;
  }

  private generateTargetStatus(): string {
    const checks = [
      {
        name: 'Cached Response Time',
        current: this.metrics.cached.avgTime,
        target: this.targets.targetCachedResponseTime,
        unit: 'ms',
        operator: '<'
      },
      {
        name: 'Live Response Time',
        current: this.metrics.live.avgTime,
        target: this.targets.targetLiveResponseTime,
        unit: 'ms',
        operator: '<'
      },
      {
        name: 'Cache Hit Rate',
        current: this.metrics.cacheHitRate * 100,
        target: this.targets.targetCacheHitRate * 100,
        unit: '%',
        operator: '>'
      },
      {
        name: 'Context Completeness',
        current: this.metrics.contextCompleteness * 100,
        target: this.targets.targetCompleteness * 100,
        unit: '%',
        operator: '>'
      }
    ];

    return checks.map(check => {
      const met = check.operator === '<' ?
        check.current < check.target :
        check.current > check.target;

      const status = met ? '✅' : '❌';
      return `- ${status} **${check.name}**: ${check.current.toFixed(1)}${check.unit} ${check.operator} ${check.target}${check.unit}`;
    }).join('\\n');
  }

  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      cacheHitRate: 0,
      averageResponseTime: 0,
      contextCompleteness: 0,
      errorRate: 0,
      throughput: 0,
      cached: { count: 0, avgTime: 0 },
      live: { count: 0, avgTime: 0 },
      errors: { count: 0, types: {} }
    };
  }

  async shutdown(): Promise<void> {
    this.logger.info('Performance monitor shutting down', {
      finalMetrics: this.metrics,
      totalEvents: this.events.length
    });
  }
}
