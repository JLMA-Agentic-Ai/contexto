"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityAuditLogger = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
const promises_1 = require("fs/promises");
const path_1 = require("path");
class SecurityAuditLogger extends events_1.EventEmitter {
    config;
    currentLogFile;
    encryptionKey;
    logBuffer = [];
    flushTimer;
    alertCounters = new Map();
    constructor(config) {
        super();
        this.config = config;
        this.encryptionKey = this.generateEncryptionKey();
        this.setupLogRotation();
        this.setupBufferFlush();
        this.setupAlertMonitoring();
    }
    /**
     * Log authentication events
     */
    async logAuthenticationEvent(event) {
        const auditEvent = {
            id: this.generateEventId(),
            type: `auth:${event.type}`,
            timestamp: event.timestamp,
            severity: this.getAuthenticationSeverity(event.type),
            userId: event.userId,
            sessionId: event.sessionId,
            ipAddress: event.ipAddress,
            userAgent: event.userAgent,
            details: {
                authEvent: event
            },
            traceId: this.generateTraceId()
        };
        await this.logEvent(auditEvent);
        this.updateAlertCounters('authentication', event.type);
    }
    /**
     * Log authorization events
     */
    async logAuthorizationEvent(event) {
        const auditEvent = {
            id: this.generateEventId(),
            type: `authz:${event.type}`,
            timestamp: event.timestamp,
            severity: event.type === 'authorization_failure' ? 'warn' : 'info',
            componentId: event.componentId,
            userId: event.userId,
            ipAddress: event.ipAddress,
            details: {
                authzEvent: event
            },
            traceId: this.generateTraceId()
        };
        await this.logEvent(auditEvent);
        if (event.type === 'authorization_failure') {
            this.updateAlertCounters('authorization', 'failure');
        }
    }
    /**
     * Log validation events
     */
    async logValidationEvent(event) {
        const auditEvent = {
            id: this.generateEventId(),
            type: `validation:${event.type}`,
            timestamp: event.timestamp,
            severity: event.type === 'validation_error' ? 'error' :
                event.type === 'validation_failure' ? 'warn' : 'info',
            details: {
                validationEvent: event
            },
            traceId: this.generateTraceId()
        };
        await this.logEvent(auditEvent);
        if (event.type !== 'validation_success') {
            this.updateAlertCounters('validation', 'failure');
        }
    }
    /**
     * Log security events
     */
    async logSecurityEvent(event) {
        const auditEvent = {
            id: this.generateEventId(),
            type: `security:${event.type}`,
            timestamp: event.timestamp,
            severity: this.getSecuritySeverity(event.type),
            componentId: event.componentId,
            userId: event.userId,
            sessionId: event.sessionId,
            ipAddress: event.ipAddress,
            details: {
                securityEvent: event
            },
            traceId: this.generateTraceId()
        };
        await this.logEvent(auditEvent);
        this.updateAlertCounters('security', event.type);
        // Emit real-time security alerts
        if (this.config.realTimeMonitoring.enabled) {
            this.emit('security_alert', auditEvent);
        }
    }
    /**
     * Log operation events
     */
    async logOperationEvent(event) {
        const auditEvent = {
            id: this.generateEventId(),
            type: `operation:${event.type}`,
            timestamp: event.timestamp,
            severity: event.type === 'operation_failure' ? 'warn' : 'info',
            componentId: event.componentId,
            details: {
                operationEvent: event
            },
            traceId: this.generateTraceId()
        };
        await this.logEvent(auditEvent);
        if (event.securityViolation) {
            this.updateAlertCounters('security', 'violation');
        }
    }
    /**
     * Log data access events
     */
    async logDataAccessEvent(event) {
        const auditEvent = {
            id: this.generateEventId(),
            type: `data:${event.type}`,
            timestamp: event.timestamp,
            severity: this.getDataAccessSeverity(event),
            userId: event.userId,
            details: {
                dataAccessEvent: event
            },
            traceId: this.generateTraceId()
        };
        await this.logEvent(auditEvent);
    }
    /**
     * Log configuration events
     */
    async logConfigurationEvent(event) {
        const auditEvent = {
            id: this.generateEventId(),
            type: `config:${event.type}`,
            timestamp: event.timestamp,
            severity: 'warn', // Configuration changes are always notable
            componentId: event.componentId,
            userId: event.userId,
            details: {
                configEvent: event
            },
            traceId: this.generateTraceId()
        };
        await this.logEvent(auditEvent);
    }
    /**
     * Search audit logs
     */
    async searchLogs(criteria) {
        // In a production system, this would query a database or search index
        // For now, implement a simple file-based search
        const results = [];
        const logFiles = await this.getLogFiles();
        for (const file of logFiles.slice(-10)) { // Search last 10 files for performance
            try {
                const events = await this.readLogFile(file);
                const filtered = events.filter(event => this.matchesCriteria(event, criteria));
                results.push(...filtered);
            }
            catch (error) {
                console.error(`Error reading log file ${file}:`, error);
            }
        }
        // Sort by timestamp (newest first) and apply limit
        results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        return criteria.limit ? results.slice(0, criteria.limit) : results;
    }
    /**
     * Generate security report
     */
    async generateSecurityReport(timeRange) {
        const events = await this.searchLogs({
            startTime: timeRange.startTime,
            endTime: timeRange.endTime,
            eventType: 'security'
        });
        const report = {
            timeRange,
            summary: {
                totalEvents: events.length,
                criticalEvents: events.filter(e => e.severity === 'critical').length,
                threatDetections: events.filter(e => e.type.includes('threat_detected')).length,
                authenticationFailures: events.filter(e => e.type.includes('authentication_failure')).length,
                ipBlacklisted: events.filter(e => e.type.includes('ip_blacklisted')).length,
                circuitBreakerActivations: events.filter(e => e.type.includes('circuit_state_changed')).length
            },
            topThreats: this.analyzeTopThreats(events),
            suspiciousIPs: this.analyzeSuspiciousIPs(events),
            componentSecurity: this.analyzeComponentSecurity(events),
            trends: this.analyzeTrends(events),
            recommendations: this.generateSecurityRecommendations(events)
        };
        // Log the report generation
        await this.logConfigurationEvent({
            type: 'config_changed',
            userId: 'system',
            changes: { action: 'security_report_generated', timeRange },
            timestamp: new Date()
        });
        return report;
    }
    /**
     * Core event logging method
     */
    async logEvent(event) {
        // Add to buffer for batch processing
        this.logBuffer.push(event);
        // Immediate flush for critical events
        if (event.severity === 'critical') {
            await this.flushBuffer();
        }
        // Emit for real-time monitoring
        this.emit('audit_event', event);
    }
    /**
     * Flush log buffer to storage
     */
    async flushBuffer() {
        if (this.logBuffer.length === 0)
            return;
        const events = [...this.logBuffer];
        this.logBuffer = [];
        try {
            const logFile = await this.getCurrentLogFile();
            for (const event of events) {
                const logEntry = this.formatLogEntry(event);
                const encryptedEntry = this.config.encryption.enabled
                    ? await this.encryptLogEntry(logEntry)
                    : logEntry;
                await (0, promises_1.appendFile)(logFile, encryptedEntry + '\n');
            }
            // Add digital signature if required
            if (this.config.compliance.requireDigitalSignature) {
                await this.addDigitalSignature(logFile, events);
            }
        }
        catch (error) {
            console.error('Failed to flush audit log buffer:', error);
            // Re-add events to buffer for retry
            this.logBuffer.unshift(...events);
        }
    }
    /**
     * Format log entry as JSON
     */
    formatLogEntry(event) {
        return JSON.stringify({
            ...event,
            timestamp: event.timestamp.toISOString(),
            checksum: this.calculateChecksum(event)
        });
    }
    /**
     * Encrypt log entry
     */
    async encryptLogEntry(entry) {
        const iv = (0, crypto_1.randomBytes)(16);
        const cipher = (0, crypto_1.createCipheriv)(this.config.encryption.algorithm, this.encryptionKey, iv);
        let encrypted = cipher.update(entry, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const tag = cipher.getAuthTag(); // Cast for GCM mode support
        return JSON.stringify({
            encrypted,
            iv: iv.toString('hex'),
            tag: tag.toString('hex'),
            algorithm: this.config.encryption.algorithm
        });
    }
    /**
     * Calculate event checksum for tamper detection
     */
    calculateChecksum(event) {
        const data = JSON.stringify({
            id: event.id,
            type: event.type,
            timestamp: event.timestamp.toISOString(),
            details: event.details
        });
        return (0, crypto_1.createHash)('sha256').update(data).digest('hex');
    }
    /**
     * Get current log file path
     */
    async getCurrentLogFile() {
        if (!this.currentLogFile || await this.shouldRotateLog()) {
            const timestamp = new Date().toISOString().split('T')[0];
            this.currentLogFile = (0, path_1.join)(this.config.storage.directory, `audit-${timestamp}.log`);
        }
        return this.currentLogFile;
    }
    /**
     * Check if log should be rotated
     */
    async shouldRotateLog() {
        if (!this.currentLogFile)
            return true;
        try {
            const stats = await (0, promises_1.stat)(this.currentLogFile);
            return stats.size >= this.config.storage.maxFileSize;
        }
        catch {
            return true; // File doesn't exist
        }
    }
    /**
     * Get list of log files
     */
    async getLogFiles() {
        try {
            const files = await (0, promises_1.readdir)(this.config.storage.directory);
            return files
                .filter(f => f.startsWith('audit-') && f.endsWith('.log'))
                .map(f => (0, path_1.join)(this.config.storage.directory, f))
                .sort();
        }
        catch {
            return [];
        }
    }
    /**
     * Read and decrypt log file
     */
    async readLogFile(filePath) {
        // Implementation would read and decrypt log file
        // This is a simplified version
        return [];
    }
    /**
     * Check if event matches search criteria
     */
    matchesCriteria(event, criteria) {
        if (criteria.startTime && event.timestamp < criteria.startTime)
            return false;
        if (criteria.endTime && event.timestamp > criteria.endTime)
            return false;
        if (criteria.userId && event.userId !== criteria.userId)
            return false;
        if (criteria.ipAddress && event.ipAddress !== criteria.ipAddress)
            return false;
        if (criteria.componentId && event.componentId !== criteria.componentId)
            return false;
        if (criteria.eventType && !event.type.includes(criteria.eventType))
            return false;
        if (criteria.severity && !criteria.severity.includes(event.severity))
            return false;
        return true;
    }
    /**
     * Get severity for authentication events
     */
    getAuthenticationSeverity(type) {
        switch (type) {
            case 'authentication_failure':
            case 'mfa_failure':
                return 'warn';
            case 'session_invalidated':
                return 'info';
            default:
                return 'info';
        }
    }
    /**
     * Get severity for security events
     */
    getSecuritySeverity(type) {
        switch (type) {
            case 'threat_detected':
            case 'cascade_failure_prevented':
                return 'critical';
            case 'ip_blacklisted':
            case 'circuit_state_forced':
                return 'error';
            case 'rate_limit_exceeded':
            case 'suspicious_pattern_detected':
                return 'warn';
            default:
                return 'info';
        }
    }
    /**
     * Get severity for data access events
     */
    getDataAccessSeverity(event) {
        if (!event.success)
            return 'warn';
        if (event.classification === 'restricted')
            return 'warn';
        if (event.type === 'data_delete' || event.type === 'data_export')
            return 'warn';
        return 'info';
    }
    /**
     * Update alert counters and trigger alerts
     */
    updateAlertCounters(category, type) {
        if (!this.config.realTimeMonitoring.enabled)
            return;
        const key = `${category}:${type}`;
        const now = new Date();
        const counter = this.alertCounters.get(key) || { count: 0, lastReset: now };
        // Reset counter if more than 1 hour has passed
        if (now.getTime() - counter.lastReset.getTime() > 60 * 60 * 1000) {
            counter.count = 0;
            counter.lastReset = now;
        }
        counter.count++;
        this.alertCounters.set(key, counter);
        // Check alert thresholds
        this.checkAlertThresholds(category, type, counter.count);
    }
    /**
     * Check alert thresholds and trigger alerts
     */
    checkAlertThresholds(category, type, count) {
        const thresholds = this.config.realTimeMonitoring.alertThresholds;
        let threshold;
        if (category === 'authentication' && type === 'authentication_failure') {
            threshold = thresholds.failedAuthAttempts;
        }
        else if (category === 'security' && type === 'threat_detected') {
            threshold = thresholds.threatDetections;
        }
        else if (category === 'security' && type === 'rate_limit_exceeded') {
            threshold = thresholds.rateLimitViolations;
        }
        else if (category === 'security' && type === 'circuit_state_changed') {
            threshold = thresholds.circuitBreakerActivations;
        }
        if (threshold && count >= threshold) {
            this.emit('alert_threshold_reached', {
                category,
                type,
                count,
                threshold,
                timestamp: new Date()
            });
        }
    }
    /**
     * Analyze top threats from events
     */
    analyzeTopThreats(events) {
        const threats = new Map();
        events.filter(e => e.type.includes('threat_detected')).forEach(event => {
            const threatType = event.details?.securityEvent?.threatContext?.indicators?.[0] || 'unknown';
            const existing = threats.get(threatType) || { count: 0, severity: 'low', lastSeen: new Date(0) };
            threats.set(threatType, {
                count: existing.count + 1,
                severity: this.getHigherSeverity(existing.severity, event.severity),
                lastSeen: new Date(Math.max(existing.lastSeen.getTime(), event.timestamp.getTime()))
            });
        });
        return Array.from(threats.entries())
            .map(([type, data]) => ({ type, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
    }
    /**
     * Analyze suspicious IPs from events
     */
    analyzeSuspiciousIPs(events) {
        const ips = new Map();
        events.filter(e => e.ipAddress).forEach(event => {
            const ip = event.ipAddress;
            const existing = ips.get(ip) || { events: 0, threatLevel: 'low', lastActivity: new Date(0) };
            ips.set(ip, {
                events: existing.events + 1,
                threatLevel: this.getHigherSeverity(existing.threatLevel, event.severity),
                lastActivity: new Date(Math.max(existing.lastActivity.getTime(), event.timestamp.getTime()))
            });
        });
        return Array.from(ips.entries())
            .map(([ip, data]) => ({ ip, ...data }))
            .filter(item => item.events > 10 || item.threatLevel !== 'low')
            .sort((a, b) => b.events - a.events)
            .slice(0, 20);
    }
    /**
     * Analyze component security from events
     */
    analyzeComponentSecurity(events) {
        const components = new Map();
        events.filter(e => e.componentId).forEach(event => {
            const componentId = event.componentId;
            const existing = components.get(componentId) || { events: 0, failures: 0, threats: 0 };
            existing.events++;
            if (event.type.includes('failure') || event.type.includes('error'))
                existing.failures++;
            if (event.type.includes('threat') || event.type.includes('suspicious'))
                existing.threats++;
            components.set(componentId, existing);
        });
        return Array.from(components.entries())
            .map(([componentId, data]) => ({
            componentId,
            ...data,
            failureRate: data.events > 0 ? (data.failures / data.events) * 100 : 0,
            threatRate: data.events > 0 ? (data.threats / data.events) * 100 : 0
        }))
            .sort((a, b) => (b.failureRate + b.threatRate) - (a.failureRate + a.threatRate));
    }
    /**
     * Analyze security trends from events
     */
    analyzeTrends(events) {
        // Group events by hour for trend analysis
        const hourlyStats = new Map();
        events.forEach(event => {
            const hour = event.timestamp.toISOString().substring(0, 13); // YYYY-MM-DDTHH
            const existing = hourlyStats.get(hour) || { total: 0, threats: 0, failures: 0 };
            existing.total++;
            if (event.type.includes('threat'))
                existing.threats++;
            if (event.type.includes('failure') || event.type.includes('error'))
                existing.failures++;
            hourlyStats.set(hour, existing);
        });
        const trends = Array.from(hourlyStats.entries())
            .map(([hour, stats]) => ({ hour, ...stats }))
            .sort((a, b) => a.hour.localeCompare(b.hour));
        return {
            hourlyTrends: trends,
            totalEvents: events.length,
            avgEventsPerHour: trends.length > 0 ? events.length / trends.length : 0,
            peakHour: trends.reduce((peak, current) => current.total > peak.total ? current : peak, trends[0] || { hour: 'N/A', total: 0 })
        };
    }
    /**
     * Generate security recommendations
     */
    generateSecurityRecommendations(events) {
        const recommendations = [];
        const threatEvents = events.filter(e => e.type.includes('threat')).length;
        const authFailures = events.filter(e => e.type.includes('authentication_failure')).length;
        const rateLimitEvents = events.filter(e => e.type.includes('rate_limit')).length;
        const circuitBreakerEvents = events.filter(e => e.type.includes('circuit_state')).length;
        if (threatEvents > 10) {
            recommendations.push('High number of threat detections - consider implementing additional input validation');
        }
        if (authFailures > 20) {
            recommendations.push('Multiple authentication failures detected - consider implementing account lockout policies');
        }
        if (rateLimitEvents > 5) {
            recommendations.push('Rate limiting violations detected - consider adjusting rate limit thresholds');
        }
        if (circuitBreakerEvents > 3) {
            recommendations.push('Circuit breaker activations indicate service instability - review component health');
        }
        if (recommendations.length === 0) {
            recommendations.push('Security posture appears stable - continue monitoring');
        }
        return recommendations;
    }
    /**
     * Get higher severity between two levels
     */
    getHigherSeverity(severity1, severity2) {
        const levels = { info: 0, warn: 1, error: 2, critical: 3 };
        const level1 = levels[severity1] || 0;
        const level2 = levels[severity2] || 0;
        const maxLevel = Math.max(level1, level2);
        return Object.keys(levels).find(key => levels[key] === maxLevel) || 'info';
    }
    /**
     * Generate unique event ID
     */
    generateEventId() {
        return (0, crypto_1.createHash)('sha256')
            .update(`${Date.now()}-${Math.random()}-${process.pid}`)
            .digest('hex')
            .substring(0, 16);
    }
    /**
     * Generate trace ID for correlation
     */
    generateTraceId() {
        return (0, crypto_1.createHash)('md5')
            .update(`${Date.now()}-${Math.random()}`)
            .digest('hex')
            .substring(0, 8);
    }
    /**
     * Generate encryption key
     */
    generateEncryptionKey() {
        const keyMaterial = process.env.AUDIT_ENCRYPTION_KEY || 'default-audit-key-for-development';
        return (0, crypto_1.createHash)('sha256').update(keyMaterial).digest();
    }
    /**
     * Add digital signature to log file
     */
    async addDigitalSignature(filePath, events) {
        // In production, this would use proper digital signatures (RSA/ECDSA)
        const signature = (0, crypto_1.createHash)('sha256')
            .update(events.map(e => e.id).join(''))
            .update(this.encryptionKey)
            .digest('hex');
        const signatureEntry = JSON.stringify({
            type: 'digital_signature',
            timestamp: new Date().toISOString(),
            signature,
            eventCount: events.length,
            algorithm: 'sha256'
        });
        await (0, promises_1.appendFile)(filePath, signatureEntry + '\n');
    }
    /**
     * Setup log rotation
     */
    setupLogRotation() {
        setInterval(async () => {
            await this.flushBuffer();
            // Clean up old log files
            const files = await this.getLogFiles();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - this.config.storage.retentionDays);
            for (const file of files) {
                try {
                    const stats = await (0, promises_1.stat)(file);
                    if (stats.mtime < cutoffDate) {
                        // In production, archive before deletion
                        console.log(`Would archive/delete old log file: ${file}`);
                    }
                }
                catch (error) {
                    console.error(`Error checking log file ${file}:`, error);
                }
            }
        }, 24 * 60 * 60 * 1000); // Daily
    }
    /**
     * Setup buffer flush timer
     */
    setupBufferFlush() {
        this.flushTimer = setInterval(() => {
            this.flushBuffer();
        }, 10000); // Flush every 10 seconds
    }
    /**
     * Setup alert monitoring
     */
    setupAlertMonitoring() {
        if (!this.config.realTimeMonitoring.enabled)
            return;
        this.on('alert_threshold_reached', async (alert) => {
            console.warn(`🚨 SECURITY ALERT: ${alert.category}:${alert.type} reached threshold ${alert.count}/${alert.threshold}`);
            // Send webhook if configured
            if (this.config.realTimeMonitoring.webhookUrl) {
                // Implementation would send HTTP POST to webhook
            }
        });
        this.on('security_alert', (event) => {
            if (event.severity === 'critical') {
                console.error(`🔥 CRITICAL SECURITY EVENT: ${event.type}`, event.details);
            }
        });
    }
}
exports.SecurityAuditLogger = SecurityAuditLogger;
//# sourceMappingURL=audit-logger.js.map