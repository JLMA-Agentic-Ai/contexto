"use strict";
/**
 * Real-Time Streaming Coordinator for Visión Maestra
 * Implements WebSocket + SSE protocols for live cross-component communication
 *
 * Evidence: SOLID - Real-time updates critical for ADW workflow coordination
 * Confidence: 90% - Based on proven WebSocket/SSE patterns
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealTimeCoordinator = void 0;
const events_1 = require("events");
const ws_1 = require("ws");
const http_1 = require("http");
class RealTimeCoordinator extends events_1.EventEmitter {
    config;
    wsServer;
    httpServer;
    connections = new Map();
    messageQueue = new Map();
    metrics;
    messageBuffer = [];
    securityManager;
    constructor(config, securityManager) {
        super();
        this.config = config;
        this.securityManager = securityManager;
        this.metrics = this.initializeMetrics();
        this.setupServers();
    }
    initializeMetrics() {
        return {
            totalConnections: 0,
            activeConnections: 0,
            messagesPerSecond: 0,
            averageLatency: 0,
            errorRate: 0,
            componentBreakdown: {}
        };
    }
    /**
     * Setup WebSocket and HTTP servers for dual-protocol streaming
     */
    setupServers() {
        // HTTP server for SSE
        this.httpServer = (0, http_1.createServer)((req, res) => {
            this.handleHttpRequest(req, res);
        });
        // WebSocket server
        this.wsServer = new ws_1.WebSocketServer({
            server: this.httpServer,
            path: '/ws',
            verifyClient: (info) => this.verifyClient(info)
        });
        this.wsServer.on('connection', (ws, req) => {
            this.handleWebSocketConnection(ws, req);
        });
        // Setup CORS headers
        this.httpServer.on('request', (req, res) => {
            this.setCorsHeaders(res);
        });
    }
    /**
     * Start the streaming coordinator
     */
    async initialize() {
        return new Promise((resolve, reject) => {
            this.httpServer.listen(this.config.port, (err) => {
                if (err) {
                    reject(err);
                }
                else {
                    console.log(`Streaming coordinator listening on port ${this.config.port}`);
                    this.startMetricsCollection();
                    this.startConnectionCleanup();
                    resolve();
                }
            });
        });
    }
    /**
     * Handle WebSocket connections
     */
    async handleWebSocketConnection(ws, req) {
        try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const sessionId = url.searchParams.get('session');
            const components = url.searchParams.get('components')?.split(',') || [];
            if (!sessionId) {
                ws.close(1008, 'Missing session ID');
                return;
            }
            const connectionId = this.generateConnectionId();
            const connection = {
                id: connectionId,
                type: 'websocket',
                userId: 'unknown', // Will be set after authentication
                sessionId,
                componentFilter: components,
                lastActivity: new Date(),
                socket: ws
            };
            // Authenticate connection
            await this.authenticateConnection(connection);
            this.connections.set(connectionId, connection);
            this.metrics.totalConnections++;
            this.metrics.activeConnections++;
            // Setup message handlers
            ws.on('message', (data) => this.handleWebSocketMessage(connectionId, data));
            ws.on('close', () => this.handleConnectionClose(connectionId));
            ws.on('error', (error) => this.handleConnectionError(connectionId, error));
            // Send initial connection confirmation
            this.sendToConnection(connectionId, {
                id: this.generateMessageId(),
                type: 'system',
                component: 'coordinator',
                event: 'connected',
                data: { connectionId, supportedComponents: components },
                timestamp: new Date(),
                metadata: { priority: 'normal' }
            });
            // Setup heartbeat
            this.setupHeartbeat(connectionId);
            this.emit('connection_established', connection);
        }
        catch (error) {
            console.error('WebSocket connection error:', error);
            ws.close(1011, 'Authentication failed');
        }
    }
    /**
     * Handle Server-Sent Events connections
     */
    async handleHttpRequest(req, res) {
        const url = new URL(req.url, `http://${req.headers.host}`);
        if (url.pathname === '/events') {
            await this.handleSSEConnection(req, res);
        }
        else if (url.pathname === '/health') {
            this.handleHealthCheck(res);
        }
        else {
            res.writeHead(404);
            res.end('Not Found');
        }
    }
    /**
     * Handle SSE connections
     */
    async handleSSEConnection(req, res) {
        try {
            const url = new URL(req.url, `http://${req.headers.host}`);
            const sessionId = url.searchParams.get('session');
            const components = url.searchParams.get('components')?.split(',') || [];
            if (!sessionId) {
                res.writeHead(400);
                res.end('Missing session ID');
                return;
            }
            // Setup SSE headers
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            });
            const connectionId = this.generateConnectionId();
            const connection = {
                id: connectionId,
                type: 'sse',
                userId: 'unknown',
                sessionId,
                componentFilter: components,
                lastActivity: new Date(),
                response: res
            };
            // Authenticate connection
            await this.authenticateConnection(connection);
            this.connections.set(connectionId, connection);
            this.metrics.totalConnections++;
            this.metrics.activeConnections++;
            // Handle client disconnect
            req.on('close', () => this.handleConnectionClose(connectionId));
            // Send initial connection message
            this.sendSSEMessage(res, {
                id: this.generateMessageId(),
                type: 'system',
                component: 'coordinator',
                event: 'connected',
                data: { connectionId, supportedComponents: components },
                timestamp: new Date(),
                metadata: { priority: 'normal' }
            });
            // Setup heartbeat
            this.setupHeartbeat(connectionId);
            this.emit('connection_established', connection);
        }
        catch (error) {
            console.error('SSE connection error:', error);
            res.writeHead(401);
            res.end('Authentication failed');
        }
    }
    /**
     * Broadcast message to all relevant connections
     */
    async broadcastMessage(message) {
        this.messageBuffer.push(message);
        // Keep buffer within limits
        if (this.messageBuffer.length > this.config.messageBufferSize) {
            this.messageBuffer = this.messageBuffer.slice(-this.config.messageBufferSize);
        }
        const relevantConnections = this.getRelevantConnections(message);
        const sendPromises = relevantConnections.map(connectionId => this.sendToConnection(connectionId, message));
        await Promise.allSettled(sendPromises);
        this.updateMetrics(message);
    }
    /**
     * Send message to specific connection
     */
    async sendToConnection(connectionId, message) {
        const connection = this.connections.get(connectionId);
        if (!connection)
            return;
        try {
            connection.lastActivity = new Date();
            if (connection.type === 'websocket' && connection.socket) {
                if (connection.socket.readyState === ws_1.WebSocket.OPEN) {
                    connection.socket.send(JSON.stringify(message));
                }
            }
            else if (connection.type === 'sse' && connection.response) {
                this.sendSSEMessage(connection.response, message);
            }
        }
        catch (error) {
            console.error(`Failed to send message to connection ${connectionId}:`, error);
            this.handleConnectionError(connectionId, error);
        }
    }
    /**
     * Send SSE formatted message
     */
    sendSSEMessage(res, message) {
        const formattedMessage = `data: ${JSON.stringify(message)}\n\n`;
        res.write(formattedMessage);
    }
    /**
     * Get connections that should receive a message
     */
    getRelevantConnections(message) {
        const relevantConnections = [];
        for (const [connectionId, connection] of this.connections.entries()) {
            // Check if connection filters include this component
            if (connection.componentFilter.length === 0 ||
                connection.componentFilter.includes(message.component)) {
                // Check specific targets if specified
                if (!message.metadata.targets ||
                    message.metadata.targets.includes(connection.userId)) {
                    relevantConnections.push(connectionId);
                }
            }
        }
        return relevantConnections;
    }
    /**
     * Handle incoming WebSocket message
     */
    async handleWebSocketMessage(connectionId, data) {
        try {
            // Convert data to string regardless of type
            let dataString;
            if (Buffer.isBuffer(data)) {
                dataString = data.toString();
            }
            else if (data instanceof ArrayBuffer) {
                dataString = Buffer.from(data).toString();
            }
            else if (Array.isArray(data)) {
                dataString = Buffer.concat(data).toString();
            }
            else {
                dataString = Buffer.from(data).toString();
            }
            const message = JSON.parse(dataString);
            const connection = this.connections.get(connectionId);
            if (!connection)
                return;
            connection.lastActivity = new Date();
            // Process different message types
            switch (message.type) {
                case 'ping':
                    this.sendToConnection(connectionId, {
                        id: this.generateMessageId(),
                        type: 'pong',
                        component: 'coordinator',
                        event: 'heartbeat',
                        data: { timestamp: new Date() },
                        timestamp: new Date(),
                        metadata: { priority: 'low' }
                    });
                    break;
                case 'subscribe':
                    this.handleSubscription(connectionId, message.data);
                    break;
                case 'unsubscribe':
                    this.handleUnsubscription(connectionId, message.data);
                    break;
                default:
                    this.emit('client_message', { connectionId, message, connection });
            }
        }
        catch (error) {
            console.error(`Error handling WebSocket message from ${connectionId}:`, error);
        }
    }
    /**
     * Handle subscription changes
     */
    handleSubscription(connectionId, subscriptionData) {
        const connection = this.connections.get(connectionId);
        if (!connection)
            return;
        if (subscriptionData.components) {
            connection.componentFilter = [
                ...new Set([...connection.componentFilter, ...subscriptionData.components])
            ];
        }
    }
    /**
     * Handle unsubscription changes
     */
    handleUnsubscription(connectionId, unsubscriptionData) {
        const connection = this.connections.get(connectionId);
        if (!connection)
            return;
        if (unsubscriptionData.components) {
            connection.componentFilter = connection.componentFilter.filter(component => !unsubscriptionData.components.includes(component));
        }
    }
    /**
     * Setup heartbeat for connection health
     */
    setupHeartbeat(connectionId) {
        const heartbeatInterval = setInterval(() => {
            const connection = this.connections.get(connectionId);
            if (!connection) {
                clearInterval(heartbeatInterval);
                return;
            }
            const timeSinceActivity = Date.now() - connection.lastActivity.getTime();
            if (timeSinceActivity > this.config.heartbeatInterval * 3) {
                // Connection appears dead
                this.handleConnectionClose(connectionId);
                clearInterval(heartbeatInterval);
            }
            else {
                // Send heartbeat
                this.sendToConnection(connectionId, {
                    id: this.generateMessageId(),
                    type: 'heartbeat',
                    component: 'coordinator',
                    event: 'ping',
                    data: { timestamp: new Date() },
                    timestamp: new Date(),
                    metadata: { priority: 'low' }
                });
            }
        }, this.config.heartbeatInterval);
    }
    /**
     * Authenticate connection using security manager
     */
    async authenticateConnection(connection) {
        // This would integrate with the SecurityBridgeManager
        // For now, we'll simulate authentication
        connection.userId = 'authenticated-user'; // Would be set from session validation
    }
    /**
     * Handle connection closure
     */
    handleConnectionClose(connectionId) {
        const connection = this.connections.get(connectionId);
        if (connection) {
            this.connections.delete(connectionId);
            this.metrics.activeConnections--;
            if (connection.socket) {
                connection.socket.removeAllListeners();
            }
            this.emit('connection_closed', connection);
            console.log(`Connection ${connectionId} closed`);
        }
    }
    /**
     * Handle connection errors
     */
    handleConnectionError(connectionId, error) {
        console.error(`Connection ${connectionId} error:`, error);
        this.handleConnectionClose(connectionId);
    }
    /**
     * Verify client connection
     */
    verifyClient(info) {
        // Check origin
        if (this.config.corsOrigins.length > 0) {
            const origin = info.origin;
            if (!this.config.corsOrigins.includes(origin)) {
                return false;
            }
        }
        // Check connection limits
        if (this.connections.size >= this.config.maxConnections) {
            return false;
        }
        return true;
    }
    /**
     * Set CORS headers
     */
    setCorsHeaders(res) {
        res.setHeader('Access-Control-Allow-Origin', this.config.corsOrigins.join(','));
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
    /**
     * Handle health check endpoint
     */
    handleHealthCheck(res) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'healthy',
            metrics: this.getMetrics(),
            uptime: process.uptime()
        }));
    }
    /**
     * Start metrics collection
     */
    startMetricsCollection() {
        setInterval(() => {
            this.calculateMetrics();
        }, 5000); // Every 5 seconds
    }
    /**
     * Start connection cleanup
     */
    startConnectionCleanup() {
        setInterval(() => {
            this.cleanupStaleConnections();
        }, 60000); // Every minute
    }
    /**
     * Calculate real-time metrics
     */
    calculateMetrics() {
        // Calculate messages per second from recent buffer
        const recentMessages = this.messageBuffer.filter(msg => Date.now() - msg.timestamp.getTime() < 5000);
        this.metrics.messagesPerSecond = recentMessages.length / 5;
        // Update component breakdown
        this.metrics.componentBreakdown = {};
        for (const message of recentMessages) {
            this.metrics.componentBreakdown[message.component] =
                (this.metrics.componentBreakdown[message.component] || 0) + 1;
        }
    }
    /**
     * Update metrics with new message
     */
    updateMetrics(message) {
        // This would be expanded to track latency, errors, etc.
    }
    /**
     * Cleanup stale connections
     */
    cleanupStaleConnections() {
        const now = Date.now();
        const staleThreshold = this.config.heartbeatInterval * 5;
        for (const [connectionId, connection] of this.connections.entries()) {
            if (now - connection.lastActivity.getTime() > staleThreshold) {
                this.handleConnectionClose(connectionId);
            }
        }
    }
    /**
     * Get current metrics
     */
    getMetrics() {
        return { ...this.metrics };
    }
    /**
     * Generate unique connection ID
     */
    generateConnectionId() {
        return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    }
    /**
     * Generate unique message ID
     */
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    }
    /**
     * Shutdown streaming coordinator
     */
    async shutdown() {
        // Close all connections
        for (const [connectionId, connection] of this.connections.entries()) {
            if (connection.socket) {
                connection.socket.close();
            }
            else if (connection.response) {
                connection.response.end();
            }
        }
        // Close servers
        this.wsServer.close();
        return new Promise((resolve) => {
            this.httpServer.close(() => {
                resolve();
            });
        });
    }
}
exports.RealTimeCoordinator = RealTimeCoordinator;
//# sourceMappingURL=real-time-coordinator.js.map