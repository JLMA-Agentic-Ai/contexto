"use strict";
/**
 * Visión Maestra Configuration
 * Complete configuration for the 6-component integration platform
 *
 * Evidence: SOLID - Centralized configuration ensures consistency across all components
 * Confidence: 96% - Based on enterprise configuration management patterns
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.configurations = exports.productionVisionMaestraConfig = exports.defaultVisionMaestraConfig = void 0;
exports.createVisionMaestraConfig = createVisionMaestraConfig;
exports.validateVisionMaestraConfig = validateVisionMaestraConfig;
const security_bridge_manager_1 = require("../bridges/security/security-bridge-manager");
/**
 * Default configuration for development environment
 */
exports.defaultVisionMaestraConfig = {
    platform: {
        name: 'Visión Maestra',
        version: '1.0.0',
        environment: 'development',
        maxConcurrentWorkflows: 10,
        workflowTimeout: 1800000 // 30 minutes
    },
    security: {
        policy: security_bridge_manager_1.defaultSecurityPolicy,
        sessionTimeout: 86400000, // 24 hours
        encryptionEnabled: true
    },
    streaming: {
        port: 8080,
        corsOrigins: ['http://localhost:3000', 'http://localhost:3001'],
        maxConnections: 100,
        messageBufferSize: 1000,
        heartbeatInterval: 30000, // 30 seconds
        compressionEnabled: true
    },
    evidence: {
        confidenceThreshold: 70,
        challengePeriod: 300000, // 5 minutes
        autoValidation: true,
        evidenceRetention: 30, // 30 days
        validationGates: ['build', 'security', 'performance', 'architecture']
    },
    health: {
        maxMetricHistory: 1000,
        defaultCircuitConfig: {
            failureThreshold: 5,
            recoveryTimeout: 60000, // 1 minute
            volumeThreshold: 10,
            errorThresholdPercentage: 50,
            slowCallDurationThreshold: 5000, // 5 seconds
            slowCallRateThreshold: 50,
            samplingDuration: 60000 // 1 minute
        },
        alertingEnabled: true,
        failoverEnabled: true,
        metricsRetention: 7 // 7 days
    },
    bridges: {
        timeouts: {
            'dossier-ruflo-bridge': 30000,
            'ruflo-gitnexus-bridge': 60000,
            'adw-rlm-bridge': 45000,
            'gitnexus-claude-bridge': 120000,
            'rlm-dossier-bridge': 30000,
            'claude-adw-bridge': 90000
        },
        retryConfig: {
            'dossier-ruflo-bridge': 3,
            'ruflo-gitnexus-bridge': 2,
            'adw-rlm-bridge': 3,
            'gitnexus-claude-bridge': 2,
            'rlm-dossier-bridge': 3,
            'claude-adw-bridge': 2
        },
        securityLevels: {
            'dossier-ruflo-bridge': 'high',
            'ruflo-gitnexus-bridge': 'medium',
            'adw-rlm-bridge': 'high',
            'gitnexus-claude-bridge': 'high',
            'rlm-dossier-bridge': 'medium',
            'claude-adw-bridge': 'high'
        }
    },
    components: {
        dossier: {
            port: 3000,
            apiBaseUrl: 'http://localhost:3000/api',
            websocketEnabled: true,
            uiTheme: 'dark',
            maxProjectsPerUser: 50,
            autoSave: true
        },
        ruflo: {
            topology: 'hierarchical-mesh',
            maxAgents: 15,
            agentPoolSize: 8,
            memoryType: 'hybrid',
            consensusAlgorithm: 'raft',
            enableIntelligence: true
        },
        adwSkills: {
            methodologyVersion: '2.1.0',
            evidenceThresholds: {
                solid: 85,
                soft: 70,
                shaky: 50
            },
            drillDepth: 'deep',
            validationStrength: 'adversarial',
            qualityGates: [
                'assumption_validation',
                'decision_evidence',
                'wisdom_extraction',
                'confidence_scoring'
            ]
        },
        gitnexus: {
            indexPath: './gitnexus-index',
            kuzuDbPath: './kuzu.db',
            enableGraphVisualization: true,
            maxIndexSize: 1000000, // 1M symbols
            refreshInterval: 300000, // 5 minutes
            analysisDepth: 'comprehensive'
        },
        rlmNavigator: {
            navigatorMode: 'hybrid',
            maxTraversalDepth: 10,
            cacheSize: 10000,
            enableRecursiveAnalysis: true,
            contextMappingEnabled: true
        },
        claudeCode: {
            agentTypes: [
                'coder', 'reviewer', 'tester', 'architect', 'security-architect',
                'security-auditor', 'performance-engineer', 'memory-specialist',
                'hierarchical-coordinator', 'researcher'
            ],
            spawnStrategy: 'hybrid',
            maxConcurrentAgents: 8,
            taskTimeout: 600000, // 10 minutes
            enableBackground: true
        }
    },
    monitoring: {
        enabled: true,
        metricsInterval: 10000, // 10 seconds
        logLevel: 'info',
        alerts: {
            email: ['admin@example.com'],
            slack: 'https://hooks.slack.com/services/...',
            webhook: 'https://api.example.com/alerts'
        }
    },
    performance: {
        enableFlashAttention: true,
        enableHNSW: true,
        enableMoE: true,
        queenInfluenceWeight: 1.5,
        memoryCompression: true
    }
};
/**
 * Production configuration with enhanced security and performance
 */
exports.productionVisionMaestraConfig = {
    ...exports.defaultVisionMaestraConfig,
    platform: {
        ...exports.defaultVisionMaestraConfig.platform,
        environment: 'production',
        maxConcurrentWorkflows: 50,
        workflowTimeout: 3600000 // 1 hour
    },
    security: {
        ...exports.defaultVisionMaestraConfig.security,
        policy: {
            ...security_bridge_manager_1.defaultSecurityPolicy,
            authentication: {
                ...security_bridge_manager_1.defaultSecurityPolicy.authentication,
                expiration: 7200000 // 2 hours
            },
            threatDetection: {
                ...security_bridge_manager_1.defaultSecurityPolicy.threatDetection,
                rateLimiting: {
                    maxRequests: 200,
                    timeWindow: 60000 // 1 minute
                },
                monitoring: {
                    logLevel: 'info',
                    alertWebhook: 'https://security.example.com/alerts'
                }
            }
        },
        sessionTimeout: 14400000, // 4 hours
        encryptionEnabled: true
    },
    streaming: {
        ...exports.defaultVisionMaestraConfig.streaming,
        port: 443, // HTTPS
        maxConnections: 1000,
        messageBufferSize: 10000,
        heartbeatInterval: 15000, // 15 seconds
        corsOrigins: ['https://app.example.com']
    },
    health: {
        ...exports.defaultVisionMaestraConfig.health,
        maxMetricHistory: 10000,
        defaultCircuitConfig: {
            ...exports.defaultVisionMaestraConfig.health.defaultCircuitConfig,
            failureThreshold: 3,
            recoveryTimeout: 30000, // 30 seconds
            volumeThreshold: 20
        },
        metricsRetention: 30 // 30 days
    },
    components: {
        ...exports.defaultVisionMaestraConfig.components,
        dossier: {
            ...exports.defaultVisionMaestraConfig.components.dossier,
            port: 443,
            apiBaseUrl: 'https://api.example.com',
            maxProjectsPerUser: 200
        },
        ruflo: {
            ...exports.defaultVisionMaestraConfig.components.ruflo,
            maxAgents: 50,
            agentPoolSize: 20
        },
        gitnexus: {
            ...exports.defaultVisionMaestraConfig.components.gitnexus,
            maxIndexSize: 10000000, // 10M symbols
            refreshInterval: 600000 // 10 minutes
        },
        claudeCode: {
            ...exports.defaultVisionMaestraConfig.components.claudeCode,
            maxConcurrentAgents: 20,
            taskTimeout: 1800000 // 30 minutes
        }
    },
    monitoring: {
        ...exports.defaultVisionMaestraConfig.monitoring,
        metricsInterval: 5000, // 5 seconds
        logLevel: 'warn',
        alerts: {
            email: ['alerts@example.com', 'ops@example.com'],
            slack: 'https://hooks.slack.com/services/production/...',
            webhook: 'https://monitoring.example.com/webhook'
        }
    }
};
/**
 * Configuration factory function
 */
function createVisionMaestraConfig(environment = 'development', overrides = {}) {
    const baseConfig = environment === 'production'
        ? exports.productionVisionMaestraConfig
        : exports.defaultVisionMaestraConfig;
    return mergeConfig(baseConfig, overrides);
}
/**
 * Deep merge configuration objects
 */
function mergeConfig(base, overrides) {
    return {
        platform: { ...base.platform, ...overrides.platform },
        security: {
            ...base.security,
            ...overrides.security,
            policy: { ...base.security.policy, ...overrides.security?.policy }
        },
        streaming: { ...base.streaming, ...overrides.streaming },
        evidence: { ...base.evidence, ...overrides.evidence },
        health: {
            ...base.health,
            ...overrides.health,
            defaultCircuitConfig: {
                ...base.health.defaultCircuitConfig,
                ...overrides.health?.defaultCircuitConfig
            }
        },
        bridges: {
            timeouts: { ...base.bridges.timeouts, ...overrides.bridges?.timeouts },
            retryConfig: { ...base.bridges.retryConfig, ...overrides.bridges?.retryConfig },
            securityLevels: { ...base.bridges.securityLevels, ...overrides.bridges?.securityLevels }
        },
        components: {
            dossier: { ...base.components.dossier, ...overrides.components?.dossier },
            ruflo: { ...base.components.ruflo, ...overrides.components?.ruflo },
            adwSkills: { ...base.components.adwSkills, ...overrides.components?.adwSkills },
            gitnexus: { ...base.components.gitnexus, ...overrides.components?.gitnexus },
            rlmNavigator: { ...base.components.rlmNavigator, ...overrides.components?.rlmNavigator },
            claudeCode: { ...base.components.claudeCode, ...overrides.components?.claudeCode }
        },
        monitoring: { ...base.monitoring, ...overrides.monitoring },
        performance: { ...base.performance, ...overrides.performance }
    };
}
/**
 * Validate configuration
 */
function validateVisionMaestraConfig(config) {
    const errors = [];
    // Platform validation
    if (config.platform.maxConcurrentWorkflows <= 0) {
        errors.push('Platform maxConcurrentWorkflows must be positive');
    }
    // Security validation
    if (config.security.sessionTimeout < 60000) {
        errors.push('Security sessionTimeout must be at least 1 minute');
    }
    // Streaming validation
    if (config.streaming.port <= 0 || config.streaming.port > 65535) {
        errors.push('Streaming port must be between 1 and 65535');
    }
    // Health validation
    if (config.health.defaultCircuitConfig.failureThreshold <= 0) {
        errors.push('Health failureThreshold must be positive');
    }
    // Components validation
    if (config.components.ruflo.maxAgents <= 0) {
        errors.push('Ruflo maxAgents must be positive');
    }
    return errors;
}
/**
 * Export commonly used configurations
 */
exports.configurations = {
    development: exports.defaultVisionMaestraConfig,
    staging: {
        ...exports.defaultVisionMaestraConfig,
        platform: {
            ...exports.defaultVisionMaestraConfig.platform,
            environment: 'staging',
            maxConcurrentWorkflows: 25
        }
    },
    production: exports.productionVisionMaestraConfig
};
//# sourceMappingURL=vision-maestra-config.js.map