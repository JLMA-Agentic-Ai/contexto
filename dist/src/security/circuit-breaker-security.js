"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityCircuitBreaker = exports.CircuitState = void 0;
const events_1 = require("events");
var CircuitState;
(function (CircuitState) {
    CircuitState["CLOSED"] = "CLOSED";
    CircuitState["OPEN"] = "OPEN";
    CircuitState["HALF_OPEN"] = "HALF_OPEN";
    CircuitState["ISOLATED"] = "ISOLATED"; // Security isolation mode
})(CircuitState || (exports.CircuitState = CircuitState = {}));
class SecurityCircuitBreaker extends events_1.EventEmitter {
    config;
    auditLogger;
    state = CircuitState.CLOSED;
    failureCount = 0;
    successCount = 0;
    lastFailureTime;
    nextAttemptTime;
    metrics;
    requestHistory = [];
    rateLimitTracker = new Map();
    threatPatterns = new Map();
    constructor(config, auditLogger) {
        super();
        this.config = config;
        this.auditLogger = auditLogger;
        this.metrics = {
            totalRequests: 0,
            failedRequests: 0,
            securityViolations: 0,
            threatDetections: 0,
            averageResponseTime: 0,
            blacklistedIPs: new Set(),
            suspiciousPatterns: new Map()
        };
        this.setupMonitoring();
        this.setupCleanup();
    }
    /**
     * Execute request through circuit breaker with security validation
     */
    async execute(operation, context) {
        const startTime = Date.now();
        try {
            // Security pre-checks
            await this.performSecurityChecks(context);
            // Circuit breaker state check
            this.checkCircuitState();
            // Rate limiting
            this.checkRateLimit(context.ipAddress);
            // Execute operation
            const result = await this.executeWithTimeout(operation);
            // Record success
            this.recordSuccess(startTime, context);
            return result;
        }
        catch (error) {
            // Record failure
            this.recordFailure(startTime, context, error);
            throw error;
        }
    }
    /**
     * Get current circuit state
     */
    getState() {
        return this.state;
    }
    /**
     * Get security metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * Force circuit state (for emergency situations)
     */
    forceState(state, reason) {
        const oldState = this.state;
        this.state = state;
        this.auditLogger.logSecurityEvent({
            type: 'circuit_state_forced',
            componentId: this.config.componentId,
            oldState,
            newState: state,
            reason,
            timestamp: new Date()
        });
        this.emit('state_changed', { oldState, newState: state, reason });
    }
    /**
     * Add IP to blacklist
     */
    blacklistIP(ipAddress, reason) {
        this.metrics.blacklistedIPs.add(ipAddress);
        this.auditLogger.logSecurityEvent({
            type: 'ip_blacklisted',
            componentId: this.config.componentId,
            ipAddress,
            reason,
            timestamp: new Date()
        });
        this.emit('ip_blacklisted', { ipAddress, reason });
    }
    /**
     * Remove IP from blacklist
     */
    unblacklistIP(ipAddress, reason) {
        this.metrics.blacklistedIPs.delete(ipAddress);
        this.auditLogger.logSecurityEvent({
            type: 'ip_unblacklisted',
            componentId: this.config.componentId,
            ipAddress,
            reason,
            timestamp: new Date()
        });
        this.emit('ip_unblacklisted', { ipAddress, reason });
    }
    /**
     * Perform security checks before operation
     */
    async performSecurityChecks(context) {
        // Check if IP is blacklisted
        if (this.metrics.blacklistedIPs.has(context.ipAddress)) {
            throw new Error(`IP address ${context.ipAddress} is blacklisted`);
        }
        // Check for threat patterns
        if (this.config.securityConfig.threatDetectionEnabled) {
            await this.detectThreats(context);
        }
        // Check for suspicious patterns
        if (this.config.securityConfig.suspiciousPatternThreshold > 0) {
            this.detectSuspiciousPatterns(context);
        }
    }
    /**
     * Check circuit breaker state and decide if request should proceed
     */
    checkCircuitState() {
        switch (this.state) {
            case CircuitState.OPEN:
                if (this.nextAttemptTime && Date.now() >= this.nextAttemptTime.getTime()) {
                    this.setState(CircuitState.HALF_OPEN, 'Timeout elapsed, testing service');
                    return;
                }
                throw new Error(`Circuit breaker is OPEN for component ${this.config.componentId}`);
            case CircuitState.ISOLATED:
                throw new Error(`Component ${this.config.componentId} is isolated due to security threats`);
            case CircuitState.HALF_OPEN:
                if (this.successCount >= this.config.successThreshold) {
                    this.setState(CircuitState.CLOSED, 'Success threshold reached');
                    this.resetCounters();
                }
                break;
            case CircuitState.CLOSED:
                // Normal operation
                break;
        }
    }
    /**
     * Rate limiting check
     */
    checkRateLimit(ipAddress) {
        const now = Date.now();
        const windowMs = 60 * 1000; // 1 minute
        const maxRequests = this.config.securityConfig.maxRequestsPerMinute;
        if (!this.rateLimitTracker.has(ipAddress)) {
            this.rateLimitTracker.set(ipAddress, []);
        }
        const requests = this.rateLimitTracker.get(ipAddress);
        const recentRequests = requests.filter(timestamp => now - timestamp < windowMs);
        if (recentRequests.length >= maxRequests) {
            this.metrics.securityViolations++;
            this.auditLogger.logSecurityEvent({
                type: 'rate_limit_exceeded',
                componentId: this.config.componentId,
                ipAddress,
                requestCount: recentRequests.length,
                maxAllowed: maxRequests,
                timestamp: new Date()
            });
            throw new Error(`Rate limit exceeded for IP ${ipAddress}: ${recentRequests.length}/${maxRequests} requests per minute`);
        }
        recentRequests.push(now);
        this.rateLimitTracker.set(ipAddress, recentRequests);
    }
    /**
     * Execute operation with timeout
     */
    async executeWithTimeout(operation) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Operation timeout after ${this.config.timeout}ms`));
            }, this.config.timeout);
            operation()
                .then(result => {
                clearTimeout(timer);
                resolve(result);
            })
                .catch(error => {
                clearTimeout(timer);
                reject(error);
            });
        });
    }
    /**
     * Record successful operation
     */
    recordSuccess(startTime, context) {
        const responseTime = Date.now() - startTime;
        this.metrics.totalRequests++;
        this.updateAverageResponseTime(responseTime);
        this.requestHistory.push({
            timestamp: Date.now(),
            success: true,
            securityViolation: false
        });
        if (this.state === CircuitState.HALF_OPEN) {
            this.successCount++;
        }
        // Reset failure count on success
        this.failureCount = 0;
        this.auditLogger.logOperationEvent({
            type: 'operation_success',
            componentId: this.config.componentId,
            responseTime,
            context,
            timestamp: new Date()
        });
    }
    /**
     * Record failed operation
     */
    recordFailure(startTime, context, error) {
        const responseTime = Date.now() - startTime;
        this.metrics.totalRequests++;
        this.metrics.failedRequests++;
        this.updateAverageResponseTime(responseTime);
        this.lastFailureTime = new Date();
        const isSecurityViolation = this.isSecurityError(error);
        this.requestHistory.push({
            timestamp: Date.now(),
            success: false,
            securityViolation: isSecurityViolation
        });
        if (isSecurityViolation) {
            this.metrics.securityViolations++;
            this.handleSecurityViolation(context, error);
        }
        this.failureCount++;
        // Check if we should open the circuit
        if (this.failureCount >= this.config.failureThreshold) {
            const nextAttemptDelay = this.calculateBackoffDelay();
            this.nextAttemptTime = new Date(Date.now() + nextAttemptDelay);
            this.setState(CircuitState.OPEN, `Failure threshold reached: ${this.failureCount}/${this.config.failureThreshold}`);
        }
        this.auditLogger.logOperationEvent({
            type: 'operation_failure',
            componentId: this.config.componentId,
            responseTime,
            error: error.message,
            securityViolation: isSecurityViolation,
            context,
            timestamp: new Date()
        });
    }
    /**
     * Detect threat patterns
     */
    async detectThreats(context) {
        const threatPatterns = [
            // SQL injection patterns
            /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
            // XSS patterns
            /(<script[^>]*>.*<\/script>|javascript:|on\w+\s*=)/i,
            // Command injection patterns
            /(;|\||&|`|\$\(|\${)/,
            // Path traversal patterns
            /(\.\.\/|\.\.\\|\~\/)/,
            // Protocol attacks
            /(file:|ftp:|ldap:|dict:|gopher:)/i
        ];
        const requestString = JSON.stringify(context);
        const detectedPatterns = [];
        for (const pattern of threatPatterns) {
            if (pattern.test(requestString)) {
                detectedPatterns.push(pattern.source);
            }
        }
        if (detectedPatterns.length > 0) {
            this.metrics.threatDetections++;
            this.metrics.lastThreatTime = new Date();
            const threatContext = {
                ipAddress: context.ipAddress,
                userAgent: context.userAgent,
                requestPattern: requestString.substring(0, 500),
                frequency: this.getThreatFrequency(context.ipAddress),
                severity: this.calculateThreatSeverity(detectedPatterns.length),
                indicators: detectedPatterns
            };
            this.threatPatterns.set(context.ipAddress, threatContext);
            this.auditLogger.logSecurityEvent({
                type: 'threat_detected',
                componentId: this.config.componentId,
                threatContext,
                timestamp: new Date()
            });
            this.emit('threat_detected', threatContext);
            // Auto-isolation for critical threats
            if (this.config.securityConfig.autoIsolationEnabled &&
                (threatContext.severity === 'critical' || threatContext.frequency > 5)) {
                this.setState(CircuitState.ISOLATED, `Critical threat detected from ${context.ipAddress}`);
                this.blacklistIP(context.ipAddress, 'Automatic blacklisting due to threat detection');
            }
            throw new Error(`Security threat detected: ${detectedPatterns.join(', ')}`);
        }
    }
    /**
     * Detect suspicious patterns
     */
    detectSuspiciousPatterns(context) {
        const suspiciousIndicators = [
            // High frequency requests
            this.isHighFrequencyRequest(context.ipAddress),
            // Unusual user agent
            this.isUnusualUserAgent(context.userAgent),
            // Suspicious request timing
            this.isSuspiciousRequestTiming(context.ipAddress)
        ];
        const suspiciousCount = suspiciousIndicators.filter(Boolean).length;
        if (suspiciousCount >= this.config.securityConfig.suspiciousPatternThreshold) {
            this.metrics.suspiciousPatterns.set(context.ipAddress, (this.metrics.suspiciousPatterns.get(context.ipAddress) || 0) + 1);
            this.auditLogger.logSecurityEvent({
                type: 'suspicious_pattern_detected',
                componentId: this.config.componentId,
                ipAddress: context.ipAddress,
                indicators: suspiciousIndicators.map((indicator, index) => indicator ? ['high_frequency', 'unusual_agent', 'suspicious_timing'][index] : null).filter(Boolean),
                timestamp: new Date()
            });
            this.emit('suspicious_pattern', { context, indicators: suspiciousIndicators });
        }
    }
    /**
     * Handle security violations
     */
    handleSecurityViolation(context, error) {
        // Increase threat frequency for this IP
        const currentFrequency = this.getThreatFrequency(context.ipAddress);
        if (currentFrequency > 3) {
            // Blacklist after 3 violations
            this.blacklistIP(context.ipAddress, `Multiple security violations: ${error.message}`);
        }
        // Check for cascade failure prevention
        if (this.config.securityConfig.cascadePreventionEnabled) {
            this.preventCascadeFailure();
        }
    }
    /**
     * Prevent cascade failures
     */
    preventCascadeFailure() {
        const recentFailures = this.requestHistory.filter(req => !req.success && (Date.now() - req.timestamp) < 60000 // Last minute
        );
        const securityFailures = recentFailures.filter(req => req.securityViolation);
        if (securityFailures.length > 10) { // High number of security failures
            this.setState(CircuitState.ISOLATED, 'Cascade failure prevention: High security failure rate');
            this.auditLogger.logSecurityEvent({
                type: 'cascade_failure_prevented',
                componentId: this.config.componentId,
                recentFailures: recentFailures.length,
                securityFailures: securityFailures.length,
                timestamp: new Date()
            });
        }
    }
    /**
     * Set circuit state with logging
     */
    setState(newState, reason) {
        const oldState = this.state;
        this.state = newState;
        this.auditLogger.logSecurityEvent({
            type: 'circuit_state_changed',
            componentId: this.config.componentId,
            oldState,
            newState,
            reason,
            timestamp: new Date()
        });
        this.emit('state_changed', { oldState, newState, reason });
    }
    /**
     * Reset failure/success counters
     */
    resetCounters() {
        this.failureCount = 0;
        this.successCount = 0;
        this.lastFailureTime = undefined;
        this.nextAttemptTime = undefined;
    }
    /**
     * Calculate exponential backoff delay
     */
    calculateBackoffDelay() {
        const baseDelay = this.config.timeout;
        const maxDelay = 60000; // 1 minute max
        const exponentialDelay = baseDelay * Math.pow(2, Math.min(this.failureCount - 1, 6));
        return Math.min(exponentialDelay, maxDelay);
    }
    /**
     * Update average response time
     */
    updateAverageResponseTime(responseTime) {
        if (this.metrics.totalRequests === 1) {
            this.metrics.averageResponseTime = responseTime;
        }
        else {
            this.metrics.averageResponseTime =
                (this.metrics.averageResponseTime * (this.metrics.totalRequests - 1) + responseTime) /
                    this.metrics.totalRequests;
        }
    }
    /**
     * Check if error is security-related
     */
    isSecurityError(error) {
        const securityKeywords = [
            'security', 'threat', 'blacklist', 'rate limit', 'injection',
            'xss', 'unauthorized', 'forbidden', 'suspicious'
        ];
        return securityKeywords.some(keyword => error.message.toLowerCase().includes(keyword));
    }
    /**
     * Get threat frequency for IP
     */
    getThreatFrequency(ipAddress) {
        const threat = this.threatPatterns.get(ipAddress);
        return threat ? threat.frequency : 0;
    }
    /**
     * Calculate threat severity
     */
    calculateThreatSeverity(patternCount) {
        if (patternCount >= 4)
            return 'critical';
        if (patternCount >= 3)
            return 'high';
        if (patternCount >= 2)
            return 'medium';
        return 'low';
    }
    /**
     * Check for high frequency requests
     */
    isHighFrequencyRequest(ipAddress) {
        const requests = this.rateLimitTracker.get(ipAddress) || [];
        const recentRequests = requests.filter(timestamp => Date.now() - timestamp < 10000 // Last 10 seconds
        );
        return recentRequests.length > 20; // More than 20 requests in 10 seconds
    }
    /**
     * Check for unusual user agent
     */
    isUnusualUserAgent(userAgent) {
        if (!userAgent)
            return true;
        const suspiciousAgents = [
            /bot/i, /crawler/i, /spider/i, /scanner/i, /hack/i, /test/i,
            /curl/i, /wget/i, /python/i, /perl/i, /ruby/i
        ];
        return suspiciousAgents.some(pattern => pattern.test(userAgent));
    }
    /**
     * Check for suspicious request timing
     */
    isSuspiciousRequestTiming(ipAddress) {
        const requests = this.rateLimitTracker.get(ipAddress) || [];
        if (requests.length < 3)
            return false;
        // Check for perfectly regular intervals (likely automated)
        const intervals = [];
        for (let i = 1; i < Math.min(requests.length, 6); i++) {
            intervals.push(requests[i] - requests[i - 1]);
        }
        if (intervals.length < 2)
            return false;
        // Check if all intervals are very similar (within 100ms)
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        return intervals.every(interval => Math.abs(interval - avgInterval) < 100);
    }
    /**
     * Setup monitoring
     */
    setupMonitoring() {
        setInterval(() => {
            this.emit('metrics_update', this.getMetrics());
        }, this.config.monitoringPeriod);
    }
    /**
     * Setup cleanup of old data
     */
    setupCleanup() {
        setInterval(() => {
            const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
            // Clean request history
            this.requestHistory = this.requestHistory.filter(req => req.timestamp > cutoff);
            // Clean rate limit tracker
            for (const [ip, requests] of this.rateLimitTracker.entries()) {
                const recentRequests = requests.filter(timestamp => timestamp > cutoff);
                if (recentRequests.length === 0) {
                    this.rateLimitTracker.delete(ip);
                }
                else {
                    this.rateLimitTracker.set(ip, recentRequests);
                }
            }
            // Clean old threat patterns
            for (const [ip, threat] of this.threatPatterns.entries()) {
                if (Date.now() - threat.frequency > cutoff) {
                    this.threatPatterns.delete(ip);
                }
            }
        }, 60 * 60 * 1000); // Every hour
    }
}
exports.SecurityCircuitBreaker = SecurityCircuitBreaker;
//# sourceMappingURL=circuit-breaker-security.js.map