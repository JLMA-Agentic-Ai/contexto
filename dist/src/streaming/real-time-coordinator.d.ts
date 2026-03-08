/**
 * Real-Time Streaming Coordinator for Visión Maestra
 * Implements WebSocket + SSE protocols for live cross-component communication
 *
 * Evidence: SOLID - Real-time updates critical for ADW workflow coordination
 * Confidence: 90% - Based on proven WebSocket/SSE patterns
 */
import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import { ServerResponse } from 'http';
import { SecurityBridgeManager } from '../bridges/security/security-bridge-manager';
export interface StreamingConnection {
    id: string;
    type: 'websocket' | 'sse';
    userId: string;
    sessionId: string;
    componentFilter: string[];
    lastActivity: Date;
    socket?: WebSocket;
    response?: ServerResponse;
}
export interface StreamMessage {
    id: string;
    type: string;
    component: string;
    event: string;
    data: any;
    timestamp: Date;
    metadata: {
        priority: 'low' | 'normal' | 'high' | 'critical';
        targets?: string[];
        correlationId?: string;
    };
}
export interface StreamingMetrics {
    totalConnections: number;
    activeConnections: number;
    messagesPerSecond: number;
    averageLatency: number;
    errorRate: number;
    componentBreakdown: Record<string, number>;
}
export declare class RealTimeCoordinator extends EventEmitter {
    private config;
    private wsServer;
    private httpServer;
    private connections;
    private messageQueue;
    private metrics;
    private messageBuffer;
    private securityManager;
    constructor(config: {
        port: number;
        corsOrigins: string[];
        maxConnections: number;
        messageBufferSize: number;
        heartbeatInterval: number;
    }, securityManager: SecurityBridgeManager);
    private initializeMetrics;
    /**
     * Setup WebSocket and HTTP servers for dual-protocol streaming
     */
    private setupServers;
    /**
     * Start the streaming coordinator
     */
    initialize(): Promise<void>;
    /**
     * Handle WebSocket connections
     */
    private handleWebSocketConnection;
    /**
     * Handle Server-Sent Events connections
     */
    private handleHttpRequest;
    /**
     * Handle SSE connections
     */
    private handleSSEConnection;
    /**
     * Broadcast message to all relevant connections
     */
    broadcastMessage(message: StreamMessage): Promise<void>;
    /**
     * Send message to specific connection
     */
    private sendToConnection;
    /**
     * Send SSE formatted message
     */
    private sendSSEMessage;
    /**
     * Get connections that should receive a message
     */
    private getRelevantConnections;
    /**
     * Handle incoming WebSocket message
     */
    private handleWebSocketMessage;
    /**
     * Handle subscription changes
     */
    private handleSubscription;
    /**
     * Handle unsubscription changes
     */
    private handleUnsubscription;
    /**
     * Setup heartbeat for connection health
     */
    private setupHeartbeat;
    /**
     * Authenticate connection using security manager
     */
    private authenticateConnection;
    /**
     * Handle connection closure
     */
    private handleConnectionClose;
    /**
     * Handle connection errors
     */
    private handleConnectionError;
    /**
     * Verify client connection
     */
    private verifyClient;
    /**
     * Set CORS headers
     */
    private setCorsHeaders;
    /**
     * Handle health check endpoint
     */
    private handleHealthCheck;
    /**
     * Start metrics collection
     */
    private startMetricsCollection;
    /**
     * Start connection cleanup
     */
    private startConnectionCleanup;
    /**
     * Calculate real-time metrics
     */
    private calculateMetrics;
    /**
     * Update metrics with new message
     */
    private updateMetrics;
    /**
     * Cleanup stale connections
     */
    private cleanupStaleConnections;
    /**
     * Get current metrics
     */
    getMetrics(): StreamingMetrics;
    /**
     * Generate unique connection ID
     */
    private generateConnectionId;
    /**
     * Generate unique message ID
     */
    private generateMessageId;
    /**
     * Shutdown streaming coordinator
     */
    shutdown(): Promise<void>;
}
//# sourceMappingURL=real-time-coordinator.d.ts.map