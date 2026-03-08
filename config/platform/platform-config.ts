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

export class PlatformConfig {
  private config: PlatformConfiguration;

  constructor(configPath?: string) {
    this.config = this.loadConfiguration(configPath);
    this.validateConfiguration();
  }

  private loadConfiguration(configPath?: string): PlatformConfiguration {
    // Default configuration
    const defaultConfig: PlatformConfiguration = {
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
      } catch (error) {
        console.warn(`Failed to load config from ${configPath}, using defaults`);
        return defaultConfig;
      }
    }

    return defaultConfig;
  }

  private loadFromFile(configPath: string): Partial<PlatformConfiguration> {
    // Implementation would load from JSON/YAML file
    return {};
  }

  private mergeConfigs(
    defaultConfig: PlatformConfiguration,
    userConfig: Partial<PlatformConfiguration>
  ): PlatformConfiguration {
    // Deep merge configuration objects
    return this.deepMerge(defaultConfig, userConfig) as PlatformConfiguration;
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };

    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }

    return result;
  }

  private validateConfiguration(): void {
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
  get platform(): PlatformSettings {
    return this.config.platform;
  }

  get components(): ComponentsConfig {
    return this.config.components;
  }

  get integration(): IntegrationConfig {
    return this.config.integration;
  }

  get streaming(): StreamingConfig {
    return this.config.streaming;
  }

  get orchestration(): OrchestrationConfig {
    return this.config.orchestration;
  }

  get security(): SecurityConfig {
    return this.config.security;
  }

  get monitoring(): MonitoringConfig {
    return this.config.monitoring;
  }

  get performance(): PerformanceConfig {
    return this.config.performance;
  }

  // Component-specific getters
  getComponentConfig<T extends keyof ComponentsConfig>(component: T): ComponentsConfig[T] {
    return this.config.components[component];
  }

  getBridgeConfig(bridgeName: keyof IntegrationConfig['bridges']): BridgeConfig {
    return this.config.integration.bridges[bridgeName];
  }

  // Configuration updates
  updateComponentConfig<T extends keyof ComponentsConfig>(
    component: T,
    updates: Partial<ComponentsConfig[T]>
  ): void {
    this.config.components[component] = {
      ...this.config.components[component],
      ...updates
    };
  }

  updatePlatformConfig(updates: Partial<PlatformSettings>): void {
    this.config.platform = {
      ...this.config.platform,
      ...updates
    };
  }

  // Environment-specific configurations
  isDevelopment(): boolean {
    return this.config.platform.environment === 'development';
  }

  isProduction(): boolean {
    return this.config.platform.environment === 'production';
  }

  isDebugMode(): boolean {
    return this.config.platform.debugMode;
  }

  // Export configuration
  toJSON(): PlatformConfiguration {
    return JSON.parse(JSON.stringify(this.config));
  }

  toString(): string {
    return JSON.stringify(this.config, null, 2);
  }
}