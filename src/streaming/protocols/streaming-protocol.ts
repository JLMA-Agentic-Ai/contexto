/**
 * Streaming Protocol for Real-time Communication
 * Supports WebSocket, SSE, and gRPC streaming
 */

import { EventEmitter } from 'events';
import { WebSocketServer } from 'ws';

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
  channel?: string;
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

export class StreamingProtocol extends EventEmitter {
  private config: StreamingConfig;
  private wsServer?: WebSocketServer;
  private sseClients: Map<string, any> = new Map();
  private grpcServer?: any;
  private connections: Map<string, ClientConnection> = new Map();
  private subscriptions: Map<string, StreamSubscription> = new Map();
  private messageHistory: Map<string, StreamMessage[]> = new Map();
  private metrics: StreamingMetrics;
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(config: StreamingConfig) {
    super();
    this.config = config;
    this.metrics = this.initializeMetrics();
  }

  private initializeMetrics(): StreamingMetrics {
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

  async initialize(): Promise<void> {
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

    } catch (error) {
      throw new Error(`Failed to initialize streaming protocol: ${error}`);
    }
  }

  private async initializeWebSocket(): Promise<void> {
    const WebSocket = require('ws');

    this.wsServer = new WebSocket.Server({
      port: this.config.websocket.port,
      path: this.config.websocket.path
    });

    this.wsServer.on('connection', (ws: any, request: any) => {
      const clientId = this.generateClientId();
      const connection: ClientConnection = {
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

      ws.on('message', (data: Buffer) => {
        this.handleIncomingMessage(clientId, 'websocket', data);
      });

      ws.on('close', () => {
        this.handleClientDisconnect(clientId);
      });

      ws.on('error', (error: Error) => {
        this.handleConnectionError(clientId, error);
      });

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'connection:welcome',
        payload: { clientId, serverTime: new Date() }
      });
    });
  }

  private async initializeSSE(): Promise<void> {
    // SSE initialization would be handled by HTTP server
    // This is a simplified implementation
  }

  private async initializeGRPC(): Promise<void> {
    // gRPC initialization would be handled by gRPC server
    // This is a simplified implementation
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.sendHeartbeat();
    }, this.config.websocket.heartbeatInterval);
  }

  private setupMetricsCollection(): void {
    setInterval(() => {
      this.updateMetrics();
    }, 10000); // Update metrics every 10 seconds
  }

  private handleIncomingMessage(clientId: string, protocol: string, data: Buffer): void {
    try {
      const message = JSON.parse(data.toString()) as StreamMessage;
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
    } catch (error) {
      this.metrics.messages.failed++;
      this.handleMessageError(clientId, error as Error);
    }
  }

  private handleSubscription(clientId: string, message: StreamMessage): void {
    const { channel, filters = [], options = {} } = message.payload;

    const subscription: StreamSubscription = {
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

  private handleUnsubscription(clientId: string, message: StreamMessage): void {
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

  private handleBroadcastMessage(sourceClientId: string, message: StreamMessage): void {
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

  private handlePing(clientId: string, message: StreamMessage): void {
    this.sendToClient(clientId, {
      type: 'pong',
      payload: { timestamp: new Date(), originalId: message.id }
    });
  }

  private handleClientDisconnect(clientId: string): void {
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

  private handleConnectionError(clientId: string, error: Error): void {
    console.error(`Connection error for client ${clientId}:`, error);
    this.emit('connection:error', { clientId, error });
  }

  private handleMessageError(clientId: string, error: Error): void {
    console.error(`Message error for client ${clientId}:`, error);
    this.sendToClient(clientId, {
      type: 'error',
      payload: { message: 'Failed to process message', error: error.message }
    });
  }

  async broadcast(channel: string, data: any, options?: any): Promise<void> {
    const message: StreamMessage = {
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

  async sendToClient(clientId: string, data: any): Promise<boolean> {
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
    } catch (error) {
      this.metrics.messages.failed++;
      return false;
    }
  }

  private sendWebSocketMessage(clientId: string, data: any): boolean {
    if (this.wsServer) {
      const client = Array.from(this.wsServer.clients).find((ws: any) => ws.clientId === clientId);
      if (client && client.readyState === 1) { // WebSocket.OPEN
        client.send(JSON.stringify(data));
        this.metrics.messages.sent++;
        return true;
      }
    }
    return false;
  }

  private sendSSEMessage(clientId: string, data: any): boolean {
    const sseClient = this.sseClients.get(clientId);
    if (sseClient) {
      sseClient.write(`data: ${JSON.stringify(data)}\n\n`);
      this.metrics.messages.sent++;
      return true;
    }
    return false;
  }

  private sendGRPCMessage(clientId: string, data: any): boolean {
    // Implement gRPC message sending
    return false;
  }

  private sendHeartbeat(): void {
    const heartbeatMessage = {
      type: 'heartbeat',
      payload: { timestamp: new Date() }
    };

    for (const clientId of this.connections.keys()) {
      this.sendToClient(clientId, heartbeatMessage);
    }
  }

  private messageMatchesFilters(message: StreamMessage, filters: MessageFilter[]): boolean {
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

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  private storeMessageInHistory(channel: string, message: StreamMessage): void {
    if (!this.messageHistory.has(channel)) {
      this.messageHistory.set(channel, []);
    }

    const channelHistory = this.messageHistory.get(channel)!;
    channelHistory.push(message);

    // Keep only recent messages (e.g., last 1000)
    if (channelHistory.length > 1000) {
      channelHistory.shift();
    }
  }

  private replayMessages(clientId: string, channel: string, from: Date): void {
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

  private updateClientActivity(clientId: string): void {
    const connection = this.connections.get(clientId);
    if (connection) {
      connection.lastActivity = new Date();
    }
  }

  private updateMetrics(): void {
    // Calculate message rate
    const now = Date.now();
    const timeWindow = 10000; // 10 seconds

    // Calculate average latency, throughput, error rate
    // This would involve more sophisticated tracking

    this.emit('metrics:updated', this.metrics);
  }

  getMetrics(): StreamingMetrics {
    return { ...this.metrics };
  }

  getConnections(): ClientConnection[] {
    return Array.from(this.connections.values());
  }

  getSubscriptions(clientId?: string): StreamSubscription[] {
    const subs = Array.from(this.subscriptions.values());
    return clientId ? subs.filter(sub => sub.clientId === clientId) : subs;
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  private extractSessionId(request: any): string {
    // Extract session ID from request headers or generate one
    return request.headers['x-session-id'] || this.generateClientId();
  }

  async shutdown(): Promise<void> {
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