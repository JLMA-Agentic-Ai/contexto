/**
 * Base Component Bridge Interface
 * Defines the contract for all component integrations
 */

export interface HealthMetrics {
  uptime: number;
  responseTime: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface ComponentCapability {
  id: string;
  name: string;
  description: string;
  parameters: ParameterDefinition[];
  returnType: string;
}

export interface ParameterDefinition {
  name: string;
  type: string;
  required: boolean;
  description: string;
  defaultValue?: any;
}

export interface ComponentMessage {
  id: string;
  type: string;
  payload: any;
  metadata: MessageMetadata;
}

export interface MessageMetadata {
  timestamp: Date;
  source: string;
  target?: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  correlationId?: string;
  timeout?: number;
  securityContext?: {
    sessionId: string;
    userId: string;
    signature: string;
    timestamp: Date;
  };
}

export interface ComponentConfig {
  id: string;
  name: string;
  version: string;
  endpoint?: string;
  apiKey?: string;
  timeout: number;
  retries: number;
  healthCheck: {
    enabled: boolean;
    interval: number;
    timeout: number;
  };
  capabilities: ComponentCapability[];
}

export abstract class ComponentBridge {
  protected config: ComponentConfig;
  protected isInitialized = false;
  protected lastHealthCheck?: Date;

  constructor(config: ComponentConfig) {
    this.config = config;
  }

  abstract initialize(): Promise<void>;
  abstract shutdown(): Promise<void>;
  abstract checkHealth(): Promise<HealthMetrics>;
  abstract sendMessage(message: ComponentMessage): Promise<any>;
  abstract getCapabilities(): ComponentCapability[];

  /**
   * Execute a specific capability of the component
   */
  async executeCapability(capabilityId: string, parameters: any): Promise<any> {
    const capability = this.getCapabilities().find(cap => cap.id === capabilityId);
    if (!capability) {
      throw new Error(`Capability ${capabilityId} not found`);
    }

    // Validate parameters
    this.validateParameters(capability.parameters, parameters);

    // Create message for capability execution
    const message: ComponentMessage = {
      id: this.generateMessageId(),
      type: 'capability:execute',
      payload: {
        capabilityId,
        parameters
      },
      metadata: {
        timestamp: new Date(),
        source: 'platform-orchestrator',
        target: this.config.id,
        priority: 'normal'
      }
    };

    return this.sendMessage(message);
  }

  /**
   * Subscribe to component events
   */
  abstract subscribe(eventType: string, callback: (event: any) => void): void;

  /**
   * Unsubscribe from component events
   */
  abstract unsubscribe(eventType: string, callback?: (event: any) => void): void;

  /**
   * Get component configuration
   */
  getConfig(): ComponentConfig {
    return { ...this.config };
  }

  /**
   * Update component configuration
   */
  async updateConfig(newConfig: Partial<ComponentConfig>): Promise<void> {
    this.config = { ...this.config, ...newConfig };
    if (this.isInitialized) {
      await this.reinitialize();
    }
  }

  /**
   * Check if component is initialized and ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get last health check timestamp
   */
  getLastHealthCheck(): Date | undefined {
    return this.lastHealthCheck;
  }

  protected validateParameters(
    parameterDefs: ParameterDefinition[],
    parameters: any
  ): void {
    for (const paramDef of parameterDefs) {
      if (paramDef.required && !(paramDef.name in parameters)) {
        throw new Error(`Required parameter ${paramDef.name} is missing`);
      }

      if (paramDef.name in parameters) {
        const value = parameters[paramDef.name];
        if (!this.validateParameterType(value, paramDef.type)) {
          throw new Error(
            `Parameter ${paramDef.name} has invalid type. Expected ${paramDef.type}`
          );
        }
      }
    }
  }

  protected validateParameterType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null;
      case 'array':
        return Array.isArray(value);
      default:
        return true; // Unknown type, assume valid
    }
  }

  protected generateMessageId(): string {
    return `${this.config.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  protected async reinitialize(): Promise<void> {
    await this.shutdown();
    await this.initialize();
  }

  /**
   * Handle component errors with retry logic
   */
  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string = 'operation'
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.config.retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt < this.config.retries) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
          console.warn(
            `${context} failed (attempt ${attempt}/${this.config.retries}): ${error}. Retrying in ${delay}ms...`
          );
          await this.sleep(delay);
        }
      }
    }

    throw new Error(
      `${context} failed after ${this.config.retries} attempts. Last error: ${lastError!.message}`
    );
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create standardized error response
   */
  protected createErrorResponse(error: Error, context: string): any {
    return {
      success: false,
      error: {
        message: error.message,
        context,
        timestamp: new Date(),
        component: this.config.id
      }
    };
  }

  /**
   * Create standardized success response
   */
  protected createSuccessResponse(data: any, context: string): any {
    return {
      success: true,
      data,
      metadata: {
        timestamp: new Date(),
        component: this.config.id,
        context
      }
    };
  }
}