"use strict";
/**
 * Base Bridge Implementation
 * Abstract base class providing common functionality for all integration bridges
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseBridge = void 0;
const events_1 = require("events");
const common_js_1 = require("../types/common.js");
class BaseBridge extends events_1.EventEmitter {
    config;
    circuitBreakerState = common_js_1.CircuitBreakerState.CLOSED;
    circuitBreakerConfig;
    failureCount = 0;
    lastFailureTime;
    subscriptions = new Map();
    metrics;
    healthStatus = {
        status: 'healthy',
        lastCheck: new Date()
    };
    constructor(config, circuitBreakerConfig) {
        super();
        this.config = config;
        this.circuitBreakerConfig = circuitBreakerConfig || {
            failureThreshold: 5,
            resetTimeout: 30000,
            monitoringPeriod: 60000,
            expectedErrors: ['TIMEOUT', 'RATE_LIMITED']
        };
        this.metrics = {
            requestCount: 0,
            errorCount: 0,
            averageResponseTime: 0,
            circuitBreakerTrips: 0,
            lastResetTime: new Date()
        };
        this.setupHealthCheck();
    }
    // Circuit breaker implementation
    async executeWithCircuitBreaker(operation) {
        const startTime = Date.now();
        if (this.circuitBreakerState === common_js_1.CircuitBreakerState.OPEN) {
            if (this.shouldAttemptReset()) {
                this.circuitBreakerState = common_js_1.CircuitBreakerState.HALF_OPEN;
            }
            else {
                return {
                    success: false,
                    error: this.createError('CIRCUIT_BREAKER_OPEN', 'Circuit breaker is open'),
                    metadata: {
                        duration: Date.now() - startTime,
                        retryCount: 0,
                        circuitBreakerState: this.circuitBreakerState
                    }
                };
            }
        }
        try {
            const result = await operation();
            const duration = Date.now() - startTime;
            this.onSuccess(duration);
            return {
                success: true,
                data: result,
                metadata: {
                    duration,
                    retryCount: 0,
                    circuitBreakerState: this.circuitBreakerState
                }
            };
        }
        catch (error) {
            const duration = Date.now() - startTime;
            const bridgeError = this.handleError(error);
            this.onFailure(bridgeError, duration);
            return {
                success: false,
                error: bridgeError,
                metadata: {
                    duration,
                    retryCount: 0,
                    circuitBreakerState: this.circuitBreakerState
                }
            };
        }
    }
    // Retry mechanism with exponential backoff
    async executeWithRetry(operation, maxRetries) {
        const retries = maxRetries || this.config.retryAttempts;
        let lastError;
        for (let attempt = 0; attempt <= retries; attempt++) {
            const result = await this.executeWithCircuitBreaker(operation);
            if (result.success || !result.error?.retryable) {
                if (result.metadata) {
                    result.metadata.retryCount = attempt;
                }
                return result;
            }
            lastError = result.error;
            if (attempt < retries) {
                const delay = this.calculateBackoffDelay(attempt);
                await this.sleep(delay);
            }
        }
        return {
            success: false,
            error: lastError,
            metadata: {
                duration: 0,
                retryCount: retries,
                circuitBreakerState: this.circuitBreakerState
            }
        };
    }
    // Event subscription management
    subscribe(topics, handler, filter) {
        const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const subscription = {
            id: subscriptionId,
            topics,
            handler,
            filter,
            active: true,
            createdAt: new Date()
        };
        this.subscriptions.set(subscriptionId, subscription);
        // TODO: Implement topic-based routing
        return subscriptionId;
    }
    unsubscribe(subscriptionId) {
        return this.subscriptions.delete(subscriptionId);
    }
    // Event publishing
    async publishEvent(event) {
        for (const [id, subscription] of this.subscriptions) {
            if (subscription.active && this.matchesTopics(event, subscription.topics)) {
                if (!subscription.filter || subscription.filter(event)) {
                    try {
                        await subscription.handler(event);
                        subscription.lastTriggered = new Date();
                    }
                    catch (error) {
                        this.emit('subscription-error', {
                            subscriptionId: id,
                            event,
                            error
                        });
                    }
                }
            }
        }
    }
    // Configuration management
    updateConfig(updates) {
        this.config = { ...this.config, ...updates };
        this.emit('config-updated', this.config);
    }
    getConfig() {
        return { ...this.config };
    }
    // Metrics and monitoring
    getMetrics() {
        return { ...this.metrics };
    }
    getHealthStatus() {
        return { ...this.healthStatus };
    }
    // Private helper methods
    shouldAttemptReset() {
        if (!this.lastFailureTime)
            return true;
        const timeSinceFailure = Date.now() - this.lastFailureTime.getTime();
        return timeSinceFailure >= this.circuitBreakerConfig.resetTimeout;
    }
    onSuccess(duration) {
        this.metrics.requestCount++;
        this.updateAverageResponseTime(duration);
        if (this.circuitBreakerState === common_js_1.CircuitBreakerState.HALF_OPEN) {
            this.circuitBreakerState = common_js_1.CircuitBreakerState.CLOSED;
            this.failureCount = 0;
            this.emit('circuit-breaker-closed');
        }
    }
    onFailure(error, duration) {
        this.metrics.requestCount++;
        this.metrics.errorCount++;
        this.updateAverageResponseTime(duration);
        if (!this.circuitBreakerConfig.expectedErrors?.includes(error.code)) {
            this.failureCount++;
            this.lastFailureTime = new Date();
            if (this.failureCount >= this.circuitBreakerConfig.failureThreshold) {
                this.circuitBreakerState = common_js_1.CircuitBreakerState.OPEN;
                this.metrics.circuitBreakerTrips++;
                this.emit('circuit-breaker-opened', error);
            }
        }
    }
    createError(code, message, context) {
        const error = new Error(message);
        error.code = code;
        error.severity = 'medium';
        error.retryable = true;
        error.context = context;
        error.timestamp = new Date();
        return error;
    }
    handleError(error) {
        if ('code' in error) {
            return error;
        }
        const bridgeError = error;
        bridgeError.code = 'UNKNOWN_ERROR';
        bridgeError.severity = 'medium';
        bridgeError.retryable = true;
        bridgeError.timestamp = new Date();
        return bridgeError;
    }
    calculateBackoffDelay(attempt) {
        const baseDelay = 1000; // 1 second
        return baseDelay * Math.pow(2, attempt) + Math.random() * 1000; // Exponential backoff with jitter
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    matchesTopics(event, topics) {
        return topics.some(topic => {
            if (topic.includes('*')) {
                const pattern = topic.replace(/\*/g, '.*');
                const regex = new RegExp(`^${pattern}$`);
                return regex.test(event.type);
            }
            return event.type === topic;
        });
    }
    updateAverageResponseTime(newDuration) {
        const count = this.metrics.requestCount;
        const currentAvg = this.metrics.averageResponseTime;
        this.metrics.averageResponseTime = (currentAvg * (count - 1) + newDuration) / count;
    }
    setupHealthCheck() {
        setInterval(async () => {
            try {
                this.healthStatus = await this.performHealthCheck();
                this.emit('health-check', this.healthStatus);
            }
            catch (error) {
                this.healthStatus = {
                    status: 'unhealthy',
                    lastCheck: new Date(),
                    details: { error: error instanceof Error ? error.message : 'Unknown error' }
                };
                this.emit('health-check-failed', error);
            }
        }, this.config.healthCheckInterval);
    }
}
exports.BaseBridge = BaseBridge;
//# sourceMappingURL=BaseBridge.js.map