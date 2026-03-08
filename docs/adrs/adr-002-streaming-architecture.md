# ADR-002: Real-time Streaming Architecture

## Status
**Accepted** - 2026-03-08

## Context

Visión Maestra requires real-time communication between components for:

1. **Live Updates**: Development progress, file changes, build status
2. **Interactive Collaboration**: Multiple users working on the same project
3. **Workflow Coordination**: Real-time orchestration of complex workflows
4. **System Monitoring**: Live health metrics and performance data
5. **Event Propagation**: Component state changes need immediate propagation

The system needs to support:
- **High Throughput**: 1000+ messages per second during peak usage
- **Low Latency**: Sub-100ms message delivery
- **Multiple Protocols**: Different use cases require different protocols
- **Scalability**: Support for 100+ concurrent connections
- **Reliability**: Message delivery guarantees and fault tolerance

## Decision

We will implement a **Multi-Protocol Streaming Architecture** with three communication channels:

### 1. WebSocket Protocol
**Primary Use**: Bidirectional real-time communication

```typescript
interface WebSocketConfig {
  enabled: boolean;
  port: number;
  path: string;
  heartbeatInterval: number;
  maxConnections: number;
}
```

**Use Cases**:
- Dossier ↔ Platform Orchestrator communication
- Interactive user sessions
- Real-time collaborative editing
- Immediate command responses

**Benefits**:
- Full duplex communication
- Low overhead after connection establishment
- Native browser support
- Persistent connections

### 2. Server-Sent Events (SSE)
**Primary Use**: One-way streaming from server to clients

```typescript
interface SSEConfig {
  enabled: boolean;
  port: number;
  path: string;
  retryInterval: number;
  maxConnections: number;
}
```

**Use Cases**:
- Live dashboard updates
- Build and deployment progress
- System notifications
- Log streaming

**Benefits**:
- Automatic reconnection
- Built-in retry mechanism
- HTTP-based (firewall friendly)
- Simpler than WebSocket for one-way communication

### 3. gRPC Streaming (Future)
**Primary Use**: High-performance component-to-component communication

```typescript
interface GRPCConfig {
  enabled: boolean;
  port: number;
  serviceName: string;
  reflection: boolean;
}
```

**Use Cases**:
- Component bridge communication
- Bulk data transfer
- High-frequency updates
- Service mesh communication

**Benefits**:
- High performance
- Strong typing
- Built-in load balancing
- Language agnostic

### 4. Unified Streaming Protocol

All protocols will be managed by a single `StreamingProtocol` class:

```typescript
class StreamingProtocol {
  // Multi-protocol message handling
  async broadcast(channel: string, data: any): Promise<void>
  async sendToClient(clientId: string, data: any): Promise<boolean>

  // Subscription management
  subscribe(clientId: string, channel: string, filters?: MessageFilter[]): void
  unsubscribe(clientId: string, subscriptionId: string): void

  // Health and metrics
  getMetrics(): StreamingMetrics
  getConnections(): ClientConnection[]
}
```

## Implementation Details

### Message Format

Standardized message format across all protocols:

```typescript
interface StreamMessage {
  id: string;
  type: string;
  source: string;
  target?: string;
  payload: any;
  timestamp: Date;
  priority: 'low' | 'normal' | 'high' | 'critical';
  metadata: {
    correlationId?: string;
    sessionId?: string;
    userId?: string;
    retryCount?: number;
    ttl?: number;
  };
}
```

### Channel Management

Predefined channels for different data types:

```typescript
enum StreamChannel {
  PLATFORM_EVENTS = 'platform.events',
  COMPONENT_STATUS = 'component.status',
  WORKFLOW_PROGRESS = 'workflow.progress',
  USER_ACTIONS = 'user.actions',
  FILE_CHANGES = 'file.changes',
  BUILD_UPDATES = 'build.updates',
  SYSTEM_METRICS = 'system.metrics',
  NOTIFICATIONS = 'notifications'
}
```

### Subscription Filtering

Advanced filtering capabilities:

```typescript
interface MessageFilter {
  field: string;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex';
  value: any;
}

// Example: Filter for specific project updates
const projectFilter: MessageFilter = {
  field: 'payload.projectId',
  operator: 'equals',
  value: 'proj_12345'
};
```

### Connection Management

Robust connection handling:

```typescript
interface ClientConnection {
  id: string;
  type: 'websocket' | 'sse' | 'grpc';
  userId?: string;
  sessionId: string;
  connectedAt: Date;
  lastActivity: Date;
  subscriptions: Set<string>;
  metadata: any;
}
```

## Protocol Selection Guidelines

### WebSocket Usage
✅ **Use When**:
- Bidirectional communication needed
- Interactive user sessions
- Real-time collaboration features
- Immediate response requirements

❌ **Avoid When**:
- Simple one-way updates
- High-frequency bulk data
- Client doesn't need to send messages

### SSE Usage
✅ **Use When**:
- Server-to-client updates only
- Dashboard data feeds
- Progress monitoring
- Notifications

❌ **Avoid When**:
- Bidirectional communication needed
- High-frequency updates (>10/sec)
- Binary data transfer

### gRPC Usage
✅ **Use When**:
- Component-to-component communication
- High-performance requirements
- Strong typing needed
- Bulk data transfer

❌ **Avoid When**:
- Browser-based clients
- Simple text updates
- Firewall restrictions

## Performance Considerations

### Connection Pooling
```typescript
interface ConnectionPool {
  maxConnections: number;
  reuseConnections: boolean;
  connectionTimeout: number;
  idleTimeout: number;
}
```

### Message Batching
```typescript
interface BatchingConfig {
  enabled: boolean;
  maxBatchSize: number;
  flushInterval: number;
  priorityBatching: boolean;
}
```

### Compression
```typescript
interface CompressionConfig {
  enabled: boolean;
  algorithm: 'gzip' | 'deflate' | 'br';
  threshold: number; // Min message size to compress
}
```

## Reliability Features

### Message Persistence
```typescript
interface MessageHistory {
  enabled: boolean;
  maxMessages: number;
  ttl: number; // Time to live in milliseconds
  channels: string[]; // Which channels to persist
}
```

### Automatic Reconnection
```typescript
interface ReconnectionConfig {
  enabled: boolean;
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential';
  baseDelay: number;
  maxDelay: number;
}
```

### Health Monitoring
```typescript
interface StreamingMetrics {
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
```

## Security Implementation

### Authentication
- JWT tokens for session authentication
- API keys for component authentication
- Certificate-based auth for gRPC

### Authorization
- Channel-level permissions
- Message filtering based on user roles
- Rate limiting per connection

### Encryption
- TLS for all external connections
- Optional message payload encryption
- Certificate pinning for gRPC

## Monitoring and Observability

### Metrics Collection
```typescript
interface MonitoringConfig {
  enabled: boolean;
  metricsInterval: number;
  customMetrics: string[];
  alertThresholds: {
    connectionLimit: number;
    errorRateLimit: number;
    latencyLimit: number;
  };
}
```

### Logging
- Structured JSON logs
- Message tracing with correlation IDs
- Performance metrics logging
- Error and exception tracking

## Consequences

### Positive
1. **Real-time Experience**: Immediate updates across all components
2. **Protocol Flexibility**: Right protocol for each use case
3. **Scalability**: Can handle high connection counts
4. **Reliability**: Robust error handling and reconnection
5. **Developer Experience**: Simple, consistent API

### Negative
1. **Complexity**: Multiple protocols increase maintenance burden
2. **Resource Usage**: Persistent connections consume memory
3. **Network Load**: Real-time updates generate network traffic
4. **Debugging**: Distributed real-time systems harder to debug

### Mitigation Strategies

1. **Protocol Management**: Clear guidelines on when to use each protocol
2. **Resource Monitoring**: Active monitoring of connection and memory usage
3. **Intelligent Batching**: Reduce network load through smart batching
4. **Comprehensive Logging**: Detailed logging for debugging support

## Testing Strategy

### Unit Tests
- Message serialization/deserialization
- Filter logic validation
- Connection management logic

### Integration Tests
- Multi-protocol communication
- End-to-end message delivery
- Error handling and recovery

### Load Tests
- 1000+ concurrent connections
- High-frequency message delivery
- Memory usage under load
- Graceful degradation testing

### Chaos Tests
- Network partition handling
- Component failure scenarios
- Message ordering validation

## Migration Plan

### Phase 1: WebSocket Foundation
- Implement basic WebSocket server
- Message format and routing
- Connection management
- Basic authentication

### Phase 2: SSE Integration
- Add SSE endpoint
- Unified message broadcasting
- Subscription management
- Basic filtering

### Phase 3: Advanced Features
- Message persistence
- Advanced filtering
- Metrics collection
- Performance optimization

### Phase 4: gRPC (Future)
- gRPC service implementation
- Component bridge integration
- Performance benchmarking
- Production deployment

## Success Metrics

1. **Latency**: 95th percentile < 100ms
2. **Throughput**: Handle 1000+ messages/second
3. **Reliability**: 99.9% message delivery success
4. **Scalability**: Support 500+ concurrent connections
5. **Developer Experience**: Simple API adoption

## Related Decisions

- ADR-001: Platform Integration Strategy
- ADR-003: Error Handling and Recovery Patterns
- ADR-004: Security Architecture
- ADR-005: Performance Monitoring Strategy

---

**Decision Authors**: System Architecture Team
**Implementation Lead**: Platform Team
**Review Date**: 2026-06-08