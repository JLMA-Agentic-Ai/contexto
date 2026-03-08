"use strict";
/**
 * Platform Configuration Management
 * Centralized configuration for all 6 components
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformConfig = void 0;
class PlatformConfig {
    config;
    constructor(configPath) {
        this.config = this.loadConfiguration(configPath);
        this.validateConfiguration();
    }
    loadConfiguration(configPath) {
        // Default configuration
        const defaultConfig = {
            platform: {
                name: 'Visión Maestra',
                version: '1.0.0',
                environment: 'development',
                debugMode: true,
                logLevel: 'info',
                dataDirectory: './data',
                tempDirectory: './tmp'
            },
            components: {
                dossier: {
                    enabled: true,
                    port: 3000,
                    host: 'localhost',
                    apiEndpoint: '/api',
                    websocketPath: '/ws',
                    features: {
                        projectManagement: true,
                        userInterface: true,
                        realTimeUpdates: true,
                        fileWatcher: true
                    },
                    ui: {
                        theme: 'dark',
                        language: 'en',
                        refreshInterval: 1000,
                        maxProjects: 50
                    },
                    persistence: {
                        driver: 'filesystem',
                        location: './data/projects',
                        backup: true,
                        retentionDays: 30
                    }
                },
                rufloV3: {
                    enabled: true,
                    cliPath: 'npx @claude-flow/cli@latest',
                    maxAgents: 15,
                    topology: 'hierarchical',
                    strategy: 'specialized',
                    consensus: 'raft',
                    swarm: {
                        autoScale: true,
                        minAgents: 3,
                        maxAgents: 15,
                        scaleThreshold: 80
                    },
                    memory: {
                        enabled: true,
                        driver: 'hybrid',
                        hnsw: true,
                        neural: true,
                        namespace: 'vision-maestra'
                    },
                    agents: {
                        timeout: 30000,
                        retries: 3,
                        modelRouting: true,
                        boosterEnabled: true
                    }
                },
                adwSkills: {
                    enabled: true,
                    skillsDirectory: './.claude/skills',
                    methodology: {
                        specification: true,
                        pseudocode: true,
                        architecture: true,
                        refinement: true,
                        coding: true
                    },
                    workflows: {
                        autoExecute: false,
                        parallelExecution: true,
                        dependencyChecking: true,
                        rollbackEnabled: true
                    },
                    integration: {
                        gitHooks: true,
                        codeReview: true,
                        documentation: true,
                        testing: true
                    }
                },
                gitNexus: {
                    enabled: true,
                    repositoryPath: '.',
                    indexPath: './.gitnexus',
                    mcpEndpoint: 'stdio',
                    analysis: {
                        includeTests: true,
                        maxDepth: 5,
                        includeNodeModules: false,
                        filePatterns: ['**/*.ts', '**/*.js', '**/*.tsx', '**/*.jsx'],
                        excludePatterns: ['node_modules/**', 'dist/**', 'build/**']
                    },
                    caching: {
                        enabled: true,
                        ttl: 3600000, // 1 hour
                        maxSize: 1000,
                        strategy: 'lru'
                    },
                    realtime: {
                        fileWatcher: true,
                        incremental: true,
                        debounceTime: 500
                    }
                },
                rlmNavigator: {
                    enabled: true,
                    mcpEndpoint: 'stdio',
                    astCache: {
                        enabled: true,
                        maxFiles: 500,
                        ttl: 1800000 // 30 minutes
                    },
                    navigation: {
                        maxDepth: 10,
                        includeExternal: false,
                        contextLines: 3,
                        relevanceThreshold: 0.7
                    },
                    performance: {
                        concurrent: true,
                        workerThreads: 4,
                        memoryLimit: 512
                    }
                },
                claudeCode: {
                    enabled: true,
                    execution: {
                        timeout: 60000,
                        memoryLimit: '1GB',
                        cpuLimit: '1',
                        sandboxed: true
                    },
                    tools: {
                        bash: true,
                        read: true,
                        write: true,
                        edit: true,
                        glob: true,
                        grep: true
                    },
                    integrations: {
                        mcp: true,
                        skills: true,
                        agents: true
                    }
                }
            },
            integration: {
                bridges: {
                    'dossier-ruflo': {
                        enabled: true,
                        timeout: 5000,
                        retries: 2,
                        healthCheck: {
                            enabled: true,
                            interval: 30000
                        },
                        buffering: {
                            enabled: true,
                            maxSize: 1000,
                            flushInterval: 5000
                        }
                    },
                    'ruflo-adw': {
                        enabled: true,
                        timeout: 10000,
                        retries: 2,
                        healthCheck: {
                            enabled: true,
                            interval: 30000
                        },
                        buffering: {
                            enabled: false,
                            maxSize: 0,
                            flushInterval: 0
                        }
                    },
                    'adw-gitnexus': {
                        enabled: true,
                        timeout: 15000,
                        retries: 3,
                        healthCheck: {
                            enabled: true,
                            interval: 45000
                        },
                        buffering: {
                            enabled: true,
                            maxSize: 500,
                            flushInterval: 10000
                        }
                    },
                    'gitnexus-rlm': {
                        enabled: true,
                        timeout: 15000,
                        retries: 2,
                        healthCheck: {
                            enabled: true,
                            interval: 45000
                        },
                        buffering: {
                            enabled: true,
                            maxSize: 500,
                            flushInterval: 10000
                        }
                    },
                    'rlm-claude': {
                        enabled: true,
                        timeout: 30000,
                        retries: 3,
                        healthCheck: {
                            enabled: true,
                            interval: 60000
                        },
                        buffering: {
                            enabled: false,
                            maxSize: 0,
                            flushInterval: 0
                        }
                    },
                    'claude-dossier': {
                        enabled: true,
                        timeout: 5000,
                        retries: 2,
                        healthCheck: {
                            enabled: true,
                            interval: 30000
                        },
                        buffering: {
                            enabled: true,
                            maxSize: 1000,
                            flushInterval: 2000
                        }
                    }
                },
                eventBus: {
                    enabled: true,
                    driver: 'memory',
                    channels: [
                        'platform.events',
                        'component.status',
                        'workflow.progress',
                        'user.actions'
                    ],
                    persistence: false
                },
                api: {
                    enabled: true,
                    port: 8080,
                    cors: true,
                    authentication: false,
                    rateLimit: {
                        windowMs: 15 * 60 * 1000, // 15 minutes
                        maxRequests: 100,
                        skipSuccessfulRequests: false,
                        skipFailedRequests: true
                    }
                }
            },
            streaming: {
                websocket: {
                    enabled: true,
                    port: 8081,
                    path: '/ws',
                    heartbeatInterval: 30000,
                    maxConnections: 1000
                },
                sse: {
                    enabled: true,
                    port: 8082,
                    path: '/events',
                    retryInterval: 3000,
                    maxConnections: 500
                },
                grpc: {
                    enabled: false,
                    port: 8083,
                    serviceName: 'PlatformStreaming',
                    reflection: true
                },
                messaging: {
                    persistent: true,
                    compression: true,
                    encryption: false,
                    messageHistory: {
                        enabled: true,
                        maxMessages: 1000,
                        ttl: 3600000 // 1 hour
                    }
                },
                security: {
                    authentication: true,
                    authorization: true,
                    encryption: true
                }
            },
            orchestration: {
                maxConcurrentExecutions: 10,
                defaultTimeout: 300000, // 5 minutes
                persistenceEnabled: true,
                metricsEnabled: true,
                workflows: {
                    autoRetry: true,
                    maxRetries: 3,
                    parallelExecution: true,
                    dependencyChecking: true
                },
                scheduling: {
                    enabled: false,
                    cron: false,
                    eventDriven: true,
                    priority: true
                }
            },
            security: {
                authentication: {
                    enabled: false,
                    provider: 'local',
                    sessionTimeout: 3600000, // 1 hour
                    multiFactorAuth: false
                },
                authorization: {
                    enabled: false,
                    rbac: false,
                    permissions: ['read', 'write', 'execute', 'admin'],
                    defaultRole: 'user'
                },
                encryption: {
                    atRest: false,
                    inTransit: false,
                    algorithm: 'AES-256-GCM',
                    keyRotation: false
                },
                audit: {
                    enabled: true,
                    logAll: false,
                    sensitiveOperations: true,
                    retention: 90 // days
                }
            },
            monitoring: {
                enabled: true,
                metrics: {
                    system: true,
                    application: true,
                    business: false,
                    custom: true
                },
                logging: {
                    level: 'info',
                    format: 'json',
                    destination: 'console',
                    structured: true
                },
                alerting: {
                    enabled: false,
                    channels: [],
                    rules: []
                },
                healthChecks: {
                    enabled: true,
                    interval: 30000,
                    timeout: 5000,
                    endpoints: ['/health', '/api/health']
                }
            },
            performance: {
                optimization: {
                    caching: true,
                    compression: true,
                    bundling: false,
                    minification: false
                },
                limits: {
                    maxMemory: '2GB',
                    maxCpu: '2',
                    maxRequests: 1000,
                    maxFileSize: '100MB'
                },
                profiling: {
                    enabled: false,
                    sampling: 0.1,
                    heapDumps: false,
                    cpuProfiling: false
                },
                scaling: {
                    horizontal: false,
                    vertical: false,
                    autoScale: false,
                    metrics: ['cpu', 'memory', 'requests']
                }
            }
        };
        // If configPath is provided, load and merge with defaults
        if (configPath) {
            try {
                const userConfig = this.loadFromFile(configPath);
                return this.mergeConfigs(defaultConfig, userConfig);
            }
            catch (error) {
                console.warn(`Failed to load config from ${configPath}, using defaults`);
                return defaultConfig;
            }
        }
        return defaultConfig;
    }
    loadFromFile(configPath) {
        // Implementation would load from JSON/YAML file
        return {};
    }
    mergeConfigs(defaultConfig, userConfig) {
        // Deep merge configuration objects
        return this.deepMerge(defaultConfig, userConfig);
    }
    deepMerge(target, source) {
        const result = { ...target };
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            }
            else {
                result[key] = source[key];
            }
        }
        return result;
    }
    validateConfiguration() {
        // Validate configuration values
        if (this.config.platform.name.length === 0) {
            throw new Error('Platform name cannot be empty');
        }
        if (this.config.orchestration.maxConcurrentExecutions <= 0) {
            throw new Error('Maximum concurrent executions must be greater than 0');
        }
        // Validate port conflicts
        const ports = [
            this.config.components.dossier.port,
            this.config.integration.api.port,
            this.config.streaming.websocket.port,
            this.config.streaming.sse.port,
            this.config.streaming.grpc.port
        ].filter(port => port > 0);
        const uniquePorts = new Set(ports);
        if (ports.length !== uniquePorts.size) {
            throw new Error('Port conflicts detected in configuration');
        }
    }
    // Getters for different configuration sections
    get platform() {
        return this.config.platform;
    }
    get components() {
        return this.config.components;
    }
    get integration() {
        return this.config.integration;
    }
    get streaming() {
        return this.config.streaming;
    }
    get orchestration() {
        return this.config.orchestration;
    }
    get security() {
        return this.config.security;
    }
    get monitoring() {
        return this.config.monitoring;
    }
    get performance() {
        return this.config.performance;
    }
    // Component-specific getters
    getComponentConfig(component) {
        return this.config.components[component];
    }
    getBridgeConfig(bridgeName) {
        return this.config.integration.bridges[bridgeName];
    }
    // Configuration updates
    updateComponentConfig(component, updates) {
        this.config.components[component] = {
            ...this.config.components[component],
            ...updates
        };
    }
    updatePlatformConfig(updates) {
        this.config.platform = {
            ...this.config.platform,
            ...updates
        };
    }
    // Environment-specific configurations
    isDevelopment() {
        return this.config.platform.environment === 'development';
    }
    isProduction() {
        return this.config.platform.environment === 'production';
    }
    isDebugMode() {
        return this.config.platform.debugMode;
    }
    // Export configuration
    toJSON() {
        return JSON.parse(JSON.stringify(this.config));
    }
    toString() {
        return JSON.stringify(this.config, null, 2);
    }
}
exports.PlatformConfig = PlatformConfig;
//# sourceMappingURL=platform-config.js.map