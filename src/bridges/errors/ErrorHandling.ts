/**
 * Error Handling Patterns
 * Comprehensive error handling and recovery patterns for bridges
 */

import { BridgeError, CircuitBreakerState } from '../types/common.js';

// Error classification and categorization
export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  RATE_LIMIT = 'rate_limit',
  TIMEOUT = 'timeout',
  VALIDATION = 'validation',
  BUSINESS_LOGIC = 'business_logic',
  RESOURCE = 'resource',
  CONFIGURATION = 'configuration',
  DEPENDENCY = 'dependency',
  SYSTEM = 'system',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  operation: string;
  bridge: string;
  component?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  parameters?: Record<string, any>;
  environment?: Record<string, any>;
  stackTrace?: string[];
  previousErrors?: BridgeError[];
  timestamp: Date;
}

export interface ErrorRecoveryStrategy {
  type: 'retry' | 'fallback' | 'circuit_breaker' | 'graceful_degradation' | 'fail_fast' | 'custom';
  maxAttempts?: number;
  backoffStrategy?: BackoffStrategy;
  fallbackAction?: () => Promise<any>;
  condition?: (error: BridgeError, attempt: number) => boolean;
  customHandler?: (error: BridgeError, context: ErrorContext) => Promise<any>;
}

export interface BackoffStrategy {
  type: 'fixed' | 'linear' | 'exponential' | 'custom';
  baseDelay: number;
  maxDelay?: number;
  multiplier?: number;
  jitter?: boolean;
  customCalculator?: (attempt: number) => number;
}

export interface ErrorMetrics {
  totalErrors: number;
  errorsByCategory: Record<ErrorCategory, number>;
  errorsBySeverity: Record<ErrorSeverity, number>;
  errorsByCode: Record<string, number>;
  errorRate: number;
  meanTimeToResolve: number;
  lastError?: BridgeError;
  lastReset: Date;
}

export interface ErrorAlert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  error: BridgeError;
  context: ErrorContext;
  actions: ErrorAction[];
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  createdAt: Date;
}

export interface ErrorAction {
  id: string;
  name: string;
  description: string;
  type: 'automatic' | 'manual' | 'escalation';
  execute: (error: BridgeError, context: ErrorContext) => Promise<void>;
  condition?: (error: BridgeError, context: ErrorContext) => boolean;
}

// Enhanced error class with rich metadata
export class EnhancedBridgeError extends Error implements BridgeError {
  public readonly code: string;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly retryable: boolean;
  public readonly context: ErrorContext;
  public readonly cause?: Error;
  public readonly timestamp: Date;
  public readonly fingerprint: string;

  constructor(
    code: string,
    message: string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: Partial<ErrorContext> = {},
    cause?: Error
  ) {
    super(message);
    this.name = 'EnhancedBridgeError';
    this.code = code;
    this.category = category;
    this.severity = severity;
    this.retryable = this.isRetryable(category, code);
    this.cause = cause;
    this.timestamp = new Date();

    this.context = {
      operation: 'unknown',
      bridge: 'unknown',
      timestamp: this.timestamp,
      ...context
    };

    this.fingerprint = this.generateFingerprint();

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EnhancedBridgeError);
    }
  }

  private isRetryable(category: ErrorCategory, code: string): boolean {
    // Network and timeout errors are generally retryable
    if (category === ErrorCategory.NETWORK || category === ErrorCategory.TIMEOUT) {
      return true;
    }

    // Rate limiting is retryable with backoff
    if (category === ErrorCategory.RATE_LIMIT) {
      return true;
    }

    // Some specific codes are retryable
    const retryableCodes = [
      'TEMPORARY_FAILURE',
      'SERVICE_UNAVAILABLE',
      'CONNECTION_RESET',
      'RESOURCE_EXHAUSTED'
    ];

    return retryableCodes.includes(code);
  }

  private generateFingerprint(): string {
    // Create a unique fingerprint for error deduplication
    const components = [
      this.code,
      this.category,
      this.context.operation,
      this.context.bridge,
      this.context.component || ''
    ];

    return components.join('|');
  }

  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      severity: this.severity,
      retryable: this.retryable,
      context: this.context,
      fingerprint: this.fingerprint,
      timestamp: this.timestamp,
      stack: this.stack
    };
  }
}

// Error handler for different error patterns
export class ErrorHandler {
  private strategies: Map<string, ErrorRecoveryStrategy> = new Map();
  private metrics: Map<string, ErrorMetrics> = new Map();
  private alerts: Map<string, ErrorAlert> = new Map();

  constructor() {
    this.registerDefaultStrategies();
  }

  // Register error recovery strategy for specific patterns
  public registerStrategy(pattern: string, strategy: ErrorRecoveryStrategy): void {
    this.strategies.set(pattern, strategy);
  }

  // Handle error with appropriate strategy
  public async handleError<T>(
    error: Error,
    context: ErrorContext,
    operation: () => Promise<T>
  ): Promise<T> {
    const bridgeError = this.enhanceError(error, context);
    this.recordError(bridgeError);

    const strategy = this.selectStrategy(bridgeError);

    switch (strategy.type) {
      case 'retry':
        return this.retryWithBackoff(operation, strategy, bridgeError, context);

      case 'fallback':
        try {
          return await operation();
        } catch (retryError) {
          if (strategy.fallbackAction) {
            return await strategy.fallbackAction();
          }
          throw this.enhanceError(retryError, context);
        }

      case 'circuit_breaker':
        return this.handleWithCircuitBreaker(operation, bridgeError, context);

      case 'graceful_degradation':
        return this.handleWithGracefulDegradation(operation, strategy, context);

      case 'fail_fast':
        throw bridgeError;

      case 'custom':
        if (strategy.customHandler) {
          return await strategy.customHandler(bridgeError, context);
        }
        throw bridgeError;

      default:
        throw bridgeError;
    }
  }

  // Enhance basic error with rich metadata
  private enhanceError(error: Error, context: ErrorContext): EnhancedBridgeError {
    if (error instanceof EnhancedBridgeError) {
      return error;
    }

    const category = this.categorizeError(error);
    const severity = this.assessSeverity(error, category);
    const code = this.extractErrorCode(error);

    return new EnhancedBridgeError(
      code,
      error.message,
      category,
      severity,
      context,
      error
    );
  }

  // Categorize error based on error characteristics
  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    if (message.includes('network') || message.includes('connection') || errorName.includes('network')) {
      return ErrorCategory.NETWORK;
    }

    if (message.includes('timeout') || errorName.includes('timeout')) {
      return ErrorCategory.TIMEOUT;
    }

    if (message.includes('unauthorized') || message.includes('authentication')) {
      return ErrorCategory.AUTHENTICATION;
    }

    if (message.includes('forbidden') || message.includes('permission')) {
      return ErrorCategory.AUTHORIZATION;
    }

    if (message.includes('rate limit') || message.includes('too many requests')) {
      return ErrorCategory.RATE_LIMIT;
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorCategory.VALIDATION;
    }

    if (message.includes('resource') || message.includes('memory') || message.includes('disk')) {
      return ErrorCategory.RESOURCE;
    }

    if (message.includes('configuration') || message.includes('config')) {
      return ErrorCategory.CONFIGURATION;
    }

    return ErrorCategory.UNKNOWN;
  }

  // Assess error severity
  private assessSeverity(error: Error, category: ErrorCategory): ErrorSeverity {
    // Critical categories
    if (category === ErrorCategory.SYSTEM || category === ErrorCategory.RESOURCE) {
      return ErrorSeverity.CRITICAL;
    }

    // High severity categories
    if (category === ErrorCategory.AUTHENTICATION || category === ErrorCategory.CONFIGURATION) {
      return ErrorSeverity.HIGH;
    }

    // Medium severity by default
    return ErrorSeverity.MEDIUM;
  }

  // Extract error code from various error formats
  private extractErrorCode(error: Error): string {
    // Check if error already has a code property
    if ('code' in error && typeof error.code === 'string') {
      return error.code;
    }

    // Extract from error name
    if (error.name !== 'Error') {
      return error.name.toUpperCase().replace(/ERROR$/, '');
    }

    // Generate code from message keywords
    const message = error.message.toLowerCase();

    if (message.includes('timeout')) return 'TIMEOUT';
    if (message.includes('connection')) return 'CONNECTION_ERROR';
    if (message.includes('not found')) return 'NOT_FOUND';
    if (message.includes('unauthorized')) return 'UNAUTHORIZED';
    if (message.includes('forbidden')) return 'FORBIDDEN';
    if (message.includes('rate limit')) return 'RATE_LIMITED';
    if (message.includes('validation')) return 'VALIDATION_ERROR';

    return 'UNKNOWN_ERROR';
  }

  // Select appropriate recovery strategy
  private selectStrategy(error: EnhancedBridgeError): ErrorRecoveryStrategy {
    // Check for exact pattern matches
    for (const [pattern, strategy] of this.strategies) {
      if (this.matchesPattern(error, pattern)) {
        return strategy;
      }
    }

    // Default strategy based on error characteristics
    return this.getDefaultStrategy(error);
  }

  // Pattern matching for error strategies
  private matchesPattern(error: EnhancedBridgeError, pattern: string): boolean {
    const parts = pattern.split('.');

    // Check each part of the pattern
    for (const part of parts) {
      if (part === '*') continue;

      if (part.startsWith('category:')) {
        const category = part.substring(9);
        if (error.category !== category) return false;
      } else if (part.startsWith('code:')) {
        const code = part.substring(5);
        if (error.code !== code) return false;
      } else if (part.startsWith('bridge:')) {
        const bridge = part.substring(7);
        if (error.context.bridge !== bridge) return false;
      }
    }

    return true;
  }

  // Get default strategy based on error characteristics
  private getDefaultStrategy(error: EnhancedBridgeError): ErrorRecoveryStrategy {
    if (error.retryable) {
      return {
        type: 'retry',
        maxAttempts: 3,
        backoffStrategy: {
          type: 'exponential',
          baseDelay: 1000,
          maxDelay: 30000,
          multiplier: 2,
          jitter: true
        }
      };
    }

    if (error.severity === ErrorSeverity.CRITICAL) {
      return { type: 'fail_fast' };
    }

    return {
      type: 'graceful_degradation',
      fallbackAction: async () => {
        return { success: false, message: 'Service temporarily unavailable' };
      }
    };
  }

  // Retry operation with exponential backoff
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    strategy: ErrorRecoveryStrategy,
    originalError: EnhancedBridgeError,
    context: ErrorContext
  ): Promise<T> {
    const maxAttempts = strategy.maxAttempts || 3;
    const backoff = strategy.backoffStrategy || {
      type: 'exponential',
      baseDelay: 1000,
      multiplier: 2
    };

    let lastError = originalError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (attempt > 1) {
        const delay = this.calculateBackoffDelay(backoff, attempt - 1);
        await this.sleep(delay);
      }

      try {
        return await operation();
      } catch (error) {
        lastError = this.enhanceError(error as Error, {
          ...context,
          previousErrors: [...(context.previousErrors || []), lastError]
        });

        // Check if we should continue retrying
        if (strategy.condition && !strategy.condition(lastError, attempt)) {
          break;
        }

        // Don't retry on the last attempt
        if (attempt === maxAttempts) {
          break;
        }
      }
    }

    throw lastError;
  }

  // Calculate backoff delay
  private calculateBackoffDelay(strategy: BackoffStrategy, attempt: number): number {
    let delay: number;

    switch (strategy.type) {
      case 'fixed':
        delay = strategy.baseDelay;
        break;

      case 'linear':
        delay = strategy.baseDelay * attempt;
        break;

      case 'exponential':
        delay = strategy.baseDelay * Math.pow(strategy.multiplier || 2, attempt);
        break;

      case 'custom':
        delay = strategy.customCalculator ? strategy.customCalculator(attempt) : strategy.baseDelay;
        break;

      default:
        delay = strategy.baseDelay;
    }

    // Apply max delay limit
    if (strategy.maxDelay) {
      delay = Math.min(delay, strategy.maxDelay);
    }

    // Add jitter if enabled
    if (strategy.jitter) {
      const jitterAmount = delay * 0.1; // 10% jitter
      delay += (Math.random() - 0.5) * jitterAmount;
    }

    return Math.max(delay, 0);
  }

  // Handle with circuit breaker pattern
  private async handleWithCircuitBreaker<T>(
    operation: () => Promise<T>,
    error: EnhancedBridgeError,
    context: ErrorContext
  ): Promise<T> {
    // Implementation would depend on circuit breaker state management
    // This is a simplified version
    throw new Error('Circuit breaker implementation needed');
  }

  // Handle with graceful degradation
  private async handleWithGracefulDegradation<T>(
    operation: () => Promise<T>,
    strategy: ErrorRecoveryStrategy,
    context: ErrorContext
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (strategy.fallbackAction) {
        return await strategy.fallbackAction();
      }
      throw this.enhanceError(error as Error, context);
    }
  }

  // Record error for metrics and alerting
  private recordError(error: EnhancedBridgeError): void {
    const key = error.context.bridge;
    let metrics = this.metrics.get(key);

    if (!metrics) {
      metrics = {
        totalErrors: 0,
        errorsByCategory: {} as Record<ErrorCategory, number>,
        errorsBySeverity: {} as Record<ErrorSeverity, number>,
        errorsByCode: {},
        errorRate: 0,
        meanTimeToResolve: 0,
        lastReset: new Date()
      };
      this.metrics.set(key, metrics);
    }

    metrics.totalErrors++;
    metrics.errorsByCategory[error.category] = (metrics.errorsByCategory[error.category] || 0) + 1;
    metrics.errorsBySeverity[error.severity] = (metrics.errorsBySeverity[error.severity] || 0) + 1;
    metrics.errorsByCode[error.code] = (metrics.errorsByCode[error.code] || 0) + 1;
    metrics.lastError = error;

    // Check if alert should be created
    this.checkAlertConditions(error);
  }

  // Check conditions for creating alerts
  private checkAlertConditions(error: EnhancedBridgeError): void {
    // Alert on critical errors
    if (error.severity === ErrorSeverity.CRITICAL) {
      this.createAlert('critical', 'Critical error occurred', error);
    }

    // Alert on high frequency of same error
    const metrics = this.metrics.get(error.context.bridge);
    if (metrics && metrics.errorsByCode[error.code] > 5) {
      this.createAlert('warning', `High frequency of ${error.code} errors`, error);
    }
  }

  // Create error alert
  private createAlert(level: ErrorAlert['level'], message: string, error: EnhancedBridgeError): void {
    const alert: ErrorAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      level,
      message,
      error,
      context: error.context,
      actions: [],
      acknowledged: false,
      resolved: false,
      createdAt: new Date()
    };

    this.alerts.set(alert.id, alert);
  }

  // Register default error handling strategies
  private registerDefaultStrategies(): void {
    // Network errors - retry with exponential backoff
    this.registerStrategy('category:network', {
      type: 'retry',
      maxAttempts: 3,
      backoffStrategy: {
        type: 'exponential',
        baseDelay: 1000,
        maxDelay: 30000,
        multiplier: 2,
        jitter: true
      }
    });

    // Rate limiting - retry with longer backoff
    this.registerStrategy('category:rate_limit', {
      type: 'retry',
      maxAttempts: 5,
      backoffStrategy: {
        type: 'exponential',
        baseDelay: 5000,
        maxDelay: 120000,
        multiplier: 2,
        jitter: true
      }
    });

    // Timeout errors - retry with fixed delay
    this.registerStrategy('category:timeout', {
      type: 'retry',
      maxAttempts: 2,
      backoffStrategy: {
        type: 'fixed',
        baseDelay: 2000
      }
    });

    // Authentication errors - fail fast
    this.registerStrategy('category:authentication', {
      type: 'fail_fast'
    });

    // Validation errors - fail fast
    this.registerStrategy('category:validation', {
      type: 'fail_fast'
    });
  }

  // Utility method for delays
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get error metrics for monitoring
  public getMetrics(bridge?: string): ErrorMetrics | Record<string, ErrorMetrics> {
    if (bridge) {
      return this.metrics.get(bridge) || {
        totalErrors: 0,
        errorsByCategory: {} as Record<ErrorCategory, number>,
        errorsBySeverity: {} as Record<ErrorSeverity, number>,
        errorsByCode: {},
        errorRate: 0,
        meanTimeToResolve: 0,
        lastReset: new Date()
      };
    }

    return Object.fromEntries(this.metrics);
  }

  // Get active alerts
  public getAlerts(): ErrorAlert[] {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }
}