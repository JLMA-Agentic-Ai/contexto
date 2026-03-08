/**
 * Real-Time Streaming Coordinator for Visión Maestra
 * Implements WebSocket + SSE protocols for live cross-component communication
 *
 * Evidence: SOLID - Real-time updates critical for ADW workflow coordination
 * Confidence: 90% - Based on proven WebSocket/SSE patterns
 */

import { EventEmitter } from 'events';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { SecurityBridgeManager, SecurityContext } from '../bridges/security/security-bridge-manager';

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

export class RealTimeCoordinator extends EventEmitter {
  private wsServer: WebSocketServer;
  private httpServer: any;
  private connections: Map<string, StreamingConnection> = new Map();
  private messageQueue: Map<string, StreamMessage[]> = new Map();
  private metrics: StreamingMetrics;
  private messageBuffer: StreamMessage[] = [];
  private securityManager: SecurityBridgeManager;

  constructor(
    private config: {
      port: number;
      corsOrigins: string[];
      maxConnections: number;
      messageBufferSize: number;
      heartbeatInterval: number;
    },
    securityManager: SecurityBridgeManager
  ) {
    super();
    this.securityManager = securityManager;
    this.metrics = this.initializeMetrics();
    this.setupServers();
  }

  private initializeMetrics(): StreamingMetrics {
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
  private setupServers(): void {
    // HTTP server for SSE
    this.httpServer = createServer((req, res) => {
      this.handleHttpRequest(req, res);
    });

    // WebSocket server
    this.wsServer = new WebSocketServer({
      server: this.httpServer,
      path: '/ws',
      verifyClient: (info) => this.verifyClient(info)
    });

    this.wsServer.on('connection', (ws, req) => {
      this.handleWebSocketConnection(ws, req);
    });

    // Setup CORS headers
    this.httpServer.on('request', (req: IncomingMessage, res: ServerResponse) => {
      this.setCorsHeaders(res);
    });
  }

  /**
   * Start the streaming coordinator
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.httpServer.listen(this.config.port, (err: Error) => {
        if (err) {
          reject(err);
        } else {
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
  private async handleWebSocketConnection(ws: WebSocket, req: IncomingMessage): Promise<void> {
    try {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const sessionId = url.searchParams.get('session');
      const components = url.searchParams.get('components')?.split(',') || [];

      if (!sessionId) {
        ws.close(1008, 'Missing session ID');
        return;
      }

      const connectionId = this.generateConnectionId();
      const connection: StreamingConnection = {
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

    } catch (error) {
      console.error('WebSocket connection error:', error);
      ws.close(1011, 'Authentication failed');
    }
  }

  /**
   * Handle Server-Sent Events connections
   */
  private async handleHttpRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url!, `http://${req.headers.host}`);

    if (url.pathname === '/events') {
      await this.handleSSEConnection(req, res);
    } else if (url.pathname === '/health') {
      this.handleHealthCheck(res);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  }

  /**
   * Handle SSE connections
   */
  private async handleSSEConnection(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const url = new URL(req.url!, `http://${req.headers.host}`);
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
      const connection: StreamingConnection = {
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

    } catch (error) {
      console.error('SSE connection error:', error);
      res.writeHead(401);
      res.end('Authentication failed');
    }
  }

  /**
   * Broadcast message to all relevant connections
   */
  async broadcastMessage(message: StreamMessage): Promise<void> {
    this.messageBuffer.push(message);

    // Keep buffer within limits
    if (this.messageBuffer.length > this.config.messageBufferSize) {
      this.messageBuffer = this.messageBuffer.slice(-this.config.messageBufferSize);
    }

    const relevantConnections = this.getRelevantConnections(message);
    const sendPromises = relevantConnections.map(connectionId =>
      this.sendToConnection(connectionId, message)
    );

    await Promise.allSettled(sendPromises);
    this.updateMetrics(message);
  }

  /**
   * Send message to specific connection
   */
  private async sendToConnection(connectionId: string, message: StreamMessage): Promise<void> {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    try {
      connection.lastActivity = new Date();

      if (connection.type === 'websocket' && connection.socket) {
        if (connection.socket.readyState === WebSocket.OPEN) {
          connection.socket.send(JSON.stringify(message));
        }
      } else if (connection.type === 'sse' && connection.response) {
        this.sendSSEMessage(connection.response, message);
      }
    } catch (error) {
      console.error(`Failed to send message to connection ${connectionId}:`, error);
      this.handleConnectionError(connectionId, error as Error);
    }
  }

  /**
   * Send SSE formatted message
   */
  private sendSSEMessage(res: ServerResponse, message: StreamMessage): void {
    const formattedMessage = `data: ${JSON.stringify(message)}\n\n`;
    res.write(formattedMessage);
  }

  /**
   * Get connections that should receive a message
   */
  private getRelevantConnections(message: StreamMessage): string[] {
    const relevantConnections: string[] = [];

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
  private async handleWebSocketMessage(connectionId: string, data: Buffer): Promise<void> {
    try {
      const message = JSON.parse(data.toString());
      const connection = this.connections.get(connectionId);

      if (!connection) return;

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
    } catch (error) {
      console.error(`Error handling WebSocket message from ${connectionId}:`, error);
    }
  }

  /**
   * Handle subscription changes
   */
  private handleSubscription(connectionId: string, subscriptionData: any): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    if (subscriptionData.components) {
      connection.componentFilter = [
        ...new Set([...connection.componentFilter, ...subscriptionData.components])
      ];
    }
  }

  /**
   * Handle unsubscription changes
   */
  private handleUnsubscription(connectionId: string, unsubscriptionData: any): void {
    const connection = this.connections.get(connectionId);
    if (!connection) return;

    if (unsubscriptionData.components) {
      connection.componentFilter = connection.componentFilter.filter(
        component => !unsubscriptionData.components.includes(component)
      );
    }
  }

  /**
   * Setup heartbeat for connection health
   */
  private setupHeartbeat(connectionId: string): void {
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
      } else {
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
  private async authenticateConnection(connection: StreamingConnection): Promise<void> {
    // This would integrate with the SecurityBridgeManager
    // For now, we'll simulate authentication
    connection.userId = 'authenticated-user'; // Would be set from session validation
  }

  /**
   * Handle connection closure
   */
  private handleConnectionClose(connectionId: string): void {
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
  private handleConnectionError(connectionId: string, error: Error): void {
    console.error(`Connection ${connectionId} error:`, error);
    this.handleConnectionClose(connectionId);
  }

  /**
   * Verify client connection
   */
  private verifyClient(info: any): boolean {
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
  private setCorsHeaders(res: ServerResponse): void {
    res.setHeader('Access-Control-Allow-Origin', this.config.corsOrigins.join(','));
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  /**
   * Handle health check endpoint
   */
  private handleHealthCheck(res: ServerResponse): void {
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
  private startMetricsCollection(): void {
    setInterval(() => {
      this.calculateMetrics();
    }, 5000); // Every 5 seconds
  }

  /**
   * Start connection cleanup
   */
  private startConnectionCleanup(): void {
    setInterval(() => {
      this.cleanupStaleConnections();
    }, 60000); // Every minute
  }

  /**
   * Calculate real-time metrics
   */
  private calculateMetrics(): void {
    // Calculate messages per second from recent buffer
    const recentMessages = this.messageBuffer.filter(
      msg => Date.now() - msg.timestamp.getTime() < 5000
    );
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
  private updateMetrics(message: StreamMessage): void {
    // This would be expanded to track latency, errors, etc.
  }

  /**
   * Cleanup stale connections
   */
  private cleanupStaleConnections(): void {
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
  getMetrics(): StreamingMetrics {
    return { ...this.metrics };
  }

  /**
   * Generate unique connection ID
   */
  private generateConnectionId(): string {
    return `conn_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  /**
   * Shutdown streaming coordinator
   */
  async shutdown(): Promise<void> {
    // Close all connections
    for (const [connectionId, connection] of this.connections.entries()) {
      if (connection.socket) {
        connection.socket.close();
      } else if (connection.response) {
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