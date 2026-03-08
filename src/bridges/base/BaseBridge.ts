/**
 * Base Bridge Implementation
 * Abstract base class providing common functionality for all integration bridges
 */

import { EventEmitter } from 'events';
import {
  BaseBridgeConfig,
  BridgeEvent,
  BridgeError,
  BridgeResult,
  CircuitBreakerState,
  CircuitBreakerConfig,
  HealthStatus,
  StreamConfig,
  Subscription,
  BridgeMetrics
} from '../types/common.js';

export abstract class BaseBridge extends EventEmitter {
  protected config: BaseBridgeConfig;
  protected circuitBreakerState: CircuitBreakerState = CircuitBreakerState.CLOSED;
  protected circuitBreakerConfig: CircuitBreakerConfig;
  protected failureCount: number = 0;
  protected lastFailureTime?: Date;
  protected subscriptions: Map<string, Subscription> = new Map();
  protected metrics: BridgeMetrics;
  protected healthStatus: HealthStatus = {
    status: 'healthy',
    lastCheck: new Date()
  };

  constructor(config: BaseBridgeConfig, circuitBreakerConfig?: CircuitBreakerConfig) {
    super();
    this.config = config;
    this.circuitBreakerConfig = circuitBreakerConfig || {
      failureThreshold: 5,
      resetTimeout: 30000,
      monitoringPeriod: 60000,
      expectedErrors: ['TIMEOUT', 'RATE_LIMITED']
    };
    this.metrics = {
      requestCount: 0,
      errorCount: 0,
      averageResponseTime: 0,
      circuitBreakerTrips: 0,
      lastResetTime: new Date()
    };

    this.setupHealthCheck();
  }

  // Abstract methods that must be implemented by concrete bridges
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract isConnected(): boolean;
  abstract performHealthCheck(): Promise<HealthStatus>;

  // Circuit breaker implementation
  protected async executeWithCircuitBreaker<T>(
    operation: () => Promise<T>
  ): Promise<BridgeResult<T>> {
    const startTime = Date.now();

    if (this.circuitBreakerState === CircuitBreakerState.OPEN) {
      if (this.shouldAttemptReset()) {
        this.circuitBreakerState = CircuitBreakerState.HALF_OPEN;
      } else {
        return {
          success: false,
          error: this.createError('CIRCUIT_BREAKER_OPEN', 'Circuit breaker is open'),
          metadata: {
            duration: Date.now() - startTime,
            retryCount: 0,
            circuitBreakerState: this.circuitBreakerState
          }
        };
      }
    }

    try {
      const result = await operation();
      const duration = Date.now() - startTime;

      this.onSuccess(duration);

      return {
        success: true,
        data: result,
        metadata: {
          duration,
          retryCount: 0,
          circuitBreakerState: this.circuitBreakerState
        }
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const bridgeError = this.handleError(error as Error);

      this.onFailure(bridgeError, duration);

      return {
        success: false,
        error: bridgeError,
        metadata: {
          duration,
          retryCount: 0,
          circuitBreakerState: this.circuitBreakerState
        }
      };
    }
  }

  // Retry mechanism with exponential backoff
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries?: number
  ): Promise<BridgeResult<T>> {
    const retries = maxRetries || this.config.retryAttempts;
    let lastError: BridgeError;

    for (let attempt = 0; attempt <= retries; attempt++) {
      const result = await this.executeWithCircuitBreaker(operation);

      if (result.success || !result.error?.retryable) {
        if (result.metadata) {
          result.metadata.retryCount = attempt;
        }
        return result;
      }

      lastError = result.error;

      if (attempt < retries) {
        const delay = this.calculateBackoffDelay(attempt);
        await this.sleep(delay);
      }
    }

    return {
      success: false,
      error: lastError!,
      metadata: {
        duration: 0,
        retryCount: retries,
        circuitBreakerState: this.circuitBreakerState
      }
    };
  }

  // Event subscription management
  public subscribe(
    topics: string[],
    handler: (event: BridgeEvent) => void | Promise<void>,
    filter?: (event: BridgeEvent) => boolean
  ): string {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const subscription: Subscription = {
      id: subscriptionId,
      topics,
      handler,
      filter,
      active: true,
      createdAt: new Date()
    };

    this.subscriptions.set(subscriptionId, subscription);

    // TODO: Implement topic-based routing

    return subscriptionId;
  }

  public unsubscribe(subscriptionId: string): boolean {
    return this.subscriptions.delete(subscriptionId);
  }

  // Event publishing
  protected async publishEvent<T>(event: BridgeEvent<T>): Promise<void> {
    for (const [id, subscription] of this.subscriptions) {
      if (subscription.active && this.matchesTopics(event, subscription.topics)) {
        if (!subscription.filter || subscription.filter(event)) {
          try {
            await subscription.handler(event);
            subscription.lastTriggered = new Date();
          } catch (error) {
            this.emit('subscription-error', {
              subscriptionId: id,
              event,
              error
            });
          }
        }
      }
    }
  }

  // Configuration management
  public updateConfig(updates: Partial<BaseBridgeConfig>): void {
    this.config = { ...this.config, ...updates };
    this.emit('config-updated', this.config);
  }

  public getConfig(): BaseBridgeConfig {
    return { ...this.config };
  }

  // Metrics and monitoring
  public getMetrics(): BridgeMetrics {
    return { ...this.metrics };
  }

  public getHealthStatus(): HealthStatus {
    return { ...this.healthStatus };
  }

  // Private helper methods
  private shouldAttemptReset(): boolean {
    if (!this.lastFailureTime) return true;

    const timeSinceFailure = Date.now() - this.lastFailureTime.getTime();
    return timeSinceFailure >= this.circuitBreakerConfig.resetTimeout;
  }

  private onSuccess(duration: number): void {
    this.metrics.requestCount++;
    this.updateAverageResponseTime(duration);

    if (this.circuitBreakerState === CircuitBreakerState.HALF_OPEN) {
      this.circuitBreakerState = CircuitBreakerState.CLOSED;
      this.failureCount = 0;
      this.emit('circuit-breaker-closed');
    }
  }

  private onFailure(error: BridgeError, duration: number): void {
    this.metrics.requestCount++;
    this.metrics.errorCount++;
    this.updateAverageResponseTime(duration);

    if (!this.circuitBreakerConfig.expectedErrors?.includes(error.code)) {
      this.failureCount++;
      this.lastFailureTime = new Date();

      if (this.failureCount >= this.circuitBreakerConfig.failureThreshold) {
        this.circuitBreakerState = CircuitBreakerState.OPEN;
        this.metrics.circuitBreakerTrips++;
        this.emit('circuit-breaker-opened', error);
      }
    }
  }

  private createError(code: string, message: string, context?: any): BridgeError {
    const error = new Error(message) as BridgeError;
    error.code = code;
    error.severity = 'medium';
    error.retryable = true;
    error.context = context;
    error.timestamp = new Date();
    return error;
  }

  private handleError(error: Error): BridgeError {
    if ('code' in error) {
      return error as BridgeError;
    }

    const bridgeError = error as BridgeError;
    bridgeError.code = 'UNKNOWN_ERROR';
    bridgeError.severity = 'medium';
    bridgeError.retryable = true;
    bridgeError.timestamp = new Date();

    return bridgeError;
  }

  private calculateBackoffDelay(attempt: number): number {
    const baseDelay = 1000; // 1 second
    return baseDelay * Math.pow(2, attempt) + Math.random() * 1000; // Exponential backoff with jitter
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private matchesTopics(event: BridgeEvent, topics: string[]): boolean {
    return topics.some(topic => {
      if (topic.includes('*')) {
        const pattern = topic.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(event.type);
      }
      return event.type === topic;
    });
  }

  private updateAverageResponseTime(newDuration: number): void {
    const count = this.metrics.requestCount;
    const currentAvg = this.metrics.averageResponseTime;
    this.metrics.averageResponseTime = (currentAvg * (count - 1) + newDuration) / count;
  }

  private setupHealthCheck(): void {
    setInterval(async () => {
      try {
        this.healthStatus = await this.performHealthCheck();
        this.emit('health-check', this.healthStatus);
      } catch (error) {
        this.healthStatus = {
          status: 'unhealthy',
          lastCheck: new Date(),
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        };
        this.emit('health-check-failed', error);
      }
    }, this.config.healthCheckInterval);
  }
}