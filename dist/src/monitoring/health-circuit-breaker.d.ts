/**
 * Health Monitoring & Circuit Breaker System for Visión Maestra
 * Implements comprehensive monitoring with automatic recovery and failover
 *
 * Evidence: SOLID - Resilience patterns critical for multi-component integration
 * Confidence: 92% - Based on proven circuit breaker patterns (Netflix Hystrix)
 */
import { EventEmitter } from 'events';
export type ComponentStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN' | 'ISOLATED';
export interface HealthMetrics {
    componentId: string;
    status: ComponentStatus;
    responseTime: number;
    errorRate: number;
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
    customMetrics: Record<string, number>;
    timestamp: Date;
}
export interface CircuitBreakerConfig {
    failureThreshold: number;
    recoveryTimeout: number;
    volumeThreshold: number;
    errorThresholdPercentage: number;
    slowCallDurationThreshold: number;
    slowCallRateThreshold: number;
    samplingDuration: number;
}
export interface HealthCheck {
    id: string;
    componentId: string;
    name: string;
    type: 'http' | 'tcp' | 'custom' | 'memory' | 'disk';
    config: any;
    interval: number;
    timeout: number;
    retries: number;
    enabled: boolean;
}
export interface AlertRule {
    id: string;
    name: string;
    condition: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    channels: string[];
    cooldown: number;
    enabled: boolean;
}
export interface FailoverConfig {
    enabled: boolean;
    strategy: 'primary-backup' | 'round-robin' | 'least-connections' | 'weighted';
    backupComponents: string[];
    healthCheckRequired: boolean;
    switchThreshold: number;
}
export interface MonitoringSnapshot {
    timestamp: Date;
    overallHealth: ComponentStatus;
    componentHealth: Map<string, HealthMetrics>;
    circuitStates: Map<string, CircuitState>;
    activeAlerts: Alert[];
    performanceTrends: PerformanceTrend[];
}
export interface Alert {
    id: string;
    ruleId: string;
    componentId: string;
    severity: 'info' | 'warning' | 'error' | 'critical';
    message: string;
    details: any;
    triggeredAt: Date;
    acknowledgedBy?: string;
    resolvedAt?: Date;
    status: 'active' | 'acknowledged' | 'resolved';
}
export interface PerformanceTrend {
    componentId: string;
    metric: string;
    values: {
        timestamp: Date;
        value: number;
    }[];
    trend: 'improving' | 'stable' | 'degrading';
    prediction: number;
}
export declare class HealthCircuitBreaker extends EventEmitter {
    private config;
    private componentMetrics;
    private circuitStates;
    private healthChecks;
    private alertRules;
    private activeAlerts;
    private failoverConfigs;
    private circuitConfigs;
    private monitoringIntervals;
    private lastAlertTimes;
    private requestCounts;
    constructor(config: {
        maxMetricHistory: number;
        defaultCircuitConfig: CircuitBreakerConfig;
        alertingEnabled: boolean;
        failoverEnabled: boolean;
    });
    /**
     * Register a component for monitoring
     */
    registerComponent(componentId: string, healthChecks: HealthCheck[], circuitConfig?: CircuitBreakerConfig, failoverConfig?: FailoverConfig): void;
    /**
     * Execute a request through the circuit breaker
     */
    executeRequest<T>(componentId: string, operation: () => Promise<T>, fallback?: () => Promise<T>): Promise<T>;
    /**
     * Record health metrics for a component
     */
    recordHealthMetrics(metrics: HealthMetrics): void;
    /**
     * Get current health status for all components
     */
    getHealthSnapshot(): MonitoringSnapshot;
    /**
     * Add alert rule
     */
    addAlertRule(rule: AlertRule): void;
    /**
     * Trigger manual failover for a component
     */
    triggerFailover(componentId: string, reason: string): Promise<boolean>;
    /**
     * Start monitoring system
     */
    start(): Promise<void>;
    /**
     * Stop monitoring system
     */
    stop(): Promise<void>;
    /**
     * Start individual health check
     */
    private startHealthCheck;
    /**
     * Execute specific health check
     */
    private executeHealthCheck;
    /**
     * Execute HTTP health check
     */
    private executeHttpHealthCheck;
    /**
     * Execute memory health check
     */
    private executeMemoryHealthCheck;
    /**
     * Execute TCP health check
     */
    private executeTcpHealthCheck;
    /**
     * Execute disk health check
     */
    private executeDiskHealthCheck;
    /**
     * Execute custom health check
     */
    private executeCustomHealthCheck;
    /**
     * Record successful request
     */
    private recordSuccess;
    /**
     * Record failed request
     */
    private recordFailure;
    /**
     * Check if circuit should open
     */
    private shouldOpenCircuit;
    /**
     * Check if circuit should attempt reset
     */
    private shouldAttemptReset;
    /**
     * Update component health status
     */
    private updateComponentHealth;
    /**
     * Check alert rules against metrics
     */
    private checkAlertRules;
    /**
     * Evaluate alert condition
     */
    private evaluateAlertCondition;
    /**
     * Trigger alert
     */
    private triggerAlert;
    /**
     * Calculate overall system health
     */
    private calculateOverallHealth;
    /**
     * Calculate performance trends
     */
    private calculatePerformanceTrends;
    /**
     * Calculate trend for a metric
     */
    private calculateMetricTrend;
    /**
     * Find healthy backup component
     */
    private findHealthyBackup;
    /**
     * Start metric aggregation
     */
    private startMetricAggregation;
    /**
     * Setup default configurations
     */
    private setupDefaultConfigs;
    /**
     * Generate unique alert ID
     */
    private generateAlertId;
}
//# sourceMappingURL=health-circuit-breaker.d.ts.map