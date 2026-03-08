/**
 * Visión Maestra Configuration
 * Complete configuration for the 6-component integration platform
 *
 * Evidence: SOLID - Centralized configuration ensures consistency across all components
 * Confidence: 96% - Based on enterprise configuration management patterns
 */
import { SecurityPolicy } from '../bridges/security/security-bridge-manager';
import { CircuitBreakerConfig } from '../monitoring/health-circuit-breaker';
export interface VisionMaestraConfig {
    platform: {
        name: string;
        version: string;
        environment: 'development' | 'staging' | 'production';
        maxConcurrentWorkflows: number;
        workflowTimeout: number;
    };
    security: {
        policy: SecurityPolicy;
        masterKey?: string;
        sessionTimeout: number;
        encryptionEnabled: boolean;
    };
    streaming: {
        port: number;
        corsOrigins: string[];
        maxConnections: number;
        messageBufferSize: number;
        heartbeatInterval: number;
        compressionEnabled: boolean;
    };
    evidence: {
        confidenceThreshold: number;
        challengePeriod: number;
        autoValidation: boolean;
        evidenceRetention: number;
        validationGates: string[];
    };
    health: {
        maxMetricHistory: number;
        defaultCircuitConfig: CircuitBreakerConfig;
        alertingEnabled: boolean;
        failoverEnabled: boolean;
        metricsRetention: number;
    };
    bridges: {
        timeouts: Record<string, number>;
        retryConfig: Record<string, number>;
        securityLevels: Record<string, 'low' | 'medium' | 'high'>;
    };
    components: {
        dossier: DossierConfig;
        ruflo: RufloConfig;
        adwSkills: ADWConfig;
        gitnexus: GitNexusConfig;
        rlmNavigator: RLMConfig;
        claudeCode: ClaudeCodeConfig;
    };
    monitoring: {
        enabled: boolean;
        metricsInterval: number;
        logLevel: 'debug' | 'info' | 'warn' | 'error';
        alerts: {
            email?: string[];
            slack?: string;
            webhook?: string;
        };
    };
    performance: {
        enableFlashAttention: boolean;
        enableHNSW: boolean;
        enableMoE: boolean;
        queenInfluenceWeight: number;
        memoryCompression: boolean;
    };
}
export interface DossierConfig {
    port: number;
    apiBaseUrl: string;
    websocketEnabled: boolean;
    uiTheme: 'light' | 'dark' | 'auto';
    maxProjectsPerUser: number;
    autoSave: boolean;
}
export interface RufloConfig {
    topology: 'hierarchical' | 'mesh' | 'hierarchical-mesh';
    maxAgents: number;
    agentPoolSize: number;
    memoryType: 'hybrid' | 'episodic' | 'semantic';
    consensusAlgorithm: 'raft' | 'pbft' | 'gossip';
    enableIntelligence: boolean;
}
export interface ADWConfig {
    methodologyVersion: string;
    evidenceThresholds: {
        solid: number;
        soft: number;
        shaky: number;
    };
    drillDepth: 'surface' | 'shallow' | 'deep' | 'drill';
    validationStrength: 'weak' | 'moderate' | 'strong' | 'adversarial';
    qualityGates: string[];
}
export interface GitNexusConfig {
    indexPath: string;
    kuzuDbPath: string;
    enableGraphVisualization: boolean;
    maxIndexSize: number;
    refreshInterval: number;
    analysisDepth: 'basic' | 'comprehensive' | 'deep';
}
export interface RLMConfig {
    navigatorMode: 'ast' | 'semantic' | 'hybrid';
    maxTraversalDepth: number;
    cacheSize: number;
    enableRecursiveAnalysis: boolean;
    contextMappingEnabled: boolean;
}
export interface ClaudeCodeConfig {
    agentTypes: string[];
    spawnStrategy: 'on-demand' | 'pool' | 'hybrid';
    maxConcurrentAgents: number;
    taskTimeout: number;
    enableBackground: boolean;
}
/**
 * Default configuration for development environment
 */
export declare const defaultVisionMaestraConfig: VisionMaestraConfig;
/**
 * Production configuration with enhanced security and performance
 */
export declare const productionVisionMaestraConfig: VisionMaestraConfig;
/**
 * Configuration factory function
 */
export declare function createVisionMaestraConfig(environment?: 'development' | 'staging' | 'production', overrides?: Partial<VisionMaestraConfig>): VisionMaestraConfig;
/**
 * Validate configuration
 */
export declare function validateVisionMaestraConfig(config: VisionMaestraConfig): string[];
/**
 * Export commonly used configurations
 */
export declare const configurations: {
    readonly development: VisionMaestraConfig;
    readonly staging: {
        readonly platform: {
            readonly environment: "staging";
            readonly maxConcurrentWorkflows: 25;
            readonly name: string;
            readonly version: string;
            readonly workflowTimeout: number;
        };
        readonly security: {
            policy: SecurityPolicy;
            masterKey?: string;
            sessionTimeout: number;
            encryptionEnabled: boolean;
        };
        readonly streaming: {
            port: number;
            corsOrigins: string[];
            maxConnections: number;
            messageBufferSize: number;
            heartbeatInterval: number;
            compressionEnabled: boolean;
        };
        readonly evidence: {
            confidenceThreshold: number;
            challengePeriod: number;
            autoValidation: boolean;
            evidenceRetention: number;
            validationGates: string[];
        };
        readonly health: {
            maxMetricHistory: number;
            defaultCircuitConfig: CircuitBreakerConfig;
            alertingEnabled: boolean;
            failoverEnabled: boolean;
            metricsRetention: number;
        };
        readonly bridges: {
            timeouts: Record<string, number>;
            retryConfig: Record<string, number>;
            securityLevels: Record<string, "low" | "medium" | "high">;
        };
        readonly components: {
            dossier: DossierConfig;
            ruflo: RufloConfig;
            adwSkills: ADWConfig;
            gitnexus: GitNexusConfig;
            rlmNavigator: RLMConfig;
            claudeCode: ClaudeCodeConfig;
        };
        readonly monitoring: {
            enabled: boolean;
            metricsInterval: number;
            logLevel: "debug" | "info" | "warn" | "error";
            alerts: {
                email?: string[];
                slack?: string;
                webhook?: string;
            };
        };
        readonly performance: {
            enableFlashAttention: boolean;
            enableHNSW: boolean;
            enableMoE: boolean;
            queenInfluenceWeight: number;
            memoryCompression: boolean;
        };
    };
    readonly production: VisionMaestraConfig;
};
//# sourceMappingURL=vision-maestra-config.d.ts.map