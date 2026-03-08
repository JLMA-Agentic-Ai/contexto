/**
 * Enterprise Security Configuration for 6-Component Platform Integration
 * Implements zero-trust architecture with comprehensive security hardening
 *
 * Components Secured:
 * 1. Dossier ↔ ruflo V3 (WebSocket security)
 * 2. ruflo V3 ↔ GitNexus (File access security)
 * 3. ADW Skills ↔ RLM Navigator (MCP protocol security)
 * 4. GitNexus ↔ Claude Code (Native execution isolation)
 * 5. RLM Navigator ↔ Dossier (WebSocket security)
 * 6. Claude Code ↔ ADW Skills (Native process isolation)
 */
import { SecurityPolicy } from '../src/bridges/security/security-bridge-manager';
export declare const enterpriseSecurityPolicy: SecurityPolicy;
export interface ComponentSecurityConfig {
    componentId: string;
    securityLevel: 'low' | 'medium' | 'high' | 'critical';
    isolationLevel: 'none' | 'process' | 'container' | 'vm';
    networkPolicy: NetworkSecurityPolicy;
    dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
    auditLevel: 'minimal' | 'standard' | 'comprehensive';
}
export interface NetworkSecurityPolicy {
    allowedPorts: number[];
    allowedHosts: string[];
    requireTLS: boolean;
    certificateValidation: boolean;
    corsPolicy: {
        allowedOrigins: string[];
        allowedMethods: string[];
        allowedHeaders: string[];
    };
    rateLimiting: {
        enabled: boolean;
        requestsPerMinute: number;
        burstSize: number;
    };
}
export declare const componentSecurityConfigs: ComponentSecurityConfig[];
export interface BridgeSecurityConfig {
    bridgeId: string;
    protocol: 'websocket' | 'http' | 'mcp' | 'file-sync' | 'native';
    encryptionRequired: boolean;
    mutualAuth: boolean;
    messageValidation: boolean;
    circuitBreakerEnabled: boolean;
    auditAllMessages: boolean;
    timeoutMs: number;
    maxRetries: number;
}
export declare const bridgeSecurityConfigs: BridgeSecurityConfig[];
export interface AuditConfig {
    enabled: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
    destinations: ('console' | 'file' | 'database' | 'webhook')[];
    retentionDays: number;
    encryptLogs: boolean;
    realTimeAlerts: {
        enabled: boolean;
        thresholds: {
            failedAuthAttempts: number;
            rateLimitViolations: number;
            suspiciousPatterns: number;
        };
    };
}
export declare const auditConfig: AuditConfig;
export interface SecretsConfig {
    provider: 'local' | 'vault' | 'aws-ssm' | 'azure-keyvault' | 'gcp-secret-manager';
    rotation: {
        enabled: boolean;
        intervalDays: number;
        autoRotate: boolean;
    };
    encryption: {
        algorithm: string;
        keyDerivation: string;
    };
    accessControl: {
        requireApproval: boolean;
        auditAccess: boolean;
        expireAccess: boolean;
        maxAccessTime: number;
    };
}
export declare const secretsConfig: SecretsConfig;
export declare const getSecurityConfig: (environment: "development" | "staging" | "production") => {
    policy: SecurityPolicy;
    components: ComponentSecurityConfig[];
    bridges: BridgeSecurityConfig[];
    audit: AuditConfig;
    secrets: SecretsConfig;
};
//# sourceMappingURL=security-config.d.ts.map