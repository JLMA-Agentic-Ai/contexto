/**
 * Common Bridge Types and Interfaces
 * Shared types across all integration bridges
 */

// Base configuration interface for all bridges
export interface BaseBridgeConfig {
  name: string;
  version: string;
  enabled: boolean;
  timeout: number;
  retryAttempts: number;
  circuitBreakerThreshold: number;
  healthCheckInterval: number;
}

// Event-driven architecture base types
export interface BridgeEvent<T = unknown> {
  id: string;
  type: string;
  source: string;
  timestamp: Date;
  data: T;
  metadata?: Record<string, any>;
  correlationId?: string;
  traceId?: string;
}

// Stream configuration for real-time updates
export interface StreamConfig {
  type: 'websocket' | 'sse' | 'polling';
  url: string;
  reconnectAttempts: number;
  reconnectDelay: number;
  heartbeatInterval?: number;
  auth?: {
    type: 'bearer' | 'api-key' | 'custom';
    token?: string;
    headers?: Record<string, string>;
  };
}

// Circuit breaker states and configuration
export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  expectedErrors?: string[];
}

// Error types and handling
export interface BridgeError extends Error {
  code: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
  context?: Record<string, any>;
  timestamp: Date;
}

// Health check interface
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  details?: Record<string, any>;
  metrics?: {
    responseTime: number;
    errorRate: number;
    throughput: number;
  };
}

// Evidence tracking for ADW integration
export interface Evidence {
  id: string;
  type: 'observation' | 'hypothesis' | 'test' | 'conclusion';
  source: string;
  timestamp: Date;
  data: any;
  confidence: number; // 0-1
  tags: string[];
  relationships?: {
    supports?: string[];
    contradicts?: string[];
    dependsOn?: string[];
  };
}

// Result wrapper for bridge operations
export interface BridgeResult<T> {
  success: boolean;
  data?: T;
  error?: BridgeError;
  metadata?: {
    duration: number;
    retryCount: number;
    circuitBreakerState: CircuitBreakerState;
  };
}

// Subscription management for event streams
export interface Subscription {
  id: string;
  topics: string[];
  filter?: (event: BridgeEvent) => boolean;
  handler: (event: BridgeEvent) => void | Promise<void>;
  active: boolean;
  createdAt: Date;
  lastTriggered?: Date;
}

// Rate limiting configuration
export interface RateLimitConfig {
  requests: number;
  window: number; // in milliseconds
  strategy: 'fixed-window' | 'sliding-window' | 'token-bucket';
}

// Metrics collection interface
export interface BridgeMetrics {
  requestCount: number;
  errorCount: number;
  averageResponseTime: number;
  circuitBreakerTrips: number;
  lastResetTime: Date;
  customMetrics?: Record<string, number>;
}