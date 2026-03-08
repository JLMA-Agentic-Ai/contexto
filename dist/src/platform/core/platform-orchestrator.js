"use strict";
/**
 * Core Platform Orchestrator for Visión Maestra
 * Manages integration and coordination of all 6 components
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformOrchestrator = void 0;
const events_1 = require("events");
const streaming_protocol_1 = require("../../streaming/protocols/streaming-protocol");
const workflow_engine_1 = require("../../orchestration/workflow-engine");
class PlatformOrchestrator extends events_1.EventEmitter {
    components;
    streamingProtocol;
    workflowEngine;
    config;
    state;
    healthCheckInterval;
    constructor(config) {
        super();
        this.config = config;
        this.state = this.initializeState();
        this.components = {};
        this.streamingProtocol = new streaming_protocol_1.StreamingProtocol(config.streaming);
        this.workflowEngine = new workflow_engine_1.WorkflowEngine(config.orchestration);
        this.setupEventHandlers();
    }
    initializeState() {
        return {
            components: new Map(),
            workflows: new Map(),
            streams: new Map(),
            performance: {
                totalRequests: 0,
                averageResponseTime: 0,
                throughput: 0,
                errorRate: 0,
                activeConnections: 0
            }
        };
    }
    setupEventHandlers() {
        this.on('component:status', this.handleComponentStatus.bind(this));
        this.on('workflow:status', this.handleWorkflowStatus.bind(this));
        this.on('stream:status', this.handleStreamStatus.bind(this));
    }
    async initialize() {
        try {
            // Initialize streaming protocol first
            await this.streamingProtocol.initialize();
            // Initialize workflow engine
            await this.workflowEngine.initialize();
            // Register and initialize components
            await this.registerComponents();
            await this.initializeComponents();
            // Start health monitoring
            this.startHealthMonitoring();
            // Setup inter-component communication
            await this.setupCommunication();
            this.emit('platform:ready', this.state);
        }
        catch (error) {
            this.emit('platform:error', error);
            throw error;
        }
    }
    async registerComponents() {
        // Component registration will be handled by individual bridge modules
        // This method coordinates the registration process
    }
    async initializeComponents() {
        const initPromises = Object.entries(this.components).map(async ([name, component]) => {
            try {
                await component.initialize();
                this.updateComponentStatus(name, 'ready');
            }
            catch (error) {
                this.updateComponentStatus(name, 'error');
                throw new Error(`Failed to initialize component ${name}: ${error}`);
            }
        });
        await Promise.all(initPromises);
    }
    async setupCommunication() {
        // Setup inter-component communication channels
        // This includes streaming connections, event buses, and API gateways
    }
    startHealthMonitoring() {
        this.healthCheckInterval = setInterval(() => {
            this.performHealthCheck();
        }, this.config.monitoring.healthCheckInterval);
    }
    async performHealthCheck() {
        for (const [name, component] of Object.entries(this.components)) {
            try {
                const health = await component.checkHealth();
                this.updateComponentHealth(name, health);
            }
            catch (error) {
                this.updateComponentStatus(name, 'error');
            }
        }
    }
    updateComponentStatus(name, status) {
        const component = this.state.components.get(name);
        if (component) {
            component.status = status;
            component.lastUpdate = new Date();
            this.emit('component:status', { name, status, component });
        }
    }
    updateComponentHealth(name, health) {
        const component = this.state.components.get(name);
        if (component) {
            component.health = health;
            component.lastUpdate = new Date();
        }
    }
    handleComponentStatus(event) {
        // Handle component status changes
        console.log(`Component ${event.name} status: ${event.status}`);
    }
    handleWorkflowStatus(event) {
        // Handle workflow status changes
        console.log(`Workflow ${event.name} status: ${event.status}`);
    }
    handleStreamStatus(event) {
        // Handle stream status changes
        console.log(`Stream ${event.name} status: ${event.status}`);
    }
    async executeWorkflow(workflowId, params) {
        return this.workflowEngine.execute(workflowId, params);
    }
    async sendMessage(componentName, message) {
        const component = this.components[componentName];
        if (!component) {
            throw new Error(`Component ${componentName} not found`);
        }
        return component.sendMessage(message);
    }
    getState() {
        return { ...this.state };
    }
    getComponentStatus(name) {
        return this.state.components.get(name);
    }
    async shutdown() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
        // Shutdown components gracefully
        const shutdownPromises = Object.entries(this.components).map(([name, component]) => component.shutdown());
        await Promise.all(shutdownPromises);
        await this.streamingProtocol.shutdown();
        await this.workflowEngine.shutdown();
        this.emit('platform:shutdown');
    }
}
exports.PlatformOrchestrator = PlatformOrchestrator;
//# sourceMappingURL=platform-orchestrator.js.map