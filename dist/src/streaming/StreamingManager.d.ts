/**
 * Visión Maestra: Real-Time Streaming Manager
 * Coordinates WebSocket + SSE streaming for all 6 platform components
 */
import { EventEmitter } from 'events';
import WebSocket from 'ws';
export interface StreamConfig {
    protocol: 'websocket' | 'sse' | 'webhook';
    endpoint: string;
    authentication?: {
        type: 'bearer' | 'api-key' | 'internal';
        credentials: string;
    };
    reconnection: {
        enabled: boolean;
        maxAttempts: number;
        backoffMs: number;
    };
}
export interface ComponentStream {
    componentName: string;
    streamType: 'progress' | 'status' | 'events' | 'data';
    config: StreamConfig;
    connection?: WebSocket | EventSource;
    lastUpdate: Date;
    active: boolean;
}
export interface StreamEvent {
    component: string;
    type: string;
    data: any;
    timestamp: Date;
    workflowId?: string;
    evidenceLevel?: 'SOLID' | 'SOFT' | 'SHAKY' | 'UNKNOWN';
}
export interface EvidenceStreamData {
    decision: string;
    evidence: 'SOLID' | 'SOFT' | 'SHAKY' | 'UNKNOWN';
    confidence: number;
    sources: string[];
    component: string;
    workflowPhase: string;
}
/**
 * Central streaming manager for Visión Maestra platform
 * Coordinates real-time communication between all 6 components
 */
export declare class StreamingManager extends EventEmitter {
    private platformConfig;
    private streams;
    private clients;
    private evidenceBuffer;
    constructor(platformConfig: any);
    /**
     * Initialize streaming for all 6 platform components
     */
    private initializeComponentStreams;
    /**
     * Register a component stream
     */
    private registerStream;
    /**
     * Start streaming for a specific component
     */
    startComponentStream(componentName: string): Promise<boolean>;
    /**
     * Connect to a specific stream based on protocol
     */
    private connectStream;
    /**
     * Connect WebSocket stream
     */
    private connectWebSocket;
    /**
     * Connect Server-Sent Events stream
     */
    private connectSSE;
    /**
     * Setup webhook endpoint for receiving stream data
     */
    private setupWebhook;
    /**
     * Handle incoming stream events from any component
     */
    private handleStreamEvent;
    /**
     * Handle evidence-based stream events for ADW methodology
     */
    private handleEvidenceEvent;
    /**
     * Check if event contains evidence data
     */
    private isEvidenceEvent;
    /**
     * Calculate confidence score from evidence level
     */
    private calculateConfidence;
    /**
     * Broadcast event to all connected WebSocket clients
     */
    private broadcastToClients;
    /**
     * Add WebSocket client for receiving stream updates
     */
    addClient(client: WebSocket): void;
    /**
     * Schedule reconnection for a disconnected stream
     */
    private scheduleReconnection;
    /**
     * Get all streams for a specific component
     */
    private getComponentStreams;
    /**
     * Start streaming for all components
     */
    startAllStreams(): Promise<void>;
    /**
     * Stop all streaming connections
     */
    stopAllStreams(): void;
    /**
     * Get current streaming status for all components
     */
    getStreamingStatus(): any;
    /**
     * Get evidence buffer for ADW quality gates
     */
    getEvidenceBuffer(): EvidenceStreamData[];
    /**
     * Clear evidence buffer
     */
    clearEvidenceBuffer(): void;
}
//# sourceMappingURL=StreamingManager.d.ts.map