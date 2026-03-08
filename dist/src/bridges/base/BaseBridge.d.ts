/**
 * Base Bridge Implementation
 * Abstract base class providing common functionality for all integration bridges
 */
import { EventEmitter } from 'events';
import { BaseBridgeConfig, BridgeEvent, BridgeResult, CircuitBreakerState, CircuitBreakerConfig, HealthStatus, Subscription, BridgeMetrics } from '../types/common.js';
export declare abstract class BaseBridge extends EventEmitter {
    protected config: BaseBridgeConfig;
    protected circuitBreakerState: CircuitBreakerState;
    protected circuitBreakerConfig: CircuitBreakerConfig;
    protected failureCount: number;
    protected lastFailureTime?: Date;
    protected subscriptions: Map<string, Subscription>;
    protected metrics: BridgeMetrics;
    protected healthStatus: HealthStatus;
    constructor(config: BaseBridgeConfig, circuitBreakerConfig?: CircuitBreakerConfig);
    abstract connect(): Promise<void>;
    abstract disconnect(): Promise<void>;
    abstract isConnected(): boolean;
    abstract performHealthCheck(): Promise<HealthStatus>;
    protected executeWithCircuitBreaker<T>(operation: () => Promise<T>): Promise<BridgeResult<T>>;
    protected executeWithRetry<T>(operation: () => Promise<T>, maxRetries?: number): Promise<BridgeResult<T>>;
    subscribe(topics: string[], handler: (event: BridgeEvent) => void | Promise<void>, filter?: (event: BridgeEvent) => boolean): string;
    unsubscribe(subscriptionId: string): boolean;
    protected publishEvent<T>(event: BridgeEvent<T>): Promise<void>;
    updateConfig(updates: Partial<BaseBridgeConfig>): void;
    getConfig(): BaseBridgeConfig;
    getMetrics(): BridgeMetrics;
    getHealthStatus(): HealthStatus;
    private shouldAttemptReset;
    private onSuccess;
    private onFailure;
    private createError;
    private handleError;
    private calculateBackoffDelay;
    private sleep;
    private matchesTopics;
    private updateAverageResponseTime;
    private setupHealthCheck;
}
//# sourceMappingURL=BaseBridge.d.ts.map