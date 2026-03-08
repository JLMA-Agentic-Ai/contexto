/**
 * Error Handling Patterns
 * Comprehensive error handling and recovery patterns for bridges
 */
import { BridgeError } from '../types/common.js';
export declare enum ErrorCategory {
    NETWORK = "network",
    AUTHENTICATION = "authentication",
    AUTHORIZATION = "authorization",
    RATE_LIMIT = "rate_limit",
    TIMEOUT = "timeout",
    VALIDATION = "validation",
    BUSINESS_LOGIC = "business_logic",
    RESOURCE = "resource",
    CONFIGURATION = "configuration",
    DEPENDENCY = "dependency",
    SYSTEM = "system",
    UNKNOWN = "unknown"
}
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export interface ErrorContext {
    operation: string;
    bridge: string;
    component?: string;
    userId?: string;
    sessionId?: string;
    requestId?: string;
    parameters?: Record<string, any>;
    environment?: Record<string, any>;
    stackTrace?: string[];
    previousErrors?: BridgeError[];
    timestamp: Date;
}
export interface ErrorRecoveryStrategy {
    type: 'retry' | 'fallback' | 'circuit_breaker' | 'graceful_degradation' | 'fail_fast' | 'custom';
    maxAttempts?: number;
    backoffStrategy?: BackoffStrategy;
    fallbackAction?: () => Promise<any>;
    condition?: (error: BridgeError, attempt: number) => boolean;
    customHandler?: (error: BridgeError, context: ErrorContext) => Promise<any>;
}
export interface BackoffStrategy {
    type: 'fixed' | 'linear' | 'exponential' | 'custom';
    baseDelay: number;
    maxDelay?: number;
    multiplier?: number;
    jitter?: boolean;
    customCalculator?: (attempt: number) => number;
}
export interface ErrorMetrics {
    totalErrors: number;
    errorsByCategory: Record<ErrorCategory, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    errorsByCode: Record<string, number>;
    errorRate: number;
    meanTimeToResolve: number;
    lastError?: BridgeError;
    lastReset: Date;
}
export interface ErrorAlert {
    id: string;
    level: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    error: BridgeError;
    context: ErrorContext;
    actions: ErrorAction[];
    acknowledged: boolean;
    acknowledgedBy?: string;
    acknowledgedAt?: Date;
    resolved: boolean;
    resolvedBy?: string;
    resolvedAt?: Date;
    createdAt: Date;
}
export interface ErrorAction {
    id: string;
    name: string;
    description: string;
    type: 'automatic' | 'manual' | 'escalation';
    execute: (error: BridgeError, context: ErrorContext) => Promise<void>;
    condition?: (error: BridgeError, context: ErrorContext) => boolean;
}
export declare class EnhancedBridgeError extends Error implements BridgeError {
    readonly code: string;
    readonly category: ErrorCategory;
    readonly severity: ErrorSeverity;
    readonly retryable: boolean;
    readonly context: ErrorContext;
    readonly cause?: Error;
    readonly timestamp: Date;
    readonly fingerprint: string;
    constructor(code: string, message: string, category?: ErrorCategory, severity?: ErrorSeverity, context?: Partial<ErrorContext>, cause?: Error);
    private isRetryable;
    private generateFingerprint;
    toJSON(): Record<string, any>;
}
export declare class ErrorHandler {
    private strategies;
    private metrics;
    private alerts;
    constructor();
    registerStrategy(pattern: string, strategy: ErrorRecoveryStrategy): void;
    handleError<T>(error: Error, context: ErrorContext, operation: () => Promise<T>): Promise<T>;
    private enhanceError;
    private categorizeError;
    private assessSeverity;
    private extractErrorCode;
    private selectStrategy;
    private matchesPattern;
    private getDefaultStrategy;
    private retryWithBackoff;
    private calculateBackoffDelay;
    private handleWithCircuitBreaker;
    private handleWithGracefulDegradation;
    private recordError;
    private checkAlertConditions;
    private createAlert;
    private registerDefaultStrategies;
    private sleep;
    getMetrics(bridge?: string): ErrorMetrics | Record<string, ErrorMetrics>;
    getAlerts(): ErrorAlert[];
}
//# sourceMappingURL=ErrorHandling.d.ts.map