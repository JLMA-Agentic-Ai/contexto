/**
 * Visión Maestra: Real-Time Streaming Manager
 * Coordinates WebSocket + SSE streaming for all 6 platform components
 */

import { EventEmitter } from 'events';
import WebSocket from 'ws';

// Streaming Types for 6-Component Integration
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
export class StreamingManager extends EventEmitter {
  private streams: Map<string, ComponentStream> = new Map();
  private clients: Set<WebSocket> = new Set();
  private evidenceBuffer: EvidenceStreamData[] = [];

  constructor(private platformConfig: any) {
    super();
    this.initializeComponentStreams();
  }

  /**
   * Initialize streaming for all 6 platform components
   */
  private initializeComponentStreams(): void {
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
  private registerStream(stream: ComponentStream): void {
    const streamKey = `${stream.componentName}-${stream.streamType}`;
    this.streams.set(streamKey, stream);
    this.emit('stream_registered', { componentName: stream.componentName, streamType: stream.streamType });
  }

  /**
   * Start streaming for a specific component
   */
  async startComponentStream(componentName: string): Promise<boolean> {
    const streams = this.getComponentStreams(componentName);

    let allStarted = true;
    for (const stream of streams) {
      try {
        const success = await this.connectStream(stream);
        if (!success) allStarted = false;
      } catch (error) {
        console.error(`Failed to start stream for ${componentName}:`, error);
        allStarted = false;
      }
    }

    return allStarted;
  }

  /**
   * Connect to a specific stream based on protocol
   */
  private async connectStream(stream: ComponentStream): Promise<boolean> {
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
    } catch (error) {
      this.emit('stream_error', { streamKey, error });
      return false;
    }
  }

  /**
   * Connect WebSocket stream
   */
  private async connectWebSocket(stream: ComponentStream): Promise<boolean> {
    return new Promise((resolve) => {
      const ws = new WebSocket(stream.config.endpoint);

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

      ws.on('message', (data: string) => {
        try {
          const event = JSON.parse(data) as StreamEvent;
          event.component = stream.componentName;
          event.timestamp = new Date();

          this.handleStreamEvent(event);
        } catch (error) {
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
  private async connectSSE(stream: ComponentStream): Promise<boolean> {
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
          const streamEvent = JSON.parse(event.data) as StreamEvent;
          streamEvent.component = stream.componentName;
          streamEvent.timestamp = new Date();

          this.handleStreamEvent(streamEvent);
        } catch (error) {
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
  private async setupWebhook(stream: ComponentStream): Promise<boolean> {
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
  private handleStreamEvent(event: StreamEvent): void {
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
  private handleEvidenceEvent(event: StreamEvent): void {
    if (event.evidenceLevel) {
      const evidenceData: EvidenceStreamData = {
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
  private isEvidenceEvent(event: StreamEvent): boolean {
    return event.evidenceLevel !== undefined ||
           event.data?.confidence !== undefined ||
           event.data?.investigation !== undefined;
  }

  /**
   * Calculate confidence score from evidence level
   */
  private calculateConfidence(evidenceLevel: string): number {
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
  private broadcastToClients(event: StreamEvent): void {
    const message = JSON.stringify(event);

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          console.error('Failed to send message to client:', error);
          this.clients.delete(client);
        }
      } else {
        this.clients.delete(client);
      }
    });
  }

  /**
   * Add WebSocket client for receiving stream updates
   */
  addClient(client: WebSocket): void {
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
  private scheduleReconnection(stream: ComponentStream): void {
    const config = stream.config.reconnection;
    const streamKey = `${stream.componentName}-${stream.streamType}`;

    setTimeout(async () => {
      if (config.maxAttempts > 0) {
        config.maxAttempts--;
        await this.connectStream(stream);
      } else {
        this.emit('stream_failed', { streamKey, reason: 'Max reconnection attempts reached' });
      }
    }, config.backoffMs);
  }

  /**
   * Get all streams for a specific component
   */
  private getComponentStreams(componentName: string): ComponentStream[] {
    return Array.from(this.streams.values())
      .filter(stream => stream.componentName === componentName);
  }

  // Public API methods

  /**
   * Start streaming for all components
   */
  async startAllStreams(): Promise<void> {
    const components = ['dossier', 'ruflo', 'adw-skills', 'gitnexus', 'rlm-navigator', 'claude-code'];

    const startPromises = components.map(component => this.startComponentStream(component));
    await Promise.all(startPromises);
  }

  /**
   * Stop all streaming connections
   */
  stopAllStreams(): void {
    this.streams.forEach(stream => {
      if (stream.connection) {
        if (stream.connection instanceof WebSocket) {
          stream.connection.close();
        } else if (stream.connection instanceof EventSource) {
          stream.connection.close();
        }
      }
      stream.active = false;
    });
  }

  /**
   * Get current streaming status for all components
   */
  getStreamingStatus(): any {
    const status: any = {
      totalStreams: this.streams.size,
      activeStreams: 0,
      componentStatus: {},
      lastUpdate: new Date()
    };

    this.streams.forEach(stream => {
      if (stream.active) status.activeStreams++;

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
  getEvidenceBuffer(): EvidenceStreamData[] {
    return [...this.evidenceBuffer];
  }

  /**
   * Clear evidence buffer
   */
  clearEvidenceBuffer(): void {
    this.evidenceBuffer = [];
  }
}