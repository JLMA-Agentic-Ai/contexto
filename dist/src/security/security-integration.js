"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSecurityManager = exports.SecurityManager = void 0;
const events_1 = require("events");
const authentication_middleware_1 = require("./authentication-middleware");
const input_validation_schemas_1 = require("./input-validation-schemas");
const circuit_breaker_security_1 = require("./circuit-breaker-security");
const audit_logger_1 = require("./audit-logger");
const secrets_manager_1 = require("./secrets-manager");
const network_security_1 = require("./network-security");
const security_config_1 = require("../../config/security-config");
class SecurityManager extends events_1.EventEmitter {
    config;
    auditLogger;
    authMiddleware = null;
    inputValidation;
    circuitBreakers = new Map();
    secretsManager;
    networkSecurity;
    isInitialized = false;
    securityConfig;
    emergencyMode = false;
    lastSecurityCheck = new Date();
    constructor(config) {
        super();
        this.config = config;
        this.securityConfig = (0, security_config_1.getSecurityConfig)(config.environment);
        this.initializeComponents();
    }
    /**
     * Initialize all security components
     */
    async initialize() {
        try {
            console.log('🔐 Initializing Enterprise Security Manager...');
            // Initialize audit logger first (required by other components)
            await this.auditLogger.logConfigurationEvent({
                type: 'component_registered',
                userId: 'system',
                componentId: 'security-manager',
                changes: {
                    action: 'initialization_start',
                    environment: this.config.environment,
                    features: this.config.enabledFeatures
                },
                timestamp: new Date()
            });
            // Initialize secrets manager
            if (this.config.enabledFeatures.secretsManagement) {
                await this.secretsManager.initialize();
                console.log('✅ Secrets Manager initialized');
            }
            // Initialize network security
            if (this.config.enabledFeatures.networkSecurity) {
                await this.networkSecurity.initialize();
                console.log('✅ Network Security Manager initialized');
            }
            // Initialize circuit breakers for each component
            if (this.config.enabledFeatures.circuitBreaker) {
                await this.initializeCircuitBreakers();
                console.log('✅ Circuit Breakers initialized');
            }
            // Setup event handlers
            this.setupEventHandlers();
            // Setup monitoring
            this.setupSecurityMonitoring();
            this.isInitialized = true;
            await this.auditLogger.logConfigurationEvent({
                type: 'component_registered',
                userId: 'system',
                componentId: 'security-manager',
                changes: {
                    action: 'initialization_complete',
                    status: 'success'
                },
                timestamp: new Date()
            });
            console.log('🛡️ Enterprise Security Manager initialized successfully');
            this.emit('initialized', { status: 'success', timestamp: new Date() });
        }
        catch (error) {
            await this.auditLogger.logSecurityEvent({
                type: 'threat_detected',
                componentId: 'security-manager',
                reason: `Initialization failed: ${error.message}`,
                timestamp: new Date()
            });
            console.error('❌ Security Manager initialization failed:', error);
            this.emit('initialization_failed', { error: error.message, timestamp: new Date() });
            throw error;
        }
    }
    /**
     * Validate bridge message with comprehensive security checks
     */
    async validateBridgeMessage(bridgeId, message, context) {
        if (!this.isInitialized) {
            throw new Error('Security Manager not initialized');
        }
        const startTime = Date.now();
        let validationResult;
        try {
            // 1. Circuit breaker check
            if (this.config.enabledFeatures.circuitBreaker) {
                const circuitBreaker = this.circuitBreakers.get(bridgeId);
                if (circuitBreaker) {
                    validationResult = await circuitBreaker.execute(() => this.performMessageValidation(bridgeId, message), {
                        ipAddress: context.ipAddress,
                        userAgent: context.userAgent,
                        userId: context.userId,
                        requestId: this.generateRequestId()
                    });
                }
                else {
                    validationResult = await this.performMessageValidation(bridgeId, message);
                }
            }
            else {
                validationResult = await this.performMessageValidation(bridgeId, message);
            }
            // 2. Log successful validation
            await this.auditLogger.logValidationEvent({
                type: 'validation_success',
                bridgeId,
                messageType: message.type,
                timestamp: new Date()
            });
            const duration = Date.now() - startTime;
            this.emit('message_validated', {
                bridgeId,
                messageType: message.type,
                userId: context.userId,
                duration,
                success: true
            });
            return validationResult;
        }
        catch (error) {
            // Log validation failure
            await this.auditLogger.logValidationEvent({
                type: 'validation_failure',
                bridgeId,
                messageType: message.type || 'unknown',
                errors: [error.message],
                timestamp: new Date()
            });
            await this.auditLogger.logSecurityEvent({
                type: 'threat_detected',
                componentId: bridgeId,
                userId: context.userId,
                ipAddress: context.ipAddress,
                reason: `Message validation failed: ${error.message}`,
                timestamp: new Date()
            });
            const duration = Date.now() - startTime;
            this.emit('message_validation_failed', {
                bridgeId,
                messageType: message.type || 'unknown',
                userId: context.userId,
                error: error.message,
                duration
            });
            throw error;
        }
    }
    /**
     * Authenticate and authorize user request
     */
    async authenticateRequest(request, requiredPermissions) {
        if (!this.config.enabledFeatures.authentication) {
            throw new Error('Authentication is disabled');
        }
        try {
            // Extract and verify authentication
            const authContext = await this.extractAuthContext(request);
            // Check required permissions
            if (this.config.enabledFeatures.authorization) {
                for (const permission of requiredPermissions) {
                    if (!authContext.permissions.includes(permission) &&
                        !authContext.permissions.includes('system:admin')) {
                        await this.auditLogger.logAuthorizationEvent({
                            type: 'authorization_failure',
                            userId: authContext.userId,
                            componentId: 'security-manager',
                            permission,
                            ipAddress: authContext.ipAddress,
                            timestamp: new Date()
                        });
                        throw new Error(`Insufficient permissions: ${permission}`);
                    }
                }
            }
            await this.auditLogger.logAuthenticationEvent({
                type: 'authentication_success',
                userId: authContext.userId,
                sessionId: authContext.sessionId,
                ipAddress: authContext.ipAddress,
                userAgent: authContext.userAgent,
                timestamp: new Date()
            });
            return authContext;
        }
        catch (error) {
            await this.auditLogger.logAuthenticationEvent({
                type: 'authentication_failure',
                ipAddress: request.ip || 'unknown',
                error: error.message,
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Request access to secret
     */
    async requestSecretAccess(secretId, context) {
        if (!this.config.enabledFeatures.secretsManagement) {
            throw new Error('Secrets management is disabled');
        }
        try {
            const accessId = await this.secretsManager.requestSecretAccess(secretId, context);
            this.emit('secret_access_requested', {
                secretId,
                accessId,
                userId: context.userId,
                purpose: context.purpose,
                emergencyAccess: context.emergencyAccess
            });
            return accessId;
        }
        catch (error) {
            await this.auditLogger.logSecurityEvent({
                type: 'threat_detected',
                componentId: 'secrets-manager',
                userId: context.userId,
                reason: `Secret access request failed: ${error.message}`,
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Get security status across all components
     */
    getSecurityStatus() {
        const metrics = this.collectSecurityMetrics();
        const componentStatus = this.assessComponentHealth();
        const criticalComponents = Object.values(componentStatus).filter(status => status === 'failed');
        const degradedComponents = Object.values(componentStatus).filter(status => status === 'degraded');
        let overallStatus;
        if (criticalComponents.length > 0 || this.emergencyMode) {
            overallStatus = 'critical';
        }
        else if (degradedComponents.length > 2) {
            overallStatus = 'unhealthy';
        }
        else if (degradedComponents.length > 0) {
            overallStatus = 'degraded';
        }
        else {
            overallStatus = 'healthy';
        }
        return {
            overall: overallStatus,
            components: componentStatus,
            metrics,
            lastUpdate: new Date()
        };
    }
    /**
     * Generate comprehensive security report
     */
    async generateSecurityReport(timeRange) {
        const report = await this.auditLogger.generateSecurityReport(timeRange);
        // Add additional security manager insights
        const status = this.getSecurityStatus();
        const circuitBreakerStates = this.getCircuitBreakerStates();
        const networkMetrics = this.config.enabledFeatures.networkSecurity
            ? this.networkSecurity.getMetrics()
            : null;
        const enhancedReport = {
            ...report,
            securityManager: {
                status,
                circuitBreakerStates,
                networkMetrics,
                emergencyMode: this.emergencyMode,
                configuration: {
                    environment: this.config.environment,
                    enabledFeatures: this.config.enabledFeatures
                }
            },
            recommendations: [
                ...report.recommendations,
                ...this.generateSecurityRecommendations(status)
            ]
        };
        await this.auditLogger.logConfigurationEvent({
            type: 'config_changed',
            userId: 'system',
            componentId: 'security-manager',
            changes: {
                action: 'security_report_generated',
                timeRange,
                reportSize: JSON.stringify(enhancedReport).length
            },
            timestamp: new Date()
        });
        return enhancedReport;
    }
    /**
     * Enable emergency access mode
     */
    async enableEmergencyMode(reason, authorizedBy, duration = 60 * 60 * 1000 // 1 hour default
    ) {
        this.emergencyMode = true;
        await this.auditLogger.logSecurityEvent({
            type: 'circuit_state_forced',
            componentId: 'security-manager',
            userId: authorizedBy,
            reason: `Emergency mode enabled: ${reason}`,
            timestamp: new Date()
        });
        // Auto-disable after duration
        setTimeout(() => {
            this.disableEmergencyMode('Auto-disable after timeout', 'system');
        }, duration);
        // Notify emergency contacts
        this.notifyEmergencyContacts('Emergency mode enabled', reason, authorizedBy);
        this.emit('emergency_mode_enabled', { reason, authorizedBy, duration });
    }
    /**
     * Disable emergency access mode
     */
    async disableEmergencyMode(reason, authorizedBy) {
        this.emergencyMode = false;
        await this.auditLogger.logSecurityEvent({
            type: 'circuit_state_changed',
            componentId: 'security-manager',
            userId: authorizedBy,
            oldState: 'EMERGENCY',
            newState: 'NORMAL',
            reason: `Emergency mode disabled: ${reason}`,
            timestamp: new Date()
        });
        this.emit('emergency_mode_disabled', { reason, authorizedBy });
    }
    /**
     * Block IP address across all security components
     */
    async blockIP(ipAddress, reason, duration, authorizedBy) {
        // Block in network security
        if (this.config.enabledFeatures.networkSecurity) {
            this.networkSecurity.blockIP(ipAddress, reason, duration);
        }
        // Block in circuit breakers
        for (const circuitBreaker of this.circuitBreakers.values()) {
            circuitBreaker.blacklistIP(ipAddress, reason);
        }
        await this.auditLogger.logSecurityEvent({
            type: 'ip_blacklisted',
            componentId: 'security-manager',
            userId: authorizedBy,
            ipAddress,
            reason,
            timestamp: new Date()
        });
        this.emit('ip_blocked', { ipAddress, reason, duration, authorizedBy });
    }
    /**
     * Unblock IP address across all security components
     */
    async unblockIP(ipAddress, reason, authorizedBy) {
        // Unblock in network security
        if (this.config.enabledFeatures.networkSecurity) {
            this.networkSecurity.unblockIP(ipAddress, reason);
        }
        // Unblock in circuit breakers
        for (const circuitBreaker of this.circuitBreakers.values()) {
            circuitBreaker.unblacklistIP(ipAddress, reason);
        }
        await this.auditLogger.logSecurityEvent({
            type: 'ip_unblacklisted',
            componentId: 'security-manager',
            userId: authorizedBy,
            ipAddress,
            reason,
            timestamp: new Date()
        });
        this.emit('ip_unblocked', { ipAddress, reason, authorizedBy });
    }
    /**
     * Private helper methods
     */
    initializeComponents() {
        // Initialize audit logger
        this.auditLogger = new audit_logger_1.SecurityAuditLogger(this.securityConfig.audit);
        // Initialize authentication middleware
        if (this.config.enabledFeatures.authentication) {
            this.authMiddleware = new authentication_middleware_1.AuthenticationMiddleware(this.auditLogger);
        }
        // Initialize input validation
        if (this.config.enabledFeatures.inputValidation) {
            this.inputValidation = new input_validation_schemas_1.InputValidationSchemas(this.auditLogger);
        }
        // Initialize secrets manager
        if (this.config.enabledFeatures.secretsManagement) {
            this.secretsManager = new secrets_manager_1.SecretsManager({
                storageDirectory: './secrets',
                store: { type: 'local', config: {} },
                masterPassword: process.env.SECRETS_MASTER_PASSWORD || 'dev-master-key',
                rotationCheckInterval: 24 * 60 * 60 * 1000, // Daily
                emergencyContacts: this.config.emergencyAccess.contacts
            }, this.auditLogger);
        }
        // Initialize network security
        if (this.config.enabledFeatures.networkSecurity) {
            this.networkSecurity = new network_security_1.NetworkSecurityManager({
                tls: {
                    enabled: false, // Set to true in production with proper certificates
                    version: '1.3',
                    certificatePath: './certs/server.crt',
                    privateKeyPath: './certs/server.key',
                    certificatePinning: false,
                    pinnedFingerprints: [],
                    requireClientCertificate: false,
                    cipherSuites: [
                        'ECDHE-RSA-AES256-GCM-SHA384',
                        'ECDHE-RSA-AES128-GCM-SHA256',
                        'ECDHE-RSA-AES256-SHA384',
                        'ECDHE-RSA-AES128-SHA256'
                    ]
                },
                websocket: {
                    enabled: true,
                    port: 8080,
                    path: '/ws',
                    maxConnections: 1000,
                    connectionTimeout: 60000,
                    heartbeatInterval: 30000,
                    maxMessageSize: 1024 * 1024, // 1MB
                    rateLimiting: {
                        enabled: true,
                        maxMessagesPerMinute: 100,
                        maxBytesPerMinute: 10 * 1024 * 1024, // 10MB
                        banDuration: 10 * 60 * 1000 // 10 minutes
                    },
                    compression: true,
                    origins: ['http://localhost:3000']
                },
                sse: {
                    enabled: true,
                    port: 8081,
                    path: '/events',
                    maxConnections: 500,
                    keepAliveInterval: 30000,
                    retryInterval: 3000,
                    maxEventSize: 64 * 1024, // 64KB
                    eventHistory: {
                        enabled: true,
                        maxEvents: 100,
                        retentionTime: 60 * 60 * 1000 // 1 hour
                    }
                },
                ddosProtection: {
                    enabled: true,
                    maxConnectionsPerIP: 10,
                    maxRequestsPerIP: 100,
                    blockDuration: 10 * 60 * 1000, // 10 minutes
                    whitelistedIPs: ['127.0.0.1', '::1'],
                    blacklistedIPs: [],
                    geoBlocking: {
                        enabled: false,
                        allowedCountries: [],
                        deniedCountries: []
                    },
                    rateLimiting: {
                        windowSize: 60 * 1000, // 1 minute
                        maxRequests: 60,
                        burstSize: 10
                    }
                }
            }, this.authMiddleware, this.auditLogger);
        }
    }
    async initializeCircuitBreakers() {
        for (const bridgeConfig of this.securityConfig.bridges) {
            const circuitBreakerConfig = {
                failureThreshold: 5,
                successThreshold: 3,
                timeout: bridgeConfig.timeoutMs || 30000,
                monitoringPeriod: 60000,
                componentId: bridgeConfig.bridgeId,
                securityLevel: bridgeConfig.securityLevel || 'medium',
                securityConfig: {
                    maxRequestsPerMinute: 100,
                    suspiciousPatternThreshold: 3,
                    threatDetectionEnabled: true,
                    autoIsolationEnabled: bridgeConfig.securityLevel === 'critical',
                    cascadePreventionEnabled: true
                }
            };
            const circuitBreaker = new circuit_breaker_security_1.SecurityCircuitBreaker(circuitBreakerConfig, this.auditLogger);
            this.circuitBreakers.set(bridgeConfig.bridgeId, circuitBreaker);
        }
    }
    setupEventHandlers() {
        // Handle authentication middleware events
        if (this.authMiddleware) {
            this.authMiddleware.on('session_expired', (event) => {
                this.emit('session_expired', event);
            });
        }
        // Handle secrets manager events
        if (this.secretsManager) {
            this.secretsManager.on('secret_rotated', (event) => {
                this.emit('secret_rotated', event);
            });
            this.secretsManager.on('approval_required', (event) => {
                this.emit('approval_required', event);
            });
        }
        // Handle network security events
        if (this.networkSecurity) {
            this.networkSecurity.on('ip_blocked', (event) => {
                this.emit('network_ip_blocked', event);
            });
            this.networkSecurity.on('threat_detected', (event) => {
                this.emit('network_threat_detected', event);
            });
        }
        // Handle circuit breaker events
        for (const [bridgeId, circuitBreaker] of this.circuitBreakers.entries()) {
            circuitBreaker.on('state_changed', (event) => {
                this.emit('circuit_breaker_state_changed', { bridgeId, ...event });
            });
            circuitBreaker.on('threat_detected', (event) => {
                this.emit('circuit_breaker_threat_detected', { bridgeId, ...event });
            });
        }
        // Handle audit logger events
        this.auditLogger.on('alert_threshold_reached', (event) => {
            this.emit('security_alert', event);
        });
    }
    setupSecurityMonitoring() {
        // Periodic security health check
        setInterval(() => {
            this.performSecurityHealthCheck();
        }, 30000); // Every 30 seconds
        // Security metrics collection
        setInterval(() => {
            const metrics = this.collectSecurityMetrics();
            this.emit('security_metrics', metrics);
        }, 60000); // Every minute
    }
    async performSecurityHealthCheck() {
        try {
            const status = this.getSecurityStatus();
            this.lastSecurityCheck = new Date();
            // Check for critical issues
            if (status.overall === 'critical') {
                await this.auditLogger.logSecurityEvent({
                    type: 'threat_detected',
                    componentId: 'security-manager',
                    reason: 'Critical security status detected during health check',
                    timestamp: new Date()
                });
                // Consider enabling emergency mode if configured
                if (this.config.emergencyAccess.enabled &&
                    status.metrics.criticalEvents > this.config.emergencyAccess.escalationThreshold) {
                    // Auto-escalation logic would go here
                }
            }
            this.emit('security_health_check', status);
        }
        catch (error) {
            console.error('Security health check failed:', error);
        }
    }
    async performMessageValidation(bridgeId, message) {
        if (!this.config.enabledFeatures.inputValidation) {
            return message; // Pass through if validation is disabled
        }
        return await this.inputValidation.validateBridgeMessage(bridgeId, message);
    }
    async extractAuthContext(request) {
        // This would integrate with the authentication middleware
        // Simplified implementation for demo
        const token = request.headers?.authorization?.replace('Bearer ', '') || request.query?.token;
        if (!token) {
            throw new Error('No authentication token provided');
        }
        // Mock authentication context
        return {
            userId: 'user-123',
            username: 'testuser',
            roles: ['user'],
            permissions: ['read', 'write'],
            sessionId: 'session-456',
            ipAddress: request.ip || '127.0.0.1',
            userAgent: request.headers?.['user-agent'] || '',
            issueTime: new Date(),
            expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
            lastActivity: new Date(),
            mfaVerified: false,
            securityLevel: 'medium'
        };
    }
    collectSecurityMetrics() {
        const authMetrics = this.authMiddleware?.getActiveSessions()?.length || 0;
        const networkMetrics = this.networkSecurity?.getMetrics();
        return {
            totalEvents: 0, // Would be collected from audit logger
            criticalEvents: 0,
            activeThreats: 0,
            blockedIPs: networkMetrics?.security.blockedIPs.size || 0,
            activeSessions: authMetrics,
            activeConnections: networkMetrics?.connections.active || 0
        };
    }
    assessComponentHealth() {
        return {
            authentication: this.config.enabledFeatures.authentication ? 'active' : 'degraded',
            authorization: this.config.enabledFeatures.authorization ? 'active' : 'degraded',
            inputValidation: this.config.enabledFeatures.inputValidation ? 'active' : 'degraded',
            circuitBreaker: this.getCircuitBreakerOverallState(),
            auditLogging: this.config.enabledFeatures.auditLogging ? 'active' : 'degraded',
            secretsManagement: this.config.enabledFeatures.secretsManagement ? 'active' : 'degraded',
            networkSecurity: this.config.enabledFeatures.networkSecurity ? 'active' : 'degraded'
        };
    }
    getCircuitBreakerOverallState() {
        if (this.circuitBreakers.size === 0)
            return 'closed';
        const states = Array.from(this.circuitBreakers.values()).map(cb => cb.getState().toString());
        if (states.some(state => state === 'ISOLATED'))
            return 'isolated';
        if (states.some(state => state === 'OPEN'))
            return 'open';
        if (states.some(state => state === 'HALF_OPEN'))
            return 'half-open';
        return 'closed';
    }
    getCircuitBreakerStates() {
        const states = {};
        for (const [bridgeId, circuitBreaker] of this.circuitBreakers.entries()) {
            states[bridgeId] = circuitBreaker.getState().toString();
        }
        return states;
    }
    generateSecurityRecommendations(status) {
        const recommendations = [];
        if (status.overall === 'critical') {
            recommendations.push('URGENT: Security status is critical - immediate investigation required');
        }
        if (status.metrics.blockedIPs > 50) {
            recommendations.push('High number of blocked IPs detected - review DDoS protection settings');
        }
        if (status.components.circuitBreaker !== 'closed') {
            recommendations.push('Circuit breakers are not in normal state - check component health');
        }
        if (!this.config.enabledFeatures.networkSecurity) {
            recommendations.push('Network security is disabled - enable for production environments');
        }
        return recommendations;
    }
    notifyEmergencyContacts(type, reason, authorizedBy) {
        // In production, this would send notifications via email/SMS/Slack
        console.warn(`🚨 EMERGENCY NOTIFICATION: ${type} - ${reason} (by: ${authorizedBy})`);
        this.emit('emergency_notification', { type, reason, authorizedBy });
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    }
}
exports.SecurityManager = SecurityManager;
// Export default configuration for easy setup
const createSecurityManager = (environment = 'development') => {
    const config = {
        environment,
        enabledFeatures: {
            authentication: true,
            authorization: true,
            inputValidation: true,
            circuitBreaker: true,
            auditLogging: true,
            secretsManagement: true,
            networkSecurity: environment !== 'development' // Disabled in dev for simplicity
        },
        emergencyAccess: {
            enabled: true,
            contacts: ['admin@example.com'],
            escalationThreshold: 5
        }
    };
    return new SecurityManager(config);
};
exports.createSecurityManager = createSecurityManager;
//# sourceMappingURL=security-integration.js.map