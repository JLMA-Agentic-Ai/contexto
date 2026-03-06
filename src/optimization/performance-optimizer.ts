/**
 * Performance Optimizer - Targeting 4.75x improvement
 */

export interface PerformanceTargets {
  cacheHitRateTarget: number; // >70%
  cachedResponseTarget: number; // <100ms
  liveExplorationTarget: number; // <5s
}

export interface MetricData {
  query: string;
  latency: number;
  cacheHit: boolean;
  completeness: number;
}

export interface PerformanceMetrics {
  cacheHitRate: number;
  avgCachedLatency: number;
  avgLiveLatency: number;
  avgCompleteness: number;
  performanceImprovement: number;
}

export class PerformanceOptimizer {
  private metrics: MetricData[] = [];
  private baselineMetrics: PerformanceMetrics | null = null;
  private currentMetrics: PerformanceMetrics;

  constructor(private targets: PerformanceTargets) {
    this.currentMetrics = this.initializeMetrics();
  }

  /**
   * Record performance metrics for analysis
   */
  recordMetrics(data: MetricData): void {
    this.metrics.push({
      ...data,
      timestamp: Date.now()
    } as MetricData & { timestamp: number });

    // Keep only last 1000 entries for performance
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }

    // Update current metrics
    this.updateCurrentMetrics();

    // Auto-optimization based on patterns
    this.autoOptimize();
  }

  /**
   * Get current performance metrics
   */
  getCurrentMetrics(): PerformanceMetrics {
    return { ...this.currentMetrics };
  }

  /**
   * Set baseline for performance improvement calculation
   */
  setBaseline(baseline: PerformanceMetrics): void {
    this.baselineMetrics = baseline;
    this.updatePerformanceImprovement();
  }

  /**
   * Get performance optimization recommendations
   */
  getOptimizationRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.currentMetrics.cacheHitRate < this.targets.cacheHitRateTarget) {
      recommendations.push(
        `Cache hit rate (${(this.currentMetrics.cacheHitRate * 100).toFixed(1)}%) ` +
        `below target (${(this.targets.cacheHitRateTarget * 100).toFixed(1)}%). ` +
        `Consider improving semantic similarity thresholds.`
      );
    }

    if (this.currentMetrics.avgCachedLatency > this.targets.cachedResponseTarget) {
      recommendations.push(
        `Cached response latency (${this.currentMetrics.avgCachedLatency.toFixed(1)}ms) ` +
        `exceeds target (${this.targets.cachedResponseTarget}ms). ` +
        `Consider optimizing HNSW parameters or cache storage.`
      );
    }

    if (this.currentMetrics.avgLiveLatency > this.targets.liveExplorationTarget) {
      recommendations.push(
        `Live exploration latency (${(this.currentMetrics.avgLiveLatency / 1000).toFixed(1)}s) ` +
        `exceeds target (${(this.targets.liveExplorationTarget / 1000).toFixed(1)}s). ` +
        `Consider parallel exploration or result streaming.`
      );
    }

    if (this.currentMetrics.avgCompleteness < 0.98) {
      recommendations.push(
        `Context completeness (${(this.currentMetrics.avgCompleteness * 100).toFixed(1)}%) ` +
        `below target (98%). Consider improving merge algorithms.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('🎯 All performance targets achieved! System operating optimally.');
    }

    return recommendations;
  }

  /**
   * Get detailed performance report
   */
  getPerformanceReport(): {
    summary: PerformanceMetrics;
    targets: PerformanceTargets;
    recommendations: string[];
    trends: {
      latencyTrend: 'improving' | 'degrading' | 'stable';
      cacheEfficiency: 'improving' | 'degrading' | 'stable';
      completenessPattern: 'improving' | 'degrading' | 'stable';
    };
  } {
    return {
      summary: this.getCurrentMetrics(),
      targets: this.targets,
      recommendations: this.getOptimizationRecommendations(),
      trends: this.analyzeTrends()
    };
  }

  /**
   * Update current metrics based on recorded data
   */
  private updateCurrentMetrics(): void {
    if (this.metrics.length === 0) {
      return;
    }

    const recent = this.metrics.slice(-100); // Last 100 requests
    const cacheHits = recent.filter(m => m.cacheHit);
    const liveLookups = recent.filter(m => !m.cacheHit);

    this.currentMetrics = {
      cacheHitRate: cacheHits.length / recent.length,
      avgCachedLatency: cacheHits.length > 0
        ? cacheHits.reduce((sum, m) => sum + m.latency, 0) / cacheHits.length
        : 0,
      avgLiveLatency: liveLookups.length > 0
        ? liveLookups.reduce((sum, m) => sum + m.latency, 0) / liveLookups.length
        : 0,
      avgCompleteness: recent.reduce((sum, m) => sum + m.completeness, 0) / recent.length,
      performanceImprovement: this.calculatePerformanceImprovement()
    };

    this.updatePerformanceImprovement();
  }

  /**
   * Calculate overall performance improvement vs baseline
   */
  private calculatePerformanceImprovement(): number {
    if (!this.baselineMetrics) {
      return 1.0; // No baseline set
    }

    const currentScore = this.calculatePerformanceScore(this.currentMetrics);
    const baselineScore = this.calculatePerformanceScore(this.baselineMetrics);

    return baselineScore > 0 ? currentScore / baselineScore : 1.0;
  }

  /**
   * Calculate composite performance score
   */
  private calculatePerformanceScore(metrics: PerformanceMetrics): number {
    // Weighted score: cache hit rate (30%), latency (40%), completeness (30%)
    const cacheScore = metrics.cacheHitRate;
    const latencyScore = Math.min(100 / (metrics.avgCachedLatency || 100), 1); // Lower latency = higher score
    const completenessScore = metrics.avgCompleteness;

    return (cacheScore * 0.3) + (latencyScore * 0.4) + (completenessScore * 0.3);
  }

  /**
   * Auto-optimization based on performance patterns
   */
  private autoOptimize(): void {
    const recommendations = this.getOptimizationRecommendations();

    // Log optimization opportunities
    if (recommendations.length > 1) { // More than just the success message
      console.info('Performance optimization opportunities detected:', recommendations);
    }

    // Auto-adjust cache strategies based on hit rate
    if (this.currentMetrics.cacheHitRate < 0.5) {
      console.warn('Low cache hit rate detected. Consider expanding semantic similarity threshold.');
    }
  }

  /**
   * Analyze performance trends
   */
  private analyzeTrends(): {
    latencyTrend: 'improving' | 'degrading' | 'stable';
    cacheEfficiency: 'improving' | 'degrading' | 'stable';
    completenessPattern: 'improving' | 'degrading' | 'stable';
  } {
    if (this.metrics.length < 50) {
      return {
        latencyTrend: 'stable',
        cacheEfficiency: 'stable',
        completenessPattern: 'stable'
      };
    }

    const recent = this.metrics.slice(-25);
    const older = this.metrics.slice(-50, -25);

    const recentAvgLatency = recent.reduce((sum, m) => sum + m.latency, 0) / recent.length;
    const olderAvgLatency = older.reduce((sum, m) => sum + m.latency, 0) / older.length;

    const recentCacheRate = recent.filter(m => m.cacheHit).length / recent.length;
    const olderCacheRate = older.filter(m => m.cacheHit).length / older.length;

    const recentCompleteness = recent.reduce((sum, m) => sum + m.completeness, 0) / recent.length;
    const olderCompleteness = older.reduce((sum, m) => sum + m.completeness, 0) / older.length;

    return {
      latencyTrend: this.getTrend(recentAvgLatency, olderAvgLatency, true), // Lower is better
      cacheEfficiency: this.getTrend(recentCacheRate, olderCacheRate, false), // Higher is better
      completenessPattern: this.getTrend(recentCompleteness, olderCompleteness, false) // Higher is better
    };
  }

  private getTrend(recent: number, older: number, lowerIsBetter: boolean): 'improving' | 'degrading' | 'stable' {
    const threshold = 0.05; // 5% change threshold
    const change = (recent - older) / older;

    if (Math.abs(change) < threshold) {
      return 'stable';
    }

    const isImproving = lowerIsBetter ? change < 0 : change > 0;
    return isImproving ? 'improving' : 'degrading';
  }

  private updatePerformanceImprovement(): void {
    if (this.baselineMetrics) {
      this.currentMetrics.performanceImprovement = this.calculatePerformanceImprovement();
    }
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      cacheHitRate: 0,
      avgCachedLatency: 0,
      avgLiveLatency: 0,
      avgCompleteness: 0,
      performanceImprovement: 1.0
    };
  }
}
