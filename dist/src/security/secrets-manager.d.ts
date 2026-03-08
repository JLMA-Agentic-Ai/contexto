/**
 * Secrets Manager for 6-Component Platform Integration
 * Implements enterprise-grade secrets management with encryption, rotation, and access control
 *
 * Security Features:
 * - AES-256-GCM encryption for secrets at rest
 * - Automatic secret rotation with approval workflows
 * - Fine-grained access control with time-based expiration
 * - Audit logging for all secret access operations
 * - Integration with external secret stores (HashiCorp Vault, AWS SSM, etc.)
 */
import { EventEmitter } from 'events';
import { SecurityAuditLogger } from './audit-logger';
export interface SecretConfig {
    id: string;
    name: string;
    description: string;
    type: 'api-key' | 'database-password' | 'encryption-key' | 'certificate' | 'token' | 'connection-string';
    classification: 'public' | 'internal' | 'confidential' | 'restricted';
    componentId: string;
    rotation: {
        enabled: boolean;
        intervalDays: number;
        lastRotated?: Date;
        nextRotation?: Date;
        autoApprove: boolean;
    };
    access: {
        allowedUsers: string[];
        allowedRoles: string[];
        requireApproval: boolean;
        maxAccessDuration: number;
        emergencyAccess: boolean;
    };
    metadata: {
        createdBy: string;
        createdAt: Date;
        lastModified: Date;
        version: number;
        tags: string[];
    };
}
export interface EncryptedSecret {
    id: string;
    encryptedValue: string;
    iv: string;
    tag: string;
    algorithm: string;
    keyDerivation: {
        salt: string;
        iterations: number;
        algorithm: string;
    };
    checksum: string;
    metadata: {
        encryptedAt: Date;
        encryptedBy: string;
    };
}
export interface SecretAccess {
    id: string;
    secretId: string;
    userId: string;
    requestedAt: Date;
    approvedAt?: Date;
    approvedBy?: string;
    expiresAt: Date;
    purpose: string;
    accessType: 'read' | 'rotate' | 'delete';
    status: 'pending' | 'approved' | 'denied' | 'expired' | 'revoked';
    emergencyAccess: boolean;
}
export interface SecretStore {
    type: 'local' | 'vault' | 'aws-ssm' | 'azure-keyvault' | 'gcp-secret-manager';
    config: any;
    connection?: any;
}
export declare class SecretsManager extends EventEmitter {
    private config;
    private auditLogger;
    private masterKey;
    private secretConfigs;
    private secretStore;
    private pendingAccess;
    private activeAccess;
    private rotationScheduler?;
    constructor(config: {
        storageDirectory: string;
        store: SecretStore;
        masterPassword: string;
        rotationCheckInterval: number;
        emergencyContacts: string[];
    }, auditLogger: SecurityAuditLogger);
    /**
     * Initialize secrets manager and create storage directory
     */
    initialize(): Promise<void>;
    /**
     * Create new secret with encryption and access controls
     */
    createSecret(secretData: {
        name: string;
        description: string;
        value: string;
        type: SecretConfig['type'];
        classification: SecretConfig['classification'];
        componentId: string;
    }, options: {
        rotationEnabled?: boolean;
        rotationIntervalDays?: number;
        allowedUsers?: string[];
        allowedRoles?: string[];
        requireApproval?: boolean;
        tags?: string[];
    }, context: {
        userId: string;
        purpose: string;
    }): Promise<string>;
    /**
     * Request access to secret with approval workflow
     */
    requestSecretAccess(secretId: string, context: {
        userId: string;
        purpose: string;
        accessType: SecretAccess['accessType'];
        emergencyAccess?: boolean;
    }): Promise<string>;
    /**
     * Approve secret access request
     */
    approveSecretAccess(accessId: string, approverId: string, approved: boolean, reason?: string): Promise<void>;
    /**
     * Retrieve secret value (requires active access)
     */
    getSecret(accessId: string, context: {
        userId: string;
        ipAddress?: string;
    }): Promise<string>;
    /**
     * Rotate secret value
     */
    rotateSecret(secretId: string, context: {
        userId: string;
        newValue?: string;
        reason?: string;
    }): Promise<void>;
    /**
     * Delete secret and revoke all access
     */
    deleteSecret(secretId: string, context: {
        userId: string;
        reason: string;
    }): Promise<void>;
    /**
     * List secrets accessible to user
     */
    listSecrets(userId: string, filters?: {
        componentId?: string;
        type?: string;
        classification?: string;
        tags?: string[];
    }): Promise<SecretConfig[]>;
    /**
     * Encrypt secret value
     */
    private encryptSecret;
    /**
     * Decrypt secret value
     */
    private decryptSecret;
    /**
     * Store encrypted secret to configured store
     */
    private storeSecret;
    /**
     * Retrieve encrypted secret from store
     */
    private retrieveSecret;
    /**
     * Delete stored secret
     */
    private deleteStoredSecret;
    /**
     * Check user permission for secret access
     */
    private checkUserPermission;
    /**
     * Check if user is authorized to approve access
     */
    private isAuthorizedApprover;
    /**
     * Get maximum access duration based on classification
     */
    private getMaxAccessDuration;
    /**
     * Generate secret value based on type
     */
    private generateSecretValue;
    /**
     * Derive master key from password
     */
    private deriveMasterKey;
    /**
     * Generate unique secret ID
     */
    private generateSecretId;
    /**
     * Generate unique access ID
     */
    private generateAccessId;
    /**
     * Load secret configurations from storage
     */
    private loadSecretConfigs;
    /**
     * Save secret configurations to storage
     */
    private saveSecretConfigs;
    /**
     * Setup rotation scheduler
     */
    private setupRotationScheduler;
    /**
     * Check rotation schedule and trigger rotations
     */
    private checkRotationSchedule;
    /**
     * Setup access cleanup for expired entries
     */
    private setupAccessCleanup;
    /**
     * Clean up expired access entries
     */
    private cleanupExpiredAccess;
    /**
     * Schedule rotation for a secret
     */
    private scheduleRotation;
    /**
     * Notify approvers of pending access request
     */
    private notifyApprovers;
    /**
     * Notify that rotation is required
     */
    private notifyRotationRequired;
    /**
     * Notify components of secret rotation
     */
    private notifySecretRotation;
}
//# sourceMappingURL=secrets-manager.d.ts.map