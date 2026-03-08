/**
 * Security Integration for 6-Component Platform
 * Orchestrates all security components and provides unified security interface
 *
 * This module integrates:
 * - Authentication & Authorization Middleware
 * - Input Validation Schemas
 * - Circuit Breaker Security
 * - Audit Logging
 * - Secrets Management
 * - Network Security
 */
import { EventEmitter } from 'events';
import { AuthenticationContext } from './authentication-middleware';
export interface SecurityManagerConfig {
    environment: 'development' | 'staging' | 'production';
    enabledFeatures: {
        authentication: boolean;
        authorization: boolean;
        inputValidation: boolean;
        circuitBreaker: boolean;
        auditLogging: boolean;
        secretsManagement: boolean;
        networkSecurity: boolean;
    };
    emergencyAccess: {
        enabled: boolean;
        contacts: string[];
        escalationThreshold: number;
    };
}
export interface SecurityEvent {
    id: string;
    type: string;
    severity: 'info' | 'warn' | 'error' | 'critical';
    component: string;
    timestamp: Date;
    details: any;
    requiresAction: boolean;
    correlationId?: string;
}
export interface SecurityStatus {
    overall: 'healthy' | 'degraded' | 'unhealthy' | 'critical';
    components: {
        authentication: 'active' | 'degraded' | 'failed';
        authorization: 'active' | 'degraded' | 'failed';
        inputValidation: 'active' | 'degraded' | 'failed';
        circuitBreaker: 'closed' | 'half-open' | 'open' | 'isolated';
        auditLogging: 'active' | 'degraded' | 'failed';
        secretsManagement: 'active' | 'degraded' | 'failed';
        networkSecurity: 'active' | 'degraded' | 'failed';
    };
    metrics: {
        totalEvents: number;
        criticalEvents: number;
        activeThreats: number;
        blockedIPs: number;
        activeSessions: number;
        activeConnections: number;
    };
    lastUpdate: Date;
}
export declare class SecurityManager extends EventEmitter {
    private config;
    private auditLogger;
    private authMiddleware;
    private inputValidation;
    private circuitBreakers;
    private secretsManager;
    private networkSecurity;
    private isInitialized;
    private securityConfig;
    private emergencyMode;
    private lastSecurityCheck;
    constructor(config: SecurityManagerConfig);
    /**
     * Initialize all security components
     */
    initialize(): Promise<void>;
    /**
     * Validate bridge message with comprehensive security checks
     */
    validateBridgeMessage(bridgeId: string, message: any, context: {
        userId: string;
        sessionId: string;
        ipAddress: string;
        userAgent?: string;
    }): Promise<any>;
    /**
     * Authenticate and authorize user request
     */
    authenticateRequest(request: any, requiredPermissions: string[]): Promise<AuthenticationContext>;
    /**
     * Request access to secret
     */
    requestSecretAccess(secretId: string, context: {
        userId: string;
        purpose: string;
        accessType: 'read' | 'rotate' | 'delete';
        emergencyAccess?: boolean;
    }): Promise<string>;
    /**
     * Get security status across all components
     */
    getSecurityStatus(): SecurityStatus;
    /**
     * Generate comprehensive security report
     */
    generateSecurityReport(timeRange: {
        startTime: Date;
        endTime: Date;
    }): Promise<any>;
    /**
     * Enable emergency access mode
     */
    enableEmergencyMode(reason: string, authorizedBy: string, duration?: number): Promise<void>;
    /**
     * Disable emergency access mode
     */
    disableEmergencyMode(reason: string, authorizedBy: string): Promise<void>;
    /**
     * Block IP address across all security components
     */
    blockIP(ipAddress: string, reason: string, duration?: number, authorizedBy?: string): Promise<void>;
    /**
     * Unblock IP address across all security components
     */
    unblockIP(ipAddress: string, reason: string, authorizedBy?: string): Promise<void>;
    /**
     * Private helper methods
     */
    private initializeComponents;
    private initializeCircuitBreakers;
    private setupEventHandlers;
    private setupSecurityMonitoring;
    private performSecurityHealthCheck;
    private performMessageValidation;
    private extractAuthContext;
    private collectSecurityMetrics;
    private assessComponentHealth;
    private getCircuitBreakerOverallState;
    private getCircuitBreakerStates;
    private generateSecurityRecommendations;
    private notifyEmergencyContacts;
    private generateRequestId;
}
export declare const createSecurityManager: (environment?: "development" | "staging" | "production") => SecurityManager;
//# sourceMappingURL=security-integration.d.ts.map