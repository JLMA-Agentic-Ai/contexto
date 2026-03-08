/**
 * Security Bridge Manager for Visión Maestra
 * Implements security-hardened protocols for all 6 component integrations
 *
 * Evidence: SOLID - Security is critical for multi-component integration
 * Confidence: 95% - Based on enterprise security patterns
 */
import { ComponentMessage } from '../base/component-bridge';
import { EventEmitter } from 'events';
export interface SecurityContext {
    userId: string;
    sessionId: string;
    permissions: string[];
    ipAddress: string;
    timestamp: Date;
}
export interface EncryptionConfig {
    algorithm: string;
    keyLength: number;
    ivLength: number;
    tagLength: number;
}
export interface ThreatDetection {
    enabled: boolean;
    rateLimiting: {
        maxRequests: number;
        timeWindow: number;
    };
    suspicious: {
        ipBlacklist: string[];
        patterns: RegExp[];
    };
    monitoring: {
        logLevel: string;
        alertWebhook?: string;
    };
}
export interface SecurityPolicy {
    authentication: {
        required: boolean;
        methods: ('jwt' | 'api-key' | 'oauth2')[];
        expiration: number;
    };
    authorization: {
        rbac: boolean;
        permissions: string[];
    };
    encryption: EncryptionConfig;
    threatDetection: ThreatDetection;
}
export declare class SecurityBridgeManager extends EventEmitter {
    private policy;
    private masterKey?;
    private encryptionKey;
    private activeSessions;
    private rateLimitTracker;
    private threatCount;
    constructor(policy: SecurityPolicy, masterKey?: string);
    /**
     * Secure message transmission between components
     */
    secureMessage(message: ComponentMessage, context: SecurityContext): Promise<ComponentMessage>;
    /**
     * Decrypt and verify incoming secure messages
     */
    verifyMessage(secureMessage: ComponentMessage): Promise<ComponentMessage>;
    /**
     * Create secure session for component communication
     */
    createSession(userId: string, permissions: string[], ipAddress: string): Promise<string>;
    /**
     * Validate security context and permissions
     */
    private validateSecurityContext;
    /**
     * Rate limiting implementation
     */
    private checkRateLimit;
    /**
     * Encrypt message payload
     */
    private encryptPayload;
    /**
     * Decrypt message payload
     */
    private decryptPayload;
    /**
     * Sign message for integrity verification
     */
    private signMessage;
    /**
     * Verify message signature
     */
    private verifySignature;
    /**
     * Generate secure session ID
     */
    private generateSessionId;
    /**
     * Derive encryption key from master key
     */
    private deriveEncryptionKey;
    /**
     * Setup threat detection monitoring
     */
    private setupThreatDetection;
    /**
     * Increment threat count for IP
     */
    private incrementThreatCount;
    /**
     * Cleanup old tracking data
     */
    private cleanupOldTracking;
    /**
     * Log security events
     */
    private logSecurityEvent;
    /**
     * Get security metrics
     */
    getSecurityMetrics(): any;
    /**
     * Shutdown security manager
     */
    shutdown(): Promise<void>;
}
export declare const defaultSecurityPolicy: SecurityPolicy;
//# sourceMappingURL=security-bridge-manager.d.ts.map