/**
 * Circuit Breaker Security for 6-Component Platform Integration
 * Implements security-enhanced circuit breaker patterns to prevent cascade failures
 * and protect against malicious attacks
 *
 * Security Features:
 * - Rate limiting with exponential backoff
 * - Threat detection and automatic isolation
 * - Component health monitoring with security metrics
 * - Cascade failure prevention
 * - Attack pattern recognition
 */
import { EventEmitter } from 'events';
import { SecurityAuditLogger } from './audit-logger';
export interface CircuitBreakerConfig {
    failureThreshold: number;
    successThreshold: number;
    timeout: number;
    monitoringPeriod: number;
    securityConfig: {
        maxRequestsPerMinute: number;
        suspiciousPatternThreshold: number;
        threatDetectionEnabled: boolean;
        autoIsolationEnabled: boolean;
        cascadePreventionEnabled: boolean;
    };
    componentId: string;
    securityLevel: 'low' | 'medium' | 'high' | 'critical';
}
export interface SecurityMetrics {
    totalRequests: number;
    failedRequests: number;
    securityViolations: number;
    threatDetections: number;
    averageResponseTime: number;
    lastFailureTime?: Date;
    lastThreatTime?: Date;
    blacklistedIPs: Set<string>;
    suspiciousPatterns: Map<string, number>;
}
export interface ThreatContext {
    ipAddress: string;
    userAgent?: string;
    requestPattern: string;
    frequency: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    indicators: string[];
}
export declare enum CircuitState {
    CLOSED = "CLOSED",// Normal operation
    OPEN = "OPEN",// Failing, reject requests
    HALF_OPEN = "HALF_OPEN",// Testing if service recovered
    ISOLATED = "ISOLATED"
}
export declare class SecurityCircuitBreaker extends EventEmitter {
    private config;
    private auditLogger;
    private state;
    private failureCount;
    private successCount;
    private lastFailureTime?;
    private nextAttemptTime?;
    private metrics;
    private requestHistory;
    private rateLimitTracker;
    private threatPatterns;
    constructor(config: CircuitBreakerConfig, auditLogger: SecurityAuditLogger);
    /**
     * Execute request through circuit breaker with security validation
     */
    execute<T>(operation: () => Promise<T>, context: {
        ipAddress: string;
        userAgent?: string;
        userId?: string;
        requestId: string;
    }): Promise<T>;
    /**
     * Get current circuit state
     */
    getState(): CircuitState;
    /**
     * Get security metrics
     */
    getMetrics(): SecurityMetrics;
    /**
     * Force circuit state (for emergency situations)
     */
    forceState(state: CircuitState, reason: string): void;
    /**
     * Add IP to blacklist
     */
    blacklistIP(ipAddress: string, reason: string): void;
    /**
     * Remove IP from blacklist
     */
    unblacklistIP(ipAddress: string, reason: string): void;
    /**
     * Perform security checks before operation
     */
    private performSecurityChecks;
    /**
     * Check circuit breaker state and decide if request should proceed
     */
    private checkCircuitState;
    /**
     * Rate limiting check
     */
    private checkRateLimit;
    /**
     * Execute operation with timeout
     */
    private executeWithTimeout;
    /**
     * Record successful operation
     */
    private recordSuccess;
    /**
     * Record failed operation
     */
    private recordFailure;
    /**
     * Detect threat patterns
     */
    private detectThreats;
    /**
     * Detect suspicious patterns
     */
    private detectSuspiciousPatterns;
    /**
     * Handle security violations
     */
    private handleSecurityViolation;
    /**
     * Prevent cascade failures
     */
    private preventCascadeFailure;
    /**
     * Set circuit state with logging
     */
    private setState;
    /**
     * Reset failure/success counters
     */
    private resetCounters;
    /**
     * Calculate exponential backoff delay
     */
    private calculateBackoffDelay;
    /**
     * Update average response time
     */
    private updateAverageResponseTime;
    /**
     * Check if error is security-related
     */
    private isSecurityError;
    /**
     * Get threat frequency for IP
     */
    private getThreatFrequency;
    /**
     * Calculate threat severity
     */
    private calculateThreatSeverity;
    /**
     * Check for high frequency requests
     */
    private isHighFrequencyRequest;
    /**
     * Check for unusual user agent
     */
    private isUnusualUserAgent;
    /**
     * Check for suspicious request timing
     */
    private isSuspiciousRequestTiming;
    /**
     * Setup monitoring
     */
    private setupMonitoring;
    /**
     * Setup cleanup of old data
     */
    private setupCleanup;
}
//# sourceMappingURL=circuit-breaker-security.d.ts.map