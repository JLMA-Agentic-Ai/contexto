/**
 * Security Audit Logger for 6-Component Platform Integration
 * Implements comprehensive audit logging for all cross-component operations
 * with encryption, real-time monitoring, and threat correlation
 *
 * Audit Coverage:
 * - Authentication and authorization events
 * - Inter-component message validation
 * - Circuit breaker state changes
 * - Security threat detection
 * - Data access and modification
 * - System configuration changes
 */
import { EventEmitter } from 'events';
export interface AuditEvent {
    id: string;
    type: string;
    timestamp: Date;
    severity: 'info' | 'warn' | 'error' | 'critical';
    componentId?: string;
    userId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    details: any;
    correlationId?: string;
    traceId?: string;
}
export interface AuthenticationEvent {
    type: 'authentication_success' | 'authentication_failure' | 'token_generated' | 'token_expired' | 'session_invalidated' | 'mfa_success' | 'mfa_failure';
    userId?: string;
    sessionId?: string;
    ipAddress?: string;
    userAgent?: string;
    error?: string;
    timestamp: Date;
}
export interface AuthorizationEvent {
    type: 'authorization_success' | 'authorization_failure';
    userId?: string;
    componentId: string;
    permission: string;
    ipAddress?: string;
    error?: string;
    timestamp: Date;
}
export interface ValidationEvent {
    type: 'validation_success' | 'validation_failure' | 'validation_error';
    bridgeId: string;
    messageType: string;
    errors?: string[];
    error?: string;
    timestamp: Date;
}
export interface SecurityEvent {
    type: 'threat_detected' | 'ip_blacklisted' | 'ip_unblacklisted' | 'circuit_state_changed' | 'rate_limit_exceeded' | 'suspicious_pattern_detected' | 'cascade_failure_prevented' | 'circuit_state_forced' | 'mfa_failure' | 'mfa_success' | 'ip_mismatch_refresh';
    componentId?: string;
    ipAddress?: string;
    userId?: string;
    sessionId?: string;
    threatContext?: any;
    oldState?: string;
    newState?: string;
    reason?: string;
    error?: string;
    code?: string;
    timestamp: Date;
}
export interface OperationEvent {
    type: 'operation_success' | 'operation_failure';
    componentId: string;
    responseTime: number;
    error?: string;
    securityViolation?: boolean;
    context: any;
    timestamp: Date;
}
export interface DataAccessEvent {
    type: 'data_read' | 'data_write' | 'data_delete' | 'data_export';
    userId: string;
    dataType: string;
    dataId?: string;
    classification: 'public' | 'internal' | 'confidential' | 'restricted';
    success: boolean;
    reason?: string;
    timestamp: Date;
}
export interface ConfigurationEvent {
    type: 'config_changed' | 'security_policy_updated' | 'component_registered' | 'component_deregistered';
    userId: string;
    componentId?: string;
    changes: any;
    previousValue?: any;
    newValue?: any;
    timestamp: Date;
}
export interface AuditLogConfig {
    encryption: {
        enabled: boolean;
        algorithm: string;
        keyRotationDays: number;
    };
    storage: {
        directory: string;
        maxFileSize: number;
        compressionEnabled: boolean;
        retentionDays: number;
    };
    realTimeMonitoring: {
        enabled: boolean;
        alertThresholds: {
            failedAuthAttempts: number;
            threatDetections: number;
            rateLimitViolations: number;
            circuitBreakerActivations: number;
        };
        webhookUrl?: string;
    };
    compliance: {
        standard: 'SOX' | 'HIPAA' | 'GDPR' | 'PCI-DSS' | 'ISO27001';
        requireDigitalSignature: boolean;
        tamperDetection: boolean;
    };
}
export declare class SecurityAuditLogger extends EventEmitter {
    private config;
    private currentLogFile?;
    private encryptionKey;
    private logBuffer;
    private flushTimer?;
    private alertCounters;
    constructor(config: AuditLogConfig);
    /**
     * Log authentication events
     */
    logAuthenticationEvent(event: AuthenticationEvent): Promise<void>;
    /**
     * Log authorization events
     */
    logAuthorizationEvent(event: AuthorizationEvent): Promise<void>;
    /**
     * Log validation events
     */
    logValidationEvent(event: ValidationEvent): Promise<void>;
    /**
     * Log security events
     */
    logSecurityEvent(event: SecurityEvent): Promise<void>;
    /**
     * Log operation events
     */
    logOperationEvent(event: OperationEvent): Promise<void>;
    /**
     * Log data access events
     */
    logDataAccessEvent(event: DataAccessEvent): Promise<void>;
    /**
     * Log configuration events
     */
    logConfigurationEvent(event: ConfigurationEvent): Promise<void>;
    /**
     * Search audit logs
     */
    searchLogs(criteria: {
        startTime?: Date;
        endTime?: Date;
        userId?: string;
        ipAddress?: string;
        componentId?: string;
        eventType?: string;
        severity?: string[];
        limit?: number;
    }): Promise<AuditEvent[]>;
    /**
     * Generate security report
     */
    generateSecurityReport(timeRange: {
        startTime: Date;
        endTime: Date;
    }): Promise<any>;
    /**
     * Core event logging method
     */
    private logEvent;
    /**
     * Flush log buffer to storage
     */
    private flushBuffer;
    /**
     * Format log entry as JSON
     */
    private formatLogEntry;
    /**
     * Encrypt log entry
     */
    private encryptLogEntry;
    /**
     * Calculate event checksum for tamper detection
     */
    private calculateChecksum;
    /**
     * Get current log file path
     */
    private getCurrentLogFile;
    /**
     * Check if log should be rotated
     */
    private shouldRotateLog;
    /**
     * Get list of log files
     */
    private getLogFiles;
    /**
     * Read and decrypt log file
     */
    private readLogFile;
    /**
     * Check if event matches search criteria
     */
    private matchesCriteria;
    /**
     * Get severity for authentication events
     */
    private getAuthenticationSeverity;
    /**
     * Get severity for security events
     */
    private getSecuritySeverity;
    /**
     * Get severity for data access events
     */
    private getDataAccessSeverity;
    /**
     * Update alert counters and trigger alerts
     */
    private updateAlertCounters;
    /**
     * Check alert thresholds and trigger alerts
     */
    private checkAlertThresholds;
    /**
     * Analyze top threats from events
     */
    private analyzeTopThreats;
    /**
     * Analyze suspicious IPs from events
     */
    private analyzeSuspiciousIPs;
    /**
     * Analyze component security from events
     */
    private analyzeComponentSecurity;
    /**
     * Analyze security trends from events
     */
    private analyzeTrends;
    /**
     * Generate security recommendations
     */
    private generateSecurityRecommendations;
    /**
     * Get higher severity between two levels
     */
    private getHigherSeverity;
    /**
     * Generate unique event ID
     */
    private generateEventId;
    /**
     * Generate trace ID for correlation
     */
    private generateTraceId;
    /**
     * Generate encryption key
     */
    private generateEncryptionKey;
    /**
     * Add digital signature to log file
     */
    private addDigitalSignature;
    /**
     * Setup log rotation
     */
    private setupLogRotation;
    /**
     * Setup buffer flush timer
     */
    private setupBufferFlush;
    /**
     * Setup alert monitoring
     */
    private setupAlertMonitoring;
}
//# sourceMappingURL=audit-logger.d.ts.map