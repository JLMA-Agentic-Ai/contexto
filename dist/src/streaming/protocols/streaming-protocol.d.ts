/**
 * Streaming Protocol for Real-time Communication
 * Supports WebSocket, SSE, and gRPC streaming
 */
import { EventEmitter } from 'events';
export interface StreamingConfig {
    websocket: {
        enabled: boolean;
        port: number;
        path: string;
        heartbeatInterval: number;
    };
    sse: {
        enabled: boolean;
        port: number;
        path: string;
        retryInterval: number;
    };
    grpc: {
        enabled: boolean;
        port: number;
        serviceName: string;
    };
    security: {
        authentication: boolean;
        authorization: boolean;
        encryption: boolean;
    };
}
export interface StreamMessage {
    id: string;
    type: string;
    source: string;
    target?: string;
    payload: any;
    timestamp: Date;
    priority: 'low' | 'normal' | 'high' | 'critical';
    metadata: MessageMetadata;
}
export interface MessageMetadata {
    correlationId?: string;
    sessionId?: string;
    userId?: string;
    retryCount?: number;
    ttl?: number;
    headers?: Record<string, string>;
}
export interface StreamSubscription {
    id: string;
    clientId: string;
    channel: string;
    filters: MessageFilter[];
    options: SubscriptionOptions;
    createdAt: Date;
    lastActivity: Date;
}
export interface MessageFilter {
    field: string;
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex';
    value: any;
}
export interface SubscriptionOptions {
    persistent: boolean;
    replay: boolean;
    replayFrom?: Date;
    batchSize?: number;
    compression?: boolean;
}
export interface StreamingMetrics {
    connections: {
        websocket: number;
        sse: number;
        grpc: number;
        total: number;
    };
    messages: {
        sent: number;
        received: number;
        failed: number;
        rate: number;
    };
    performance: {
        averageLatency: number;
        throughput: number;
        errorRate: number;
    };
}
export interface ClientConnection {
    id: string;
    type: 'websocket' | 'sse' | 'grpc';
    userId?: string;
    sessionId: string;
    connectedAt: Date;
    lastActivity: Date;
    subscriptions: Set<string>;
    metadata: any;
}
export declare class StreamingProtocol extends EventEmitter {
    private config;
    private wsServer?;
    private sseClients;
    private grpcServer?;
    private connections;
    private subscriptions;
    private messageHistory;
    private metrics;
    private heartbeatInterval?;
    constructor(config: StreamingConfig);
    private initializeMetrics;
    initialize(): Promise<void>;
    private initializeWebSocket;
    private initializeSSE;
    private initializeGRPC;
    private startHeartbeat;
    private setupMetricsCollection;
    private handleIncomingMessage;
    private handleSubscription;
    private handleUnsubscription;
    private handleBroadcastMessage;
    private handlePing;
    private handleClientDisconnect;
    private handleConnectionError;
    private handleMessageError;
    broadcast(channel: string, data: any, options?: any): Promise<void>;
    sendToClient(clientId: string, data: any): Promise<boolean>;
    private sendWebSocketMessage;
    private sendSSEMessage;
    private sendGRPCMessage;
    private sendHeartbeat;
    private messageMatchesFilters;
    private getNestedValue;
    private storeMessageInHistory;
    private replayMessages;
    private updateClientActivity;
    private updateMetrics;
    getMetrics(): StreamingMetrics;
    getConnections(): ClientConnection[];
    getSubscriptions(clientId?: string): StreamSubscription[];
    private generateClientId;
    private generateMessageId;
    private generateSubscriptionId;
    private extractSessionId;
    shutdown(): Promise<void>;
}
//# sourceMappingURL=streaming-protocol.d.ts.map