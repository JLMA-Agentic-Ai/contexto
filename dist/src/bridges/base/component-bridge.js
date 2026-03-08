"use strict";
/**
 * Base Component Bridge Interface
 * Defines the contract for all component integrations
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentBridge = void 0;
class ComponentBridge {
    config;
    isInitialized = false;
    lastHealthCheck;
    constructor(config) {
        this.config = config;
    }
    /**
     * Execute a specific capability of the component
     */
    async executeCapability(capabilityId, parameters) {
        const capability = this.getCapabilities().find(cap => cap.id === capabilityId);
        if (!capability) {
            throw new Error(`Capability ${capabilityId} not found`);
        }
        // Validate parameters
        this.validateParameters(capability.parameters, parameters);
        // Create message for capability execution
        const message = {
            id: this.generateMessageId(),
            type: 'capability:execute',
            payload: {
                capabilityId,
                parameters
            },
            metadata: {
                timestamp: new Date(),
                source: 'platform-orchestrator',
                target: this.config.id,
                priority: 'normal'
            }
        };
        return this.sendMessage(message);
    }
    /**
     * Get component configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update component configuration
     */
    async updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        if (this.isInitialized) {
            await this.reinitialize();
        }
    }
    /**
     * Check if component is initialized and ready
     */
    isReady() {
        return this.isInitialized;
    }
    /**
     * Get last health check timestamp
     */
    getLastHealthCheck() {
        return this.lastHealthCheck;
    }
    validateParameters(parameterDefs, parameters) {
        for (const paramDef of parameterDefs) {
            if (paramDef.required && !(paramDef.name in parameters)) {
                throw new Error(`Required parameter ${paramDef.name} is missing`);
            }
            if (paramDef.name in parameters) {
                const value = parameters[paramDef.name];
                if (!this.validateParameterType(value, paramDef.type)) {
                    throw new Error(`Parameter ${paramDef.name} has invalid type. Expected ${paramDef.type}`);
                }
            }
        }
    }
    validateParameterType(value, expectedType) {
        switch (expectedType) {
            case 'string':
                return typeof value === 'string';
            case 'number':
                return typeof value === 'number';
            case 'boolean':
                return typeof value === 'boolean';
            case 'object':
                return typeof value === 'object' && value !== null;
            case 'array':
                return Array.isArray(value);
            default:
                return true; // Unknown type, assume valid
        }
    }
    generateMessageId() {
        return `${this.config.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    async reinitialize() {
        await this.shutdown();
        await this.initialize();
    }
    /**
     * Handle component errors with retry logic
     */
    async executeWithRetry(operation, context = 'operation') {
        let lastError;
        for (let attempt = 1; attempt <= this.config.retries; attempt++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                if (attempt < this.config.retries) {
                    const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
                    console.warn(`${context} failed (attempt ${attempt}/${this.config.retries}): ${error}. Retrying in ${delay}ms...`);
                    await this.sleep(delay);
                }
            }
        }
        throw new Error(`${context} failed after ${this.config.retries} attempts. Last error: ${lastError.message}`);
    }
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Create standardized error response
     */
    createErrorResponse(error, context) {
        return {
            success: false,
            error: {
                message: error.message,
                context,
                timestamp: new Date(),
                component: this.config.id
            }
        };
    }
    /**
     * Create standardized success response
     */
    createSuccessResponse(data, context) {
        return {
            success: true,
            data,
            metadata: {
                timestamp: new Date(),
                component: this.config.id,
                context
            }
        };
    }
}
exports.ComponentBridge = ComponentBridge;
//# sourceMappingURL=component-bridge.js.map