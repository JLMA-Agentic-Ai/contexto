/**
 * Platform Configuration Management
 * Centralized configuration for all 6 components
 */
export interface PlatformConfiguration {
    platform: PlatformSettings;
    components: ComponentsConfig;
    integration: IntegrationConfig;
    streaming: StreamingConfig;
    orchestration: OrchestrationConfig;
    security: SecurityConfig;
    monitoring: MonitoringConfig;
    performance: PerformanceConfig;
}
export interface PlatformSettings {
    name: string;
    version: string;
    environment: 'development' | 'staging' | 'production';
    debugMode: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    dataDirectory: string;
    tempDirectory: string;
}
export interface ComponentsConfig {
    dossier: DossierConfig;
    rufloV3: RufloV3Config;
    adwSkills: ADWSkillsConfig;
    gitNexus: GitNexusConfig;
    rlmNavigator: RLMNavigatorConfig;
    claudeCode: ClaudeCodeConfig;
}
export interface DossierConfig {
    enabled: boolean;
    port: number;
    host: string;
    apiEndpoint: string;
    websocketPath: string;
    features: {
        projectManagement: boolean;
        userInterface: boolean;
        realTimeUpdates: boolean;
        fileWatcher: boolean;
    };
    ui: {
        theme: 'light' | 'dark' | 'auto';
        language: string;
        refreshInterval: number;
        maxProjects: number;
    };
    persistence: {
        driver: 'filesystem' | 'database' | 'memory';
        location: string;
        backup: boolean;
        retentionDays: number;
    };
}
export interface RufloV3Config {
    enabled: boolean;
    cliPath: string;
    maxAgents: number;
    topology: 'hierarchical' | 'mesh' | 'ring' | 'star';
    strategy: 'specialized' | 'generalized' | 'adaptive';
    consensus: 'raft' | 'pbft' | 'simple';
    swarm: {
        autoScale: boolean;
        minAgents: number;
        maxAgents: number;
        scaleThreshold: number;
    };
    memory: {
        enabled: boolean;
        driver: 'hybrid' | 'vector' | 'traditional';
        hnsw: boolean;
        neural: boolean;
        namespace: string;
    };
    agents: {
        timeout: number;
        retries: number;
        modelRouting: boolean;
        boosterEnabled: boolean;
    };
}
export interface ADWSkillsConfig {
    enabled: boolean;
    skillsDirectory: string;
    methodology: {
        specification: boolean;
        pseudocode: boolean;
        architecture: boolean;
        refinement: boolean;
        coding: boolean;
    };
    workflows: {
        autoExecute: boolean;
        parallelExecution: boolean;
        dependencyChecking: boolean;
        rollbackEnabled: boolean;
    };
    integration: {
        gitHooks: boolean;
        codeReview: boolean;
        documentation: boolean;
        testing: boolean;
    };
}
export interface GitNexusConfig {
    enabled: boolean;
    repositoryPath: string;
    indexPath: string;
    mcpEndpoint: string;
    analysis: {
        includeTests: boolean;
        maxDepth: number;
        includeNodeModules: boolean;
        filePatterns: string[];
        excludePatterns: string[];
    };
    caching: {
        enabled: boolean;
        ttl: number;
        maxSize: number;
        strategy: 'lru' | 'lfu' | 'ttl';
    };
    realtime: {
        fileWatcher: boolean;
        incremental: boolean;
        debounceTime: number;
    };
}
export interface RLMNavigatorConfig {
    enabled: boolean;
    mcpEndpoint: string;
    astCache: {
        enabled: boolean;
        maxFiles: number;
        ttl: number;
    };
    navigation: {
        maxDepth: number;
        includeExternal: boolean;
        contextLines: number;
        relevanceThreshold: number;
    };
    performance: {
        concurrent: boolean;
        workerThreads: number;
        memoryLimit: number;
    };
}
export interface ClaudeCodeConfig {
    enabled: boolean;
    execution: {
        timeout: number;
        memoryLimit: string;
        cpuLimit: string;
        sandboxed: boolean;
    };
    tools: {
        bash: boolean;
        read: boolean;
        write: boolean;
        edit: boolean;
        glob: boolean;
        grep: boolean;
    };
    integrations: {
        mcp: boolean;
        skills: boolean;
        agents: boolean;
    };
}
export interface IntegrationConfig {
    bridges: {
        'dossier-ruflo': BridgeConfig;
        'ruflo-adw': BridgeConfig;
        'adw-gitnexus': BridgeConfig;
        'gitnexus-rlm': BridgeConfig;
        'rlm-claude': BridgeConfig;
        'claude-dossier': BridgeConfig;
    };
    eventBus: {
        enabled: boolean;
        driver: 'memory' | 'redis' | 'rabbitmq';
        channels: string[];
        persistence: boolean;
    };
    api: {
        enabled: boolean;
        port: number;
        cors: boolean;
        authentication: boolean;
        rateLimit: RateLimitConfig;
    };
}
export interface BridgeConfig {
    enabled: boolean;
    timeout: number;
    retries: number;
    healthCheck: {
        enabled: boolean;
        interval: number;
    };
    buffering: {
        enabled: boolean;
        maxSize: number;
        flushInterval: number;
    };
}
export interface RateLimitConfig {
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
    skipFailedRequests: boolean;
}
export interface StreamingConfig {
    websocket: {
        enabled: boolean;
        port: number;
        path: string;
        heartbeatInterval: number;
        maxConnections: number;
    };
    sse: {
        enabled: boolean;
        port: number;
        path: string;
        retryInterval: number;
        maxConnections: number;
    };
    grpc: {
        enabled: boolean;
        port: number;
        serviceName: string;
        reflection: boolean;
    };
    messaging: {
        persistent: boolean;
        compression: boolean;
        encryption: boolean;
        messageHistory: {
            enabled: boolean;
            maxMessages: number;
            ttl: number;
        };
    };
    security: {
        authentication: boolean;
        authorization: boolean;
        encryption: boolean;
    };
}
export interface OrchestrationConfig {
    maxConcurrentExecutions: number;
    defaultTimeout: number;
    persistenceEnabled: boolean;
    metricsEnabled: boolean;
    workflows: {
        autoRetry: boolean;
        maxRetries: number;
        parallelExecution: boolean;
        dependencyChecking: boolean;
    };
    scheduling: {
        enabled: boolean;
        cron: boolean;
        eventDriven: boolean;
        priority: boolean;
    };
}
export interface SecurityConfig {
    authentication: {
        enabled: boolean;
        provider: 'local' | 'oauth' | 'ldap' | 'saml';
        sessionTimeout: number;
        multiFactorAuth: boolean;
    };
    authorization: {
        enabled: boolean;
        rbac: boolean;
        permissions: string[];
        defaultRole: string;
    };
    encryption: {
        atRest: boolean;
        inTransit: boolean;
        algorithm: string;
        keyRotation: boolean;
    };
    audit: {
        enabled: boolean;
        logAll: boolean;
        sensitiveOperations: boolean;
        retention: number;
    };
}
export interface MonitoringConfig {
    enabled: boolean;
    metrics: {
        system: boolean;
        application: boolean;
        business: boolean;
        custom: boolean;
    };
    logging: {
        level: string;
        format: 'json' | 'text';
        destination: 'console' | 'file' | 'external';
        structured: boolean;
    };
    alerting: {
        enabled: boolean;
        channels: AlertChannel[];
        rules: AlertRule[];
    };
    healthChecks: {
        enabled: boolean;
        interval: number;
        timeout: number;
        endpoints: string[];
    };
}
export interface AlertChannel {
    type: 'email' | 'slack' | 'webhook' | 'pager';
    config: Record<string, any>;
    enabled: boolean;
}
export interface AlertRule {
    id: string;
    name: string;
    condition: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    channels: string[];
    cooldown: number;
}
export interface PerformanceConfig {
    optimization: {
        caching: boolean;
        compression: boolean;
        bundling: boolean;
        minification: boolean;
    };
    limits: {
        maxMemory: string;
        maxCpu: string;
        maxRequests: number;
        maxFileSize: string;
    };
    profiling: {
        enabled: boolean;
        sampling: number;
        heapDumps: boolean;
        cpuProfiling: boolean;
    };
    scaling: {
        horizontal: boolean;
        vertical: boolean;
        autoScale: boolean;
        metrics: string[];
    };
}
export declare class PlatformConfig {
    private config;
    constructor(configPath?: string);
    private loadConfiguration;
    private loadFromFile;
    private mergeConfigs;
    private deepMerge;
    private validateConfiguration;
    get platform(): PlatformSettings;
    get components(): ComponentsConfig;
    get integration(): IntegrationConfig;
    get streaming(): StreamingConfig;
    get orchestration(): OrchestrationConfig;
    get security(): SecurityConfig;
    get monitoring(): MonitoringConfig;
    get performance(): PerformanceConfig;
    getComponentConfig<T extends keyof ComponentsConfig>(component: T): ComponentsConfig[T];
    getBridgeConfig(bridgeName: keyof IntegrationConfig['bridges']): BridgeConfig;
    updateComponentConfig<T extends keyof ComponentsConfig>(component: T, updates: Partial<ComponentsConfig[T]>): void;
    updatePlatformConfig(updates: Partial<PlatformSettings>): void;
    isDevelopment(): boolean;
    isProduction(): boolean;
    isDebugMode(): boolean;
    toJSON(): PlatformConfiguration;
    toString(): string;
}
//# sourceMappingURL=platform-config.d.ts.map