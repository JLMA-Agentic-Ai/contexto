/**
 * Common Bridge Types and Interfaces
 * Shared types across all integration bridges
 */
export interface BaseBridgeConfig {
    name: string;
    version: string;
    enabled: boolean;
    timeout: number;
    retryAttempts: number;
    circuitBreakerThreshold: number;
    healthCheckInterval: number;
}
export interface BridgeEvent<T = unknown> {
    id: string;
    type: string;
    source: string;
    timestamp: Date;
    data: T;
    metadata?: Record<string, any>;
    correlationId?: string;
    traceId?: string;
}
export interface StreamConfig {
    type: 'websocket' | 'sse' | 'polling';
    url: string;
    reconnectAttempts: number;
    reconnectDelay: number;
    heartbeatInterval?: number;
    auth?: {
        type: 'bearer' | 'api-key' | 'custom';
        token?: string;
        headers?: Record<string, string>;
    };
}
export declare enum CircuitBreakerState {
    CLOSED = "closed",
    OPEN = "open",
    HALF_OPEN = "half_open"
}
export interface CircuitBreakerConfig {
    failureThreshold: number;
    resetTimeout: number;
    monitoringPeriod: number;
    expectedErrors?: string[];
}
export interface BridgeError extends Error {
    code: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    retryable: boolean;
    context?: Record<string, any>;
    timestamp: Date;
}
export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    lastCheck: Date;
    details?: Record<string, any>;
    metrics?: {
        responseTime: number;
        errorRate: number;
        throughput: number;
    };
}
export interface Evidence {
    id: string;
    type: 'observation' | 'hypothesis' | 'test' | 'conclusion';
    source: string;
    timestamp: Date;
    data: any;
    confidence: number;
    tags: string[];
    relationships?: {
        supports?: string[];
        contradicts?: string[];
        dependsOn?: string[];
    };
}
export interface BridgeResult<T> {
    success: boolean;
    data?: T;
    error?: BridgeError;
    metadata?: {
        duration: number;
        retryCount: number;
        circuitBreakerState: CircuitBreakerState;
    };
}
export interface Subscription {
    id: string;
    topics: string[];
    filter?: (event: BridgeEvent) => boolean;
    handler: (event: BridgeEvent) => void | Promise<void>;
    active: boolean;
    createdAt: Date;
    lastTriggered?: Date;
}
export interface RateLimitConfig {
    requests: number;
    window: number;
    strategy: 'fixed-window' | 'sliding-window' | 'token-bucket';
}
export interface BridgeMetrics {
    requestCount: number;
    errorCount: number;
    averageResponseTime: number;
    circuitBreakerTrips: number;
    lastResetTime: Date;
    customMetrics?: Record<string, number>;
}
//# sourceMappingURL=common.d.ts.map