"use strict";
/**
 * Visión Maestra: Real-Time Streaming Manager
 * Coordinates WebSocket + SSE streaming for all 6 platform components
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamingManager = void 0;
const events_1 = require("events");
const ws_1 = __importDefault(require("ws"));
/**
 * Central streaming manager for Visión Maestra platform
 * Coordinates real-time communication between all 6 components
 */
class StreamingManager extends events_1.EventEmitter {
    platformConfig;
    streams = new Map();
    clients = new Set();
    evidenceBuffer = [];
    constructor(platformConfig) {
        super();
        this.platformConfig = platformConfig;
        this.initializeComponentStreams();
    }
    /**
     * Initialize streaming for all 6 platform components
     */
    initializeComponentStreams() {
        // 1. Dossier Frontend Streaming (WebSocket for UI updates)
        this.registerStream({
            componentName: 'dossier',
            streamType: 'events',
            config: {
                protocol: 'websocket',
                endpoint: 'ws://localhost:3000/api/stream',
                reconnection: {
                    enabled: true,
                    maxAttempts: 5,
                    backoffMs: 1000
                }
            },
            connection: undefined,
            lastUpdate: new Date(),
            active: false
        });
        // 2. ruflo Orchestrator Streaming (ruflo hooks integration)
        this.registerStream({
            componentName: 'ruflo',
            streamType: 'progress',
            config: {
                protocol: 'webhook',
                endpoint: '/api/webhooks/ruflo-progress',
                authentication: {
                    type: 'internal',
                    credentials: 'ruflo-platform-integration'
                },
                reconnection: {
                    enabled: true,
                    maxAttempts: 3,
                    backoffMs: 500
                }
            },
            connection: undefined,
            lastUpdate: new Date(),
            active: false
        });
        // 3. ADW Skills Evidence Streaming (investigation results)
        this.registerStream({
            componentName: 'adw-skills',
            streamType: 'data',
            config: {
                protocol: 'sse',
                endpoint: '/api/stream/evidence',
                reconnection: {
                    enabled: true,
                    maxAttempts: 10,
                    backoffMs: 2000
                }
            },
            connection: undefined,
            lastUpdate: new Date(),
            active: false
        });
        // 4. GitNexus Graph Analysis Streaming
        this.registerStream({
            componentName: 'gitnexus',
            streamType: 'data',
            config: {
                protocol: 'sse',
                endpoint: '/api/stream/graph-analysis',
                reconnection: {
                    enabled: true,
                    maxAttempts: 5,
                    backoffMs: 1500
                }
            },
            connection: undefined,
            lastUpdate: new Date(),
            active: false
        });
        // 5. RLM Navigator AST Streaming
        this.registerStream({
            componentName: 'rlm-navigator',
            streamType: 'events',
            config: {
                protocol: 'webhook',
                endpoint: '/api/webhooks/ast-navigation',
                authentication: {
                    type: 'internal',
                    credentials: 'rlm-mcp-integration'
                },
                reconnection: {
                    enabled: true,
                    maxAttempts: 5,
                    backoffMs: 1000
                }
            },
            connection: undefined,
            lastUpdate: new Date(),
            active: false
        });
        // 6. Claude Code Execution Streaming
        this.registerStream({
            componentName: 'claude-code',
            streamType: 'progress',
            config: {
                protocol: 'sse',
                endpoint: '/api/stream/execution',
                reconnection: {
                    enabled: true,
                    maxAttempts: 5,
                    backoffMs: 1000
                }
            },
            connection: undefined,
            lastUpdate: new Date(),
            active: false
        });
    }
    /**
     * Register a component stream
     */
    registerStream(stream) {
        const streamKey = `${stream.componentName}-${stream.streamType}`;
        this.streams.set(streamKey, stream);
        this.emit('stream_registered', { componentName: stream.componentName, streamType: stream.streamType });
    }
    /**
     * Start streaming for a specific component
     */
    async startComponentStream(componentName) {
        const streams = this.getComponentStreams(componentName);
        let allStarted = true;
        for (const stream of streams) {
            try {
                const success = await this.connectStream(stream);
                if (!success)
                    allStarted = false;
            }
            catch (error) {
                console.error(`Failed to start stream for ${componentName}:`, error);
                allStarted = false;
            }
        }
        return allStarted;
    }
    /**
     * Connect to a specific stream based on protocol
     */
    async connectStream(stream) {
        const streamKey = `${stream.componentName}-${stream.streamType}`;
        try {
            switch (stream.config.protocol) {
                case 'websocket':
                    return await this.connectWebSocket(stream);
                case 'sse':
                    return await this.connectSSE(stream);
                case 'webhook':
                    return await this.setupWebhook(stream);
                default:
                    throw new Error(`Unsupported protocol: ${stream.config.protocol}`);
            }
        }
        catch (error) {
            this.emit('stream_error', { streamKey, error });
            return false;
        }
    }
    /**
     * Connect WebSocket stream
     */
    async connectWebSocket(stream) {
        return new Promise((resolve) => {
            const ws = new ws_1.default(stream.config.endpoint);
            ws.on('open', () => {
                stream.connection = ws;
                stream.active = true;
                stream.lastUpdate = new Date();
                this.emit('stream_connected', {
                    component: stream.componentName,
                    protocol: 'websocket'
                });
                resolve(true);
            });
            ws.on('message', (data) => {
                try {
                    const event = JSON.parse(data);
                    event.component = stream.componentName;
                    event.timestamp = new Date();
                    this.handleStreamEvent(event);
                }
                catch (error) {
                    console.error('Failed to parse WebSocket message:', error);
                }
            });
            ws.on('close', () => {
                stream.active = false;
                this.emit('stream_disconnected', { component: stream.componentName });
                if (stream.config.reconnection.enabled) {
                    this.scheduleReconnection(stream);
                }
            });
            ws.on('error', (error) => {
                this.emit('stream_error', {
                    component: stream.componentName,
                    error
                });
                resolve(false);
            });
            // Connection timeout
            setTimeout(() => {
                if (!stream.active) {
                    ws.close();
                    resolve(false);
                }
            }, 5000);
        });
    }
    /**
     * Connect Server-Sent Events stream
     */
    async connectSSE(stream) {
        return new Promise((resolve) => {
            const eventSource = new EventSource(stream.config.endpoint);
            eventSource.onopen = () => {
                stream.connection = eventSource;
                stream.active = true;
                stream.lastUpdate = new Date();
                this.emit('stream_connected', {
                    component: stream.componentName,
                    protocol: 'sse'
                });
                resolve(true);
            };
            eventSource.onmessage = (event) => {
                try {
                    const streamEvent = JSON.parse(event.data);
                    streamEvent.component = stream.componentName;
                    streamEvent.timestamp = new Date();
                    this.handleStreamEvent(streamEvent);
                }
                catch (error) {
                    console.error('Failed to parse SSE message:', error);
                }
            };
            eventSource.onerror = () => {
                stream.active = false;
                this.emit('stream_disconnected', { component: stream.componentName });
                if (stream.config.reconnection.enabled) {
                    this.scheduleReconnection(stream);
                }
                resolve(false);
            };
            // Connection timeout
            setTimeout(() => {
                if (!stream.active) {
                    eventSource.close();
                    resolve(false);
                }
            }, 5000);
        });
    }
    /**
     * Setup webhook endpoint for receiving stream data
     */
    async setupWebhook(stream) {
        // TODO: Implement webhook endpoint registration with Express/Next.js
        // This would typically involve:
        // 1. Register webhook endpoint in the API
        // 2. Configure authentication/security
        // 3. Set up event routing to this stream manager
        stream.active = true;
        stream.lastUpdate = new Date();
        this.emit('stream_connected', {
            component: stream.componentName,
            protocol: 'webhook'
        });
        return true;
    }
    /**
     * Handle incoming stream events from any component
     */
    handleStreamEvent(event) {
        // Update stream timestamp
        const streams = this.getComponentStreams(event.component);
        streams.forEach(stream => {
            stream.lastUpdate = new Date();
        });
        // Special handling for evidence-based events (ADW integration)
        if (this.isEvidenceEvent(event)) {
            this.handleEvidenceEvent(event);
        }
        // Broadcast to all connected clients
        this.broadcastToClients(event);
        // Emit for internal handling
        this.emit('stream_event', event);
        this.emit(`${event.component}_event`, event);
    }
    /**
     * Handle evidence-based stream events for ADW methodology
     */
    handleEvidenceEvent(event) {
        if (event.evidenceLevel) {
            const evidenceData = {
                decision: event.type,
                evidence: event.evidenceLevel,
                confidence: this.calculateConfidence(event.evidenceLevel),
                sources: event.data.sources || [],
                component: event.component,
                workflowPhase: event.data.phase || 'unknown'
            };
            this.evidenceBuffer.push(evidenceData);
            // Emit evidence update
            this.emit('evidence_update', evidenceData);
            // Trigger ADW quality gate if needed
            if (evidenceData.evidence === 'SHAKY' || evidenceData.evidence === 'UNKNOWN') {
                this.emit('quality_gate_trigger', {
                    reason: `Low confidence evidence from ${event.component}`,
                    evidenceData
                });
            }
        }
    }
    /**
     * Check if event contains evidence data
     */
    isEvidenceEvent(event) {
        return event.evidenceLevel !== undefined ||
            event.data?.confidence !== undefined ||
            event.data?.investigation !== undefined;
    }
    /**
     * Calculate confidence score from evidence level
     */
    calculateConfidence(evidenceLevel) {
        switch (evidenceLevel) {
            case 'SOLID': return 0.85;
            case 'SOFT': return 0.65;
            case 'SHAKY': return 0.35;
            case 'UNKNOWN': return 0.10;
            default: return 0.50;
        }
    }
    /**
     * Broadcast event to all connected WebSocket clients
     */
    broadcastToClients(event) {
        const message = JSON.stringify(event);
        this.clients.forEach(client => {
            if (client.readyState === ws_1.default.OPEN) {
                try {
                    client.send(message);
                }
                catch (error) {
                    console.error('Failed to send message to client:', error);
                    this.clients.delete(client);
                }
            }
            else {
                this.clients.delete(client);
            }
        });
    }
    /**
     * Add WebSocket client for receiving stream updates
     */
    addClient(client) {
        this.clients.add(client);
        client.on('close', () => {
            this.clients.delete(client);
        });
        // Send current status to new client
        const status = this.getStreamingStatus();
        client.send(JSON.stringify({
            type: 'status',
            data: status,
            timestamp: new Date()
        }));
    }
    /**
     * Schedule reconnection for a disconnected stream
     */
    scheduleReconnection(stream) {
        const config = stream.config.reconnection;
        const streamKey = `${stream.componentName}-${stream.streamType}`;
        setTimeout(async () => {
            if (config.maxAttempts > 0) {
                config.maxAttempts--;
                await this.connectStream(stream);
            }
            else {
                this.emit('stream_failed', { streamKey, reason: 'Max reconnection attempts reached' });
            }
        }, config.backoffMs);
    }
    /**
     * Get all streams for a specific component
     */
    getComponentStreams(componentName) {
        return Array.from(this.streams.values())
            .filter(stream => stream.componentName === componentName);
    }
    // Public API methods
    /**
     * Start streaming for all components
     */
    async startAllStreams() {
        const components = ['dossier', 'ruflo', 'adw-skills', 'gitnexus', 'rlm-navigator', 'claude-code'];
        const startPromises = components.map(component => this.startComponentStream(component));
        await Promise.all(startPromises);
    }
    /**
     * Stop all streaming connections
     */
    stopAllStreams() {
        this.streams.forEach(stream => {
            if (stream.connection) {
                if (stream.connection instanceof ws_1.default) {
                    stream.connection.close();
                }
                else if (stream.connection instanceof EventSource) {
                    stream.connection.close();
                }
            }
            stream.active = false;
        });
    }
    /**
     * Get current streaming status for all components
     */
    getStreamingStatus() {
        const status = {
            totalStreams: this.streams.size,
            activeStreams: 0,
            componentStatus: {},
            lastUpdate: new Date()
        };
        this.streams.forEach(stream => {
            if (stream.active)
                status.activeStreams++;
            if (!status.componentStatus[stream.componentName]) {
                status.componentStatus[stream.componentName] = [];
            }
            status.componentStatus[stream.componentName].push({
                streamType: stream.streamType,
                protocol: stream.config.protocol,
                active: stream.active,
                lastUpdate: stream.lastUpdate
            });
        });
        return status;
    }
    /**
     * Get evidence buffer for ADW quality gates
     */
    getEvidenceBuffer() {
        return [...this.evidenceBuffer];
    }
    /**
     * Clear evidence buffer
     */
    clearEvidenceBuffer() {
        this.evidenceBuffer = [];
    }
}
exports.StreamingManager = StreamingManager;
//# sourceMappingURL=StreamingManager.js.map