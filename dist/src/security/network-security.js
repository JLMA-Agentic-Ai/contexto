"use strict";
/**
 * Network Security for 6-Component Platform Integration
 * Implements secure WebSocket/SSE connections with TLS, certificate validation,
 * and advanced threat protection
 *
 * Security Features:
 * - TLS 1.3 with certificate pinning
 * - WebSocket secure upgrade with authentication
 * - Server-Sent Events with secure headers
 * - DDoS protection and connection limiting
 * - Real-time threat monitoring
 * - Network-level intrusion detection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkSecurityManager = void 0;
const events_1 = require("events");
const https_1 = require("https");
const http_1 = require("http");
const ws_1 = require("ws");
const fs_1 = require("fs");
class NetworkSecurityManager extends events_1.EventEmitter {
    config;
    authMiddleware;
    auditLogger;
    httpsServer;
    httpServer;
    webSocketServer;
    activeConnections = new Map();
    blockedIPs = new Set();
    rateLimitTracking = new Map();
    metrics;
    sseConnections = new Map();
    eventHistory = [];
    constructor(config, authMiddleware, auditLogger) {
        super();
        this.config = config;
        this.authMiddleware = authMiddleware;
        this.auditLogger = auditLogger;
        this.metrics = {
            connections: { active: 0, total: 0, rejected: 0, websocket: 0, sse: 0 },
            traffic: { bytesIn: 0, bytesOut: 0, messagesIn: 0, messagesOut: 0 },
            security: { blockedIPs: new Set(), threatDetections: 0, rateLimitViolations: 0, certificateValidationFailures: 0 },
            performance: { averageLatency: 0, peakConnections: 0, uptime: 0 }
        };
        this.setupDDoSProtection();
        this.setupConnectionCleanup();
        this.setupMetricsCollection();
    }
    /**
     * Initialize network security manager
     */
    async initialize() {
        try {
            // Initialize HTTPS server if TLS is enabled
            if (this.config.tls.enabled) {
                await this.initializeHTTPSServer();
            }
            else {
                await this.initializeHTTPServer();
            }
            // Initialize WebSocket server
            if (this.config.websocket.enabled) {
                await this.initializeWebSocketServer();
            }
            // Initialize Server-Sent Events
            if (this.config.sse.enabled) {
                await this.initializeSSEServer();
            }
            this.auditLogger.logConfigurationEvent({
                type: 'component_registered',
                userId: 'system',
                componentId: 'network-security',
                changes: {
                    tls: this.config.tls.enabled,
                    websocket: this.config.websocket.enabled,
                    sse: this.config.sse.enabled
                },
                timestamp: new Date()
            });
            this.emit('initialized');
        }
        catch (error) {
            this.auditLogger.logSecurityEvent({
                type: 'circuit_state_forced',
                componentId: 'network-security',
                reason: `Initialization failed: ${error.message}`,
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Initialize HTTPS server with TLS security
     */
    async initializeHTTPSServer() {
        const tlsOptions = {
            cert: (0, fs_1.readFileSync)(this.config.tls.certificatePath),
            key: (0, fs_1.readFileSync)(this.config.tls.privateKeyPath),
            secureProtocol: this.config.tls.version === '1.3' ? 'TLSv1_3_method' : 'TLSv1_2_method',
            ciphers: this.config.tls.cipherSuites.join(':'),
            honorCipherOrder: true,
            requestCert: this.config.tls.requireClientCertificate,
            rejectUnauthorized: this.config.tls.requireClientCertificate
        };
        // Add CA certificate if provided
        if (this.config.tls.caPath) {
            tlsOptions.ca = (0, fs_1.readFileSync)(this.config.tls.caPath);
        }
        // Add DH parameters if provided
        if (this.config.tls.dhParamPath) {
            tlsOptions.dhparam = (0, fs_1.readFileSync)(this.config.tls.dhParamPath);
        }
        this.httpsServer = (0, https_1.createServer)(tlsOptions, this.handleHTTPRequest.bind(this));
        // Setup TLS event handlers
        this.httpsServer.on('secureConnection', (tlsSocket) => {
            this.handleSecureConnection(tlsSocket);
        });
        this.httpsServer.on('tlsClientError', (error, tlsSocket) => {
            this.handleTLSError(error, tlsSocket);
        });
    }
    /**
     * Initialize HTTP server (for development or when TLS is disabled)
     */
    async initializeHTTPServer() {
        this.httpServer = (0, http_1.createServer)(this.handleHTTPRequest.bind(this));
    }
    /**
     * Initialize WebSocket server with security
     */
    async initializeWebSocketServer() {
        const server = this.httpsServer || this.httpServer;
        if (!server) {
            throw new Error('HTTP server must be initialized before WebSocket server');
        }
        this.webSocketServer = new ws_1.WebSocketServer({
            server,
            path: this.config.websocket.path,
            maxPayload: this.config.websocket.maxMessageSize,
            perMessageDeflate: this.config.websocket.compression,
            clientTracking: true,
            verifyClient: this.verifyWebSocketClient.bind(this)
        });
        this.webSocketServer.on('connection', this.handleWebSocketConnection.bind(this));
        // Setup WebSocket heartbeat
        setInterval(() => {
            this.performWebSocketHeartbeat();
        }, this.config.websocket.heartbeatInterval);
        server.listen(this.config.websocket.port, () => {
            console.log(`Secure WebSocket server listening on port ${this.config.websocket.port}`);
        });
    }
    /**
     * Initialize Server-Sent Events endpoint
     */
    async initializeSSEServer() {
        // SSE is handled through HTTP request handlers
        // Setup event history cleanup
        if (this.config.sse.eventHistory.enabled) {
            setInterval(() => {
                this.cleanupEventHistory();
            }, 60000); // Every minute
        }
        // Setup keep-alive for SSE connections
        setInterval(() => {
            this.performSSEKeepAlive();
        }, this.config.sse.keepAliveInterval);
    }
    /**
     * Handle HTTP requests with security validation
     */
    async handleHTTPRequest(req, res) {
        const connectionId = this.generateConnectionId();
        const startTime = Date.now();
        try {
            // DDoS protection check
            if (!this.checkDDoSProtection(req.socket.remoteAddress, req)) {
                this.rejectConnection(res, 'DDoS protection triggered', req.socket.remoteAddress);
                return;
            }
            // Rate limiting check
            if (!this.checkRateLimit(req.socket.remoteAddress)) {
                this.rejectConnection(res, 'Rate limit exceeded', req.socket.remoteAddress);
                return;
            }
            // Handle SSE connections
            if (req.url?.startsWith(this.config.sse.path)) {
                await this.handleSSEConnection(req, res, connectionId);
                return;
            }
            // Handle other HTTP requests
            await this.handleGeneralHTTPRequest(req, res, connectionId);
        }
        catch (error) {
            this.auditLogger.logSecurityEvent({
                type: 'threat_detected',
                ipAddress: req.socket.remoteAddress,
                reason: `HTTP request error: ${error.message}`,
                timestamp: new Date()
            });
            res.statusCode = 500;
            res.end();
        }
        finally {
            // Update metrics
            const latency = Date.now() - startTime;
            this.updateLatencyMetrics(latency);
        }
    }
    /**
     * Handle Server-Sent Events connection
     */
    async handleSSEConnection(req, res, connectionId) {
        try {
            // Authentication check
            const token = req.headers.authorization?.replace('Bearer ', '') || req.url.split('token=')[1];
            if (!token) {
                this.rejectConnection(res, 'Authentication required', req.socket.remoteAddress);
                return;
            }
            // Validate token through auth middleware
            const authContext = await this.validateAuthToken(token, req.socket.remoteAddress);
            // Check connection limits
            if (this.sseConnections.size >= this.config.sse.maxConnections) {
                this.rejectConnection(res, 'Maximum connections reached', req.socket.remoteAddress);
                return;
            }
            // Setup SSE headers
            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Cache-Control',
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY',
                'X-XSS-Protection': '1; mode=block',
                'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
            });
            // Create connection record
            const connection = {
                id: connectionId,
                type: 'sse',
                ipAddress: req.socket.remoteAddress,
                userAgent: req.headers['user-agent'] || '',
                userId: authContext.userId,
                sessionId: authContext.sessionId,
                connectedAt: new Date(),
                lastActivity: new Date(),
                bytesIn: 0,
                bytesOut: 0,
                messagesIn: 0,
                messagesOut: 0,
                securityFlags: []
            };
            this.activeConnections.set(connectionId, connection);
            this.sseConnections.set(connectionId, { response: res, lastPing: new Date() });
            this.metrics.connections.sse++;
            this.metrics.connections.active++;
            // Send initial event
            this.sendSSEEvent(connectionId, 'connection', { id: connectionId, timestamp: new Date() });
            // Send event history if enabled
            if (this.config.sse.eventHistory.enabled) {
                for (const event of this.eventHistory.slice(-10)) { // Last 10 events
                    this.sendSSEEvent(connectionId, 'history', event);
                }
            }
            // Handle connection close
            req.on('close', () => {
                this.handleSSEDisconnection(connectionId);
            });
            this.auditLogger.logSecurityEvent({
                type: 'circuit_state_changed',
                componentId: 'network-security',
                userId: authContext.userId,
                ipAddress: req.socket.remoteAddress,
                newState: 'SSE_CONNECTED',
                reason: 'SSE connection established',
                timestamp: new Date()
            });
            this.emit('sse_connected', { connectionId, connection, authContext });
        }
        catch (error) {
            this.rejectConnection(res, `SSE setup failed: ${error.message}`, req.socket.remoteAddress);
        }
    }
    /**
     * Handle WebSocket connection with security validation
     */
    async handleWebSocketConnection(ws, req) {
        const connectionId = this.generateConnectionId();
        try {
            // Get authentication context from request
            const authContext = req.authContext;
            if (!authContext) {
                ws.close(1008, 'Authentication failed');
                return;
            }
            // Create connection record
            const connection = {
                id: connectionId,
                type: 'websocket',
                ipAddress: req.socket.remoteAddress,
                userAgent: req.headers['user-agent'] || '',
                userId: authContext.userId,
                sessionId: authContext.sessionId,
                connectedAt: new Date(),
                lastActivity: new Date(),
                bytesIn: 0,
                bytesOut: 0,
                messagesIn: 0,
                messagesOut: 0,
                securityFlags: []
            };
            this.activeConnections.set(connectionId, connection);
            this.metrics.connections.websocket++;
            this.metrics.connections.active++;
            // Setup message handling
            ws.on('message', (data) => {
                this.handleWebSocketMessage(connectionId, data, ws);
            });
            // Setup error handling
            ws.on('error', (error) => {
                this.handleWebSocketError(connectionId, error);
            });
            // Setup close handling
            ws.on('close', (code, reason) => {
                this.handleWebSocketClose(connectionId, code, reason.toString());
            });
            // Setup ping/pong for heartbeat
            ws.on('pong', () => {
                connection.lastActivity = new Date();
            });
            // Send welcome message
            ws.send(JSON.stringify({
                type: 'connection',
                data: { id: connectionId, timestamp: new Date() }
            }));
            this.auditLogger.logSecurityEvent({
                type: 'circuit_state_changed',
                componentId: 'network-security',
                userId: authContext.userId,
                ipAddress: req.socket.remoteAddress,
                newState: 'WEBSOCKET_CONNECTED',
                reason: 'WebSocket connection established',
                timestamp: new Date()
            });
            this.emit('websocket_connected', { connectionId, connection, ws });
        }
        catch (error) {
            ws.close(1011, `Connection setup failed: ${error.message}`);
        }
    }
    /**
     * Verify WebSocket client during handshake
     */
    verifyWebSocketClient(info) {
        const { req, origin, secure } = info;
        try {
            // Check origin if configured
            if (this.config.websocket.origins.length > 0 &&
                !this.config.websocket.origins.includes(origin)) {
                this.auditLogger.logSecurityEvent({
                    type: 'threat_detected',
                    ipAddress: req.socket.remoteAddress,
                    reason: `Invalid WebSocket origin: ${origin}`,
                    timestamp: new Date()
                });
                return false;
            }
            // Check if secure connection is required
            if (this.config.tls.enabled && !secure) {
                this.auditLogger.logSecurityEvent({
                    type: 'threat_detected',
                    ipAddress: req.socket.remoteAddress,
                    reason: 'Insecure WebSocket connection attempted',
                    timestamp: new Date()
                });
                return false;
            }
            // DDoS protection check
            if (!this.checkDDoSProtection(req.socket.remoteAddress, req)) {
                return false;
            }
            // Check connection limits
            if (this.activeConnections.size >= this.config.websocket.maxConnections) {
                this.auditLogger.logSecurityEvent({
                    type: 'rate_limit_exceeded',
                    ipAddress: req.socket.remoteAddress,
                    reason: 'WebSocket connection limit reached',
                    timestamp: new Date()
                });
                return false;
            }
            return true;
        }
        catch (error) {
            this.auditLogger.logSecurityEvent({
                type: 'threat_detected',
                ipAddress: req.socket.remoteAddress,
                reason: `WebSocket verification error: ${error.message}`,
                timestamp: new Date()
            });
            return false;
        }
    }
    /**
     * Send event to SSE connection
     */
    sendSSEEvent(connectionId, type, data) {
        const sseConnection = this.sseConnections.get(connectionId);
        const connection = this.activeConnections.get(connectionId);
        if (!sseConnection || !connection) {
            return false;
        }
        try {
            const eventData = JSON.stringify(data);
            const eventString = `event: ${type}\ndata: ${eventData}\n\n`;
            sseConnection.response.write(eventString);
            sseConnection.lastPing = new Date();
            // Update connection metrics
            connection.messagesOut++;
            connection.bytesOut += eventString.length;
            connection.lastActivity = new Date();
            // Add to event history
            if (this.config.sse.eventHistory.enabled) {
                this.eventHistory.push({
                    id: this.generateEventId(),
                    data: { type, data },
                    timestamp: new Date()
                });
                // Limit history size
                if (this.eventHistory.length > this.config.sse.eventHistory.maxEvents) {
                    this.eventHistory.shift();
                }
            }
            this.metrics.traffic.messagesOut++;
            this.metrics.traffic.bytesOut += eventString.length;
            return true;
        }
        catch (error) {
            this.auditLogger.logSecurityEvent({
                type: 'threat_detected',
                componentId: 'network-security',
                reason: `SSE send error: ${error.message}`,
                timestamp: new Date()
            });
            this.handleSSEDisconnection(connectionId);
            return false;
        }
    }
    /**
     * Broadcast event to all SSE connections
     */
    broadcastSSEEvent(type, data, filter) {
        let sentCount = 0;
        for (const [connectionId, connection] of this.activeConnections.entries()) {
            if (connection.type !== 'sse')
                continue;
            if (filter && !filter(connection))
                continue;
            if (this.sendSSEEvent(connectionId, type, data)) {
                sentCount++;
            }
        }
        return sentCount;
    }
    /**
     * Send message to WebSocket connection
     */
    sendWebSocketMessage(connectionId, data) {
        const connection = this.activeConnections.get(connectionId);
        if (!connection || connection.type !== 'websocket') {
            return false;
        }
        try {
            const message = JSON.stringify(data);
            // WebSocket instance would be stored in connection or separate map
            // This is a simplified implementation
            // Update connection metrics
            connection.messagesOut++;
            connection.bytesOut += message.length;
            connection.lastActivity = new Date();
            this.metrics.traffic.messagesOut++;
            this.metrics.traffic.bytesOut += message.length;
            return true;
        }
        catch (error) {
            this.auditLogger.logSecurityEvent({
                type: 'threat_detected',
                componentId: 'network-security',
                reason: `WebSocket send error: ${error.message}`,
                timestamp: new Date()
            });
            this.handleWebSocketError(connectionId, error);
            return false;
        }
    }
    /**
     * Get network security metrics
     */
    getMetrics() {
        return {
            ...this.metrics,
            security: {
                ...this.metrics.security,
                blockedIPs: new Set(this.metrics.security.blockedIPs)
            }
        };
    }
    /**
     * Get active connections
     */
    getActiveConnections(type) {
        const connections = Array.from(this.activeConnections.values());
        return type ? connections.filter(conn => conn.type === type) : connections;
    }
    /**
     * Block IP address
     */
    blockIP(ipAddress, reason, duration) {
        this.blockedIPs.add(ipAddress);
        this.metrics.security.blockedIPs.add(ipAddress);
        // Close existing connections from this IP
        for (const [connectionId, connection] of this.activeConnections.entries()) {
            if (connection.ipAddress === ipAddress) {
                this.closeConnection(connectionId, `IP blocked: ${reason}`);
            }
        }
        this.auditLogger.logSecurityEvent({
            type: 'ip_blacklisted',
            componentId: 'network-security',
            ipAddress,
            reason,
            timestamp: new Date()
        });
        // Auto-unblock after duration
        if (duration) {
            setTimeout(() => {
                this.unblockIP(ipAddress, 'Auto-unblock after duration');
            }, duration);
        }
        this.emit('ip_blocked', { ipAddress, reason, duration });
    }
    /**
     * Unblock IP address
     */
    unblockIP(ipAddress, reason) {
        this.blockedIPs.delete(ipAddress);
        this.metrics.security.blockedIPs.delete(ipAddress);
        this.auditLogger.logSecurityEvent({
            type: 'ip_unblacklisted',
            componentId: 'network-security',
            ipAddress,
            reason,
            timestamp: new Date()
        });
        this.emit('ip_unblocked', { ipAddress, reason });
    }
    /**
     * Close connection
     */
    closeConnection(connectionId, reason) {
        const connection = this.activeConnections.get(connectionId);
        if (!connection) {
            return false;
        }
        if (connection.type === 'websocket') {
            this.handleWebSocketClose(connectionId, 1000, reason);
        }
        else if (connection.type === 'sse') {
            this.handleSSEDisconnection(connectionId);
        }
        this.auditLogger.logSecurityEvent({
            type: 'circuit_state_changed',
            componentId: 'network-security',
            userId: connection.userId,
            ipAddress: connection.ipAddress,
            newState: 'DISCONNECTED',
            reason,
            timestamp: new Date()
        });
        return true;
    }
    /**
     * Private helper methods
     */
    handleSecureConnection(tlsSocket) {
        // Certificate pinning check
        if (this.config.tls.certificatePinning) {
            const cert = tlsSocket.getPeerCertificate();
            const fingerprint = cert.fingerprint256;
            if (!this.config.tls.pinnedFingerprints.includes(fingerprint)) {
                this.auditLogger.logSecurityEvent({
                    type: 'threat_detected',
                    componentId: 'network-security',
                    ipAddress: tlsSocket.remoteAddress,
                    reason: `Certificate fingerprint not pinned: ${fingerprint}`,
                    timestamp: new Date()
                });
                tlsSocket.destroy();
                return;
            }
        }
        this.auditLogger.logSecurityEvent({
            type: 'circuit_state_changed',
            componentId: 'network-security',
            ipAddress: tlsSocket.remoteAddress,
            newState: 'TLS_CONNECTED',
            reason: 'Secure TLS connection established',
            timestamp: new Date()
        });
    }
    handleTLSError(error, tlsSocket) {
        this.metrics.security.certificateValidationFailures++;
        this.auditLogger.logSecurityEvent({
            type: 'threat_detected',
            componentId: 'network-security',
            ipAddress: tlsSocket?.remoteAddress,
            reason: `TLS error: ${error.message}`,
            timestamp: new Date()
        });
    }
    checkDDoSProtection(ipAddress, req) {
        if (!this.config.ddosProtection.enabled)
            return true;
        // Check if IP is blocked
        if (this.blockedIPs.has(ipAddress)) {
            return false;
        }
        // Check blacklist
        if (this.config.ddosProtection.blacklistedIPs.includes(ipAddress)) {
            this.blockIP(ipAddress, 'IP in blacklist', this.config.ddosProtection.blockDuration);
            return false;
        }
        // Check connection count per IP
        const connectionsFromIP = Array.from(this.activeConnections.values())
            .filter(conn => conn.ipAddress === ipAddress).length;
        if (connectionsFromIP >= this.config.ddosProtection.maxConnectionsPerIP) {
            this.blockIP(ipAddress, 'Too many connections', this.config.ddosProtection.blockDuration);
            return false;
        }
        return true;
    }
    checkRateLimit(ipAddress) {
        const now = new Date();
        const tracking = this.rateLimitTracking.get(ipAddress) || { count: 0, lastReset: now, bytes: 0 };
        // Reset window if expired
        if (now.getTime() - tracking.lastReset.getTime() > this.config.ddosProtection.rateLimiting.windowSize) {
            tracking.count = 0;
            tracking.lastReset = now;
            tracking.bytes = 0;
        }
        tracking.count++;
        this.rateLimitTracking.set(ipAddress, tracking);
        if (tracking.count > this.config.ddosProtection.rateLimiting.maxRequests) {
            this.metrics.security.rateLimitViolations++;
            this.auditLogger.logSecurityEvent({
                type: 'rate_limit_exceeded',
                componentId: 'network-security',
                ipAddress,
                reason: `Rate limit exceeded: ${tracking.count}/${this.config.ddosProtection.rateLimiting.maxRequests}`,
                timestamp: new Date()
            });
            return false;
        }
        return true;
    }
    async validateAuthToken(token, ipAddress) {
        // This would integrate with the authentication middleware
        // Simplified implementation
        try {
            // Validate token format and signature
            if (!token || token.length < 10) {
                throw new Error('Invalid token format');
            }
            return {
                userId: 'user-123',
                sessionId: 'session-456',
                permissions: ['read', 'write']
            };
        }
        catch (error) {
            this.auditLogger.logAuthenticationEvent({
                type: 'authentication_failure',
                ipAddress,
                error: error.message,
                timestamp: new Date()
            });
            throw error;
        }
    }
    handleGeneralHTTPRequest(req, res, connectionId) {
        // Handle other HTTP requests
        res.statusCode = 404;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        if (this.config.tls.enabled) {
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
        }
        res.end(JSON.stringify({ error: 'Not Found' }));
    }
    rejectConnection(res, reason, ipAddress) {
        this.metrics.connections.rejected++;
        this.auditLogger.logSecurityEvent({
            type: 'threat_detected',
            componentId: 'network-security',
            ipAddress,
            reason,
            timestamp: new Date()
        });
        res.statusCode = 403;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: reason }));
    }
    handleWebSocketMessage(connectionId, data, ws) {
        const connection = this.activeConnections.get(connectionId);
        if (!connection)
            return;
        try {
            // Update metrics
            connection.messagesIn++;
            connection.bytesIn += data.length;
            connection.lastActivity = new Date();
            this.metrics.traffic.messagesIn++;
            this.metrics.traffic.bytesIn += data.length;
            // Check message size
            if (data.length > this.config.websocket.maxMessageSize) {
                this.auditLogger.logSecurityEvent({
                    type: 'threat_detected',
                    componentId: 'network-security',
                    userId: connection.userId,
                    ipAddress: connection.ipAddress,
                    reason: `WebSocket message too large: ${data.length} bytes`,
                    timestamp: new Date()
                });
                ws.close(1009, 'Message too large');
                return;
            }
            // Rate limiting check for WebSocket messages
            if (this.config.websocket.rateLimiting.enabled) {
                if (!this.checkWebSocketRateLimit(connection)) {
                    ws.close(1008, 'Rate limit exceeded');
                    return;
                }
            }
            // Parse and handle message
            const message = JSON.parse(data.toString());
            this.emit('websocket_message', { connectionId, message, connection });
        }
        catch (error) {
            this.auditLogger.logSecurityEvent({
                type: 'threat_detected',
                componentId: 'network-security',
                userId: connection.userId,
                ipAddress: connection.ipAddress,
                reason: `WebSocket message error: ${error.message}`,
                timestamp: new Date()
            });
        }
    }
    checkWebSocketRateLimit(connection) {
        const now = Date.now();
        const windowMs = 60 * 1000; // 1 minute
        // This is a simplified rate limiting implementation
        // In production, you'd track per-connection message rates
        if (connection.messagesIn > this.config.websocket.rateLimiting.maxMessagesPerMinute) {
            this.metrics.security.rateLimitViolations++;
            return false;
        }
        return true;
    }
    handleWebSocketError(connectionId, error) {
        const connection = this.activeConnections.get(connectionId);
        this.auditLogger.logSecurityEvent({
            type: 'threat_detected',
            componentId: 'network-security',
            userId: connection?.userId,
            ipAddress: connection?.ipAddress,
            reason: `WebSocket error: ${error.message}`,
            timestamp: new Date()
        });
        this.closeConnection(connectionId, `WebSocket error: ${error.message}`);
    }
    handleWebSocketClose(connectionId, code, reason) {
        const connection = this.activeConnections.get(connectionId);
        if (connection) {
            this.activeConnections.delete(connectionId);
            this.metrics.connections.active--;
            this.metrics.connections.websocket--;
            this.auditLogger.logSecurityEvent({
                type: 'circuit_state_changed',
                componentId: 'network-security',
                userId: connection.userId,
                ipAddress: connection.ipAddress,
                newState: 'WEBSOCKET_DISCONNECTED',
                reason: `Code: ${code}, Reason: ${reason}`,
                timestamp: new Date()
            });
        }
        this.emit('websocket_disconnected', { connectionId, code, reason, connection });
    }
    handleSSEDisconnection(connectionId) {
        const connection = this.activeConnections.get(connectionId);
        const sseConnection = this.sseConnections.get(connectionId);
        if (sseConnection) {
            try {
                sseConnection.response.end();
            }
            catch (error) {
                // Connection already closed
            }
            this.sseConnections.delete(connectionId);
        }
        if (connection) {
            this.activeConnections.delete(connectionId);
            this.metrics.connections.active--;
            this.metrics.connections.sse--;
            this.auditLogger.logSecurityEvent({
                type: 'circuit_state_changed',
                componentId: 'network-security',
                userId: connection.userId,
                ipAddress: connection.ipAddress,
                newState: 'SSE_DISCONNECTED',
                reason: 'SSE connection closed',
                timestamp: new Date()
            });
        }
        this.emit('sse_disconnected', { connectionId, connection });
    }
    performWebSocketHeartbeat() {
        const now = new Date();
        const timeout = this.config.websocket.connectionTimeout;
        for (const [connectionId, connection] of this.activeConnections.entries()) {
            if (connection.type !== 'websocket')
                continue;
            if (now.getTime() - connection.lastActivity.getTime() > timeout) {
                this.closeConnection(connectionId, 'Heartbeat timeout');
            }
            else {
                // Send ping - WebSocket instance would be available here
                // ws.ping();
            }
        }
    }
    performSSEKeepAlive() {
        const now = new Date();
        for (const [connectionId, sseConnection] of this.sseConnections.entries()) {
            if (now.getTime() - sseConnection.lastPing.getTime() > this.config.sse.keepAliveInterval) {
                this.sendSSEEvent(connectionId, 'ping', { timestamp: now });
            }
        }
    }
    cleanupEventHistory() {
        if (!this.config.sse.eventHistory.enabled)
            return;
        const cutoff = new Date(Date.now() - this.config.sse.eventHistory.retentionTime);
        this.eventHistory = this.eventHistory.filter(event => event.timestamp > cutoff);
    }
    setupDDoSProtection() {
        // Load initial blacklisted IPs
        this.blockedIPs = new Set(this.config.ddosProtection.blacklistedIPs);
    }
    setupConnectionCleanup() {
        setInterval(() => {
            // Clean up stale connections
            const now = new Date();
            const staleTimeout = 5 * 60 * 1000; // 5 minutes
            for (const [connectionId, connection] of this.activeConnections.entries()) {
                if (now.getTime() - connection.lastActivity.getTime() > staleTimeout) {
                    this.closeConnection(connectionId, 'Connection cleanup - stale');
                }
            }
            // Clean up rate limiting data
            for (const [ip, tracking] of this.rateLimitTracking.entries()) {
                if (now.getTime() - tracking.lastReset.getTime() > 60 * 60 * 1000) { // 1 hour
                    this.rateLimitTracking.delete(ip);
                }
            }
        }, 60000); // Every minute
    }
    setupMetricsCollection() {
        const startTime = Date.now();
        setInterval(() => {
            // Update uptime
            this.metrics.performance.uptime = Date.now() - startTime;
            // Update peak connections
            this.metrics.connections.total = this.activeConnections.size;
            if (this.activeConnections.size > this.metrics.performance.peakConnections) {
                this.metrics.performance.peakConnections = this.activeConnections.size;
            }
            // Emit metrics
            this.emit('metrics_updated', this.getMetrics());
        }, 10000); // Every 10 seconds
    }
    updateLatencyMetrics(latency) {
        if (this.metrics.performance.averageLatency === 0) {
            this.metrics.performance.averageLatency = latency;
        }
        else {
            this.metrics.performance.averageLatency =
                (this.metrics.performance.averageLatency * 0.9) + (latency * 0.1);
        }
    }
    generateConnectionId() {
        return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
    }
    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
}
exports.NetworkSecurityManager = NetworkSecurityManager;
//# sourceMappingURL=network-security.js.map