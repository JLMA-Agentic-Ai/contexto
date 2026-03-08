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
import { EventEmitter } from 'events';
import { SecurityAuditLogger } from './audit-logger';
import { AuthenticationMiddleware } from './authentication-middleware';
export interface TLSConfig {
    enabled: boolean;
    version: '1.2' | '1.3';
    certificatePath: string;
    privateKeyPath: string;
    caPath?: string;
    certificatePinning: boolean;
    pinnedFingerprints: string[];
    requireClientCertificate: boolean;
    cipherSuites: string[];
    dhParamPath?: string;
}
export interface WebSocketConfig {
    enabled: boolean;
    port: number;
    path: string;
    maxConnections: number;
    connectionTimeout: number;
    heartbeatInterval: number;
    maxMessageSize: number;
    rateLimiting: {
        enabled: boolean;
        maxMessagesPerMinute: number;
        maxBytesPerMinute: number;
        banDuration: number;
    };
    compression: boolean;
    origins: string[];
}
export interface ServerSentEventsConfig {
    enabled: boolean;
    port: number;
    path: string;
    maxConnections: number;
    keepAliveInterval: number;
    retryInterval: number;
    maxEventSize: number;
    eventHistory: {
        enabled: boolean;
        maxEvents: number;
        retentionTime: number;
    };
}
export interface DDoSProtectionConfig {
    enabled: boolean;
    maxConnectionsPerIP: number;
    maxRequestsPerIP: number;
    blockDuration: number;
    whitelistedIPs: string[];
    blacklistedIPs: string[];
    geoBlocking: {
        enabled: boolean;
        allowedCountries: string[];
        deniedCountries: string[];
    };
    rateLimiting: {
        windowSize: number;
        maxRequests: number;
        burstSize: number;
    };
}
export interface NetworkSecurityMetrics {
    connections: {
        active: number;
        total: number;
        rejected: number;
        websocket: number;
        sse: number;
    };
    traffic: {
        bytesIn: number;
        bytesOut: number;
        messagesIn: number;
        messagesOut: number;
    };
    security: {
        blockedIPs: Set<string>;
        threatDetections: number;
        rateLimitViolations: number;
        certificateValidationFailures: number;
    };
    performance: {
        averageLatency: number;
        peakConnections: number;
        uptime: number;
    };
}
export interface NetworkConnection {
    id: string;
    type: 'websocket' | 'sse' | 'http';
    ipAddress: string;
    userAgent: string;
    userId?: string;
    sessionId?: string;
    connectedAt: Date;
    lastActivity: Date;
    bytesIn: number;
    bytesOut: number;
    messagesIn: number;
    messagesOut: number;
    securityFlags: string[];
}
export declare class NetworkSecurityManager extends EventEmitter {
    private config;
    private authMiddleware;
    private auditLogger;
    private httpsServer?;
    private httpServer?;
    private webSocketServer?;
    private activeConnections;
    private blockedIPs;
    private rateLimitTracking;
    private metrics;
    private sseConnections;
    private eventHistory;
    constructor(config: {
        tls: TLSConfig;
        websocket: WebSocketConfig;
        sse: ServerSentEventsConfig;
        ddosProtection: DDoSProtectionConfig;
    }, authMiddleware: AuthenticationMiddleware, auditLogger: SecurityAuditLogger);
    /**
     * Initialize network security manager
     */
    initialize(): Promise<void>;
    /**
     * Initialize HTTPS server with TLS security
     */
    private initializeHTTPSServer;
    /**
     * Initialize HTTP server (for development or when TLS is disabled)
     */
    private initializeHTTPServer;
    /**
     * Initialize WebSocket server with security
     */
    private initializeWebSocketServer;
    /**
     * Initialize Server-Sent Events endpoint
     */
    private initializeSSEServer;
    /**
     * Handle HTTP requests with security validation
     */
    private handleHTTPRequest;
    /**
     * Handle Server-Sent Events connection
     */
    private handleSSEConnection;
    /**
     * Handle WebSocket connection with security validation
     */
    private handleWebSocketConnection;
    /**
     * Verify WebSocket client during handshake
     */
    private verifyWebSocketClient;
    /**
     * Send event to SSE connection
     */
    sendSSEEvent(connectionId: string, type: string, data: any): boolean;
    /**
     * Broadcast event to all SSE connections
     */
    broadcastSSEEvent(type: string, data: any, filter?: (connection: NetworkConnection) => boolean): number;
    /**
     * Send message to WebSocket connection
     */
    sendWebSocketMessage(connectionId: string, data: any): boolean;
    /**
     * Get network security metrics
     */
    getMetrics(): NetworkSecurityMetrics;
    /**
     * Get active connections
     */
    getActiveConnections(type?: 'websocket' | 'sse'): NetworkConnection[];
    /**
     * Block IP address
     */
    blockIP(ipAddress: string, reason: string, duration?: number): void;
    /**
     * Unblock IP address
     */
    unblockIP(ipAddress: string, reason: string): void;
    /**
     * Close connection
     */
    closeConnection(connectionId: string, reason: string): boolean;
    /**
     * Private helper methods
     */
    private handleSecureConnection;
    private handleTLSError;
    private checkDDoSProtection;
    private checkRateLimit;
    private validateAuthToken;
    private handleGeneralHTTPRequest;
    private rejectConnection;
    private handleWebSocketMessage;
    private checkWebSocketRateLimit;
    private handleWebSocketError;
    private handleWebSocketClose;
    private handleSSEDisconnection;
    private performWebSocketHeartbeat;
    private performSSEKeepAlive;
    private cleanupEventHistory;
    private setupDDoSProtection;
    private setupConnectionCleanup;
    private setupMetricsCollection;
    private updateLatencyMetrics;
    private generateConnectionId;
    private generateEventId;
}
//# sourceMappingURL=network-security.d.ts.map