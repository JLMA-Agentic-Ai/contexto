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
export declare abstract class ComponentBridge {
    protected config: ComponentConfig;
    protected isInitialized: boolean;
    protected lastHealthCheck?: Date;
    constructor(config: ComponentConfig);
    abstract initialize(): Promise<void>;
    abstract shutdown(): Promise<void>;
    abstract checkHealth(): Promise<HealthMetrics>;
    abstract sendMessage(message: ComponentMessage): Promise<any>;
    abstract getCapabilities(): ComponentCapability[];
    /**
     * Execute a specific capability of the component
     */
    executeCapability(capabilityId: string, parameters: any): Promise<any>;
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
    getConfig(): ComponentConfig;
    /**
     * Update component configuration
     */
    updateConfig(newConfig: Partial<ComponentConfig>): Promise<void>;
    /**
     * Check if component is initialized and ready
     */
    isReady(): boolean;
    /**
     * Get last health check timestamp
     */
    getLastHealthCheck(): Date | undefined;
    protected validateParameters(parameterDefs: ParameterDefinition[], parameters: any): void;
    protected validateParameterType(value: any, expectedType: string): boolean;
    protected generateMessageId(): string;
    protected reinitialize(): Promise<void>;
    /**
     * Handle component errors with retry logic
     */
    protected executeWithRetry<T>(operation: () => Promise<T>, context?: string): Promise<T>;
    protected sleep(ms: number): Promise<void>;
    /**
     * Create standardized error response
     */
    protected createErrorResponse(error: Error, context: string): any;
    /**
     * Create standardized success response
     */
    protected createSuccessResponse(data: any, context: string): any;
}
//# sourceMappingURL=component-bridge.d.ts.map