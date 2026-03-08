"use strict";
/**
 * Streaming Protocol for Real-time Communication
 * Supports WebSocket, SSE, and gRPC streaming
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamingProtocol = void 0;
const events_1 = require("events");
class StreamingProtocol extends events_1.EventEmitter {
    config;
    wsServer;
    sseClients = new Map();
    grpcServer;
    connections = new Map();
    subscriptions = new Map();
    messageHistory = new Map();
    metrics;
    heartbeatInterval;
    constructor(config) {
        super();
        this.config = config;
        this.metrics = this.initializeMetrics();
    }
    initializeMetrics() {
        return {
            connections: {
                websocket: 0,
                sse: 0,
                grpc: 0,
                total: 0
            },
            messages: {
                sent: 0,
                received: 0,
                failed: 0,
                rate: 0
            },
            performance: {
                averageLatency: 0,
                throughput: 0,
                errorRate: 0
            }
        };
    }
    async initialize() {
        try {
            if (this.config.websocket.enabled) {
                await this.initializeWebSocket();
            }
            if (this.config.sse.enabled) {
                await this.initializeSSE();
            }
            if (this.config.grpc.enabled) {
                await this.initializeGRPC();
            }
            this.startHeartbeat();
            this.setupMetricsCollection();
        }
        catch (error) {
            throw new Error(`Failed to initialize streaming protocol: ${error}`);
        }
    }
    async initializeWebSocket() {
        const WebSocket = require('ws');
        this.wsServer = new WebSocket.Server({
            port: this.config.websocket.port,
            path: this.config.websocket.path
        });
        this.wsServer.on('connection', (ws, request) => {
            const clientId = this.generateClientId();
            const connection = {
                id: clientId,
                type: 'websocket',
                sessionId: this.extractSessionId(request),
                connectedAt: new Date(),
                lastActivity: new Date(),
                subscriptions: new Set(),
                metadata: { remoteAddress: request.socket.remoteAddress }
            };
            this.connections.set(clientId, connection);
            this.metrics.connections.websocket++;
            this.metrics.connections.total++;
            ws.clientId = clientId;
            ws.on('message', (data) => {
                this.handleIncomingMessage(clientId, 'websocket', data);
            });
            ws.on('close', () => {
                this.handleClientDisconnect(clientId);
            });
            ws.on('error', (error) => {
                this.handleConnectionError(clientId, error);
            });
            // Send welcome message
            this.sendToClient(clientId, {
                type: 'connection:welcome',
                payload: { clientId, serverTime: new Date() }
            });
        });
    }
    async initializeSSE() {
        // SSE initialization would be handled by HTTP server
        // This is a simplified implementation
    }
    async initializeGRPC() {
        // gRPC initialization would be handled by gRPC server
        // This is a simplified implementation
    }
    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.sendHeartbeat();
        }, this.config.websocket.heartbeatInterval);
    }
    setupMetricsCollection() {
        setInterval(() => {
            this.updateMetrics();
        }, 10000); // Update metrics every 10 seconds
    }
    handleIncomingMessage(clientId, protocol, data) {
        try {
            const message = JSON.parse(data.toString());
            message.timestamp = new Date();
            message.id = message.id || this.generateMessageId();
            this.metrics.messages.received++;
            this.updateClientActivity(clientId);
            switch (message.type) {
                case 'subscribe':
                    this.handleSubscription(clientId, message);
                    break;
                case 'unsubscribe':
                    this.handleUnsubscription(clientId, message);
                    break;
                case 'message':
                    this.handleBroadcastMessage(clientId, message);
                    break;
                case 'ping':
                    this.handlePing(clientId, message);
                    break;
                default:
                    this.emit('message:received', { clientId, message });
            }
        }
        catch (error) {
            this.metrics.messages.failed++;
            this.handleMessageError(clientId, error);
        }
    }
    handleSubscription(clientId, message) {
        const { channel, filters = [], options = {} } = message.payload;
        const subscription = {
            id: this.generateSubscriptionId(),
            clientId,
            channel,
            filters,
            options: {
                persistent: false,
                replay: false,
                ...options
            },
            createdAt: new Date(),
            lastActivity: new Date()
        };
        this.subscriptions.set(subscription.id, subscription);
        const connection = this.connections.get(clientId);
        if (connection) {
            connection.subscriptions.add(subscription.id);
        }
        // Send subscription confirmation
        this.sendToClient(clientId, {
            type: 'subscription:confirmed',
            payload: { subscriptionId: subscription.id, channel }
        });
        // Replay messages if requested
        if (options.replay && options.replayFrom) {
            this.replayMessages(clientId, channel, options.replayFrom);
        }
        this.emit('client:subscribed', { clientId, subscription });
    }
    handleUnsubscription(clientId, message) {
        const { subscriptionId } = message.payload;
        this.subscriptions.delete(subscriptionId);
        const connection = this.connections.get(clientId);
        if (connection) {
            connection.subscriptions.delete(subscriptionId);
        }
        this.sendToClient(clientId, {
            type: 'subscription:cancelled',
            payload: { subscriptionId }
        });
        this.emit('client:unsubscribed', { clientId, subscriptionId });
    }
    handleBroadcastMessage(sourceClientId, message) {
        const { channel, payload } = message;
        if (!channel) {
            return; // Cannot broadcast without channel
        }
        // Find all subscriptions for this channel
        const channelSubscriptions = Array.from(this.subscriptions.values())
            .filter(sub => sub.channel === channel);
        // Broadcast to all subscribed clients
        for (const subscription of channelSubscriptions) {
            if (subscription.clientId !== sourceClientId) {
                // Apply filters
                if (this.messageMatchesFilters(message, subscription.filters)) {
                    this.sendToClient(subscription.clientId, {
                        type: 'broadcast',
                        payload: {
                            channel,
                            data: payload,
                            source: sourceClientId
                        }
                    });
                }
            }
        }
        // Store message in history for replay
        this.storeMessageInHistory(channel, message);
        this.metrics.messages.sent += channelSubscriptions.length;
    }
    handlePing(clientId, message) {
        this.sendToClient(clientId, {
            type: 'pong',
            payload: { timestamp: new Date(), originalId: message.id }
        });
    }
    handleClientDisconnect(clientId) {
        const connection = this.connections.get(clientId);
        if (connection) {
            // Clean up subscriptions
            for (const subscriptionId of connection.subscriptions) {
                this.subscriptions.delete(subscriptionId);
            }
            // Update metrics
            switch (connection.type) {
                case 'websocket':
                    this.metrics.connections.websocket--;
                    break;
                case 'sse':
                    this.metrics.connections.sse--;
                    break;
                case 'grpc':
                    this.metrics.connections.grpc--;
                    break;
            }
            this.metrics.connections.total--;
            this.connections.delete(clientId);
            this.emit('client:disconnected', { clientId, connection });
        }
    }
    handleConnectionError(clientId, error) {
        console.error(`Connection error for client ${clientId}:`, error);
        this.emit('connection:error', { clientId, error });
    }
    handleMessageError(clientId, error) {
        console.error(`Message error for client ${clientId}:`, error);
        this.sendToClient(clientId, {
            type: 'error',
            payload: { message: 'Failed to process message', error: error.message }
        });
    }
    async broadcast(channel, data, options) {
        const message = {
            id: this.generateMessageId(),
            type: 'broadcast',
            source: 'server',
            payload: { channel, data },
            timestamp: new Date(),
            priority: options?.priority || 'normal',
            metadata: options?.metadata || {}
        };
        this.handleBroadcastMessage('server', message);
    }
    async sendToClient(clientId, data) {
        const connection = this.connections.get(clientId);
        if (!connection) {
            return false;
        }
        try {
            switch (connection.type) {
                case 'websocket':
                    return this.sendWebSocketMessage(clientId, data);
                case 'sse':
                    return this.sendSSEMessage(clientId, data);
                case 'grpc':
                    return this.sendGRPCMessage(clientId, data);
                default:
                    return false;
            }
        }
        catch (error) {
            this.metrics.messages.failed++;
            return false;
        }
    }
    sendWebSocketMessage(clientId, data) {
        if (this.wsServer) {
            const client = Array.from(this.wsServer.clients).find((ws) => ws.clientId === clientId);
            if (client && client.readyState === 1) { // WebSocket.OPEN
                client.send(JSON.stringify(data));
                this.metrics.messages.sent++;
                return true;
            }
        }
        return false;
    }
    sendSSEMessage(clientId, data) {
        const sseClient = this.sseClients.get(clientId);
        if (sseClient) {
            sseClient.write(`data: ${JSON.stringify(data)}\n\n`);
            this.metrics.messages.sent++;
            return true;
        }
        return false;
    }
    sendGRPCMessage(clientId, data) {
        // Implement gRPC message sending
        return false;
    }
    sendHeartbeat() {
        const heartbeatMessage = {
            type: 'heartbeat',
            payload: { timestamp: new Date() }
        };
        for (const clientId of this.connections.keys()) {
            this.sendToClient(clientId, heartbeatMessage);
        }
    }
    messageMatchesFilters(message, filters) {
        return filters.every(filter => {
            const fieldValue = this.getNestedValue(message, filter.field);
            switch (filter.operator) {
                case 'equals':
                    return fieldValue === filter.value;
                case 'contains':
                    return String(fieldValue).includes(String(filter.value));
                case 'startsWith':
                    return String(fieldValue).startsWith(String(filter.value));
                case 'endsWith':
                    return String(fieldValue).endsWith(String(filter.value));
                case 'regex':
                    return new RegExp(filter.value).test(String(fieldValue));
                default:
                    return true;
            }
        });
    }
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, prop) => current?.[prop], obj);
    }
    storeMessageInHistory(channel, message) {
        if (!this.messageHistory.has(channel)) {
            this.messageHistory.set(channel, []);
        }
        const channelHistory = this.messageHistory.get(channel);
        channelHistory.push(message);
        // Keep only recent messages (e.g., last 1000)
        if (channelHistory.length > 1000) {
            channelHistory.shift();
        }
    }
    replayMessages(clientId, channel, from) {
        const channelHistory = this.messageHistory.get(channel) || [];
        const messagesToReplay = channelHistory.filter(msg => msg.timestamp >= from);
        for (const message of messagesToReplay) {
            this.sendToClient(clientId, {
                type: 'replay',
                payload: {
                    channel,
                    data: message.payload,
                    originalTimestamp: message.timestamp
                }
            });
        }
    }
    updateClientActivity(clientId) {
        const connection = this.connections.get(clientId);
        if (connection) {
            connection.lastActivity = new Date();
        }
    }
    updateMetrics() {
        // Calculate message rate
        const now = Date.now();
        const timeWindow = 10000; // 10 seconds
        // Calculate average latency, throughput, error rate
        // This would involve more sophisticated tracking
        this.emit('metrics:updated', this.metrics);
    }
    getMetrics() {
        return { ...this.metrics };
    }
    getConnections() {
        return Array.from(this.connections.values());
    }
    getSubscriptions(clientId) {
        const subs = Array.from(this.subscriptions.values());
        return clientId ? subs.filter(sub => sub.clientId === clientId) : subs;
    }
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    }
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    }
    generateSubscriptionId() {
        return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    }
    extractSessionId(request) {
        // Extract session ID from request headers or generate one
        return request.headers['x-session-id'] || this.generateClientId();
    }
    async shutdown() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        if (this.wsServer) {
            this.wsServer.close();
        }
        // Close SSE connections
        for (const sseClient of this.sseClients.values()) {
            sseClient.end();
        }
        this.sseClients.clear();
        // Shutdown gRPC server
        if (this.grpcServer) {
            // this.grpcServer.forceShutdown();
        }
        this.connections.clear();
        this.subscriptions.clear();
        this.messageHistory.clear();
    }
}
exports.StreamingProtocol = StreamingProtocol;
//# sourceMappingURL=streaming-protocol.js.map