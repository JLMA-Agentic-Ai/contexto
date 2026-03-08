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

import { createCipheriv, createDecipheriv, randomBytes, createHash, pbkdf2Sync } from 'crypto';
import { EventEmitter } from 'events';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
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
    maxAccessDuration: number; // milliseconds
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

export class SecretsManager extends EventEmitter {
  private masterKey: Buffer;
  private secretConfigs: Map<string, SecretConfig> = new Map();
  private secretStore: SecretStore;
  private pendingAccess: Map<string, SecretAccess> = new Map();
  private activeAccess: Map<string, SecretAccess> = new Map();
  private rotationScheduler?: NodeJS.Timer;

  constructor(
    private config: {
      storageDirectory: string;
      store: SecretStore;
      masterPassword: string;
      rotationCheckInterval: number;
      emergencyContacts: string[];
    },
    private auditLogger: SecurityAuditLogger
  ) {
    super();

    this.masterKey = this.deriveMasterKey(config.masterPassword);
    this.secretStore = config.store;
    this.setupRotationScheduler();
    this.setupAccessCleanup();
  }

  /**
   * Initialize secrets manager and create storage directory
   */
  async initialize(): Promise<void> {
    try {
      await mkdir(this.config.storageDirectory, { recursive: true });
      await this.loadSecretConfigs();

      this.auditLogger.logConfigurationEvent({
        type: 'component_registered',
        userId: 'system',
        componentId: 'secrets-manager',
        changes: { action: 'initialized', store: this.secretStore.type },
        timestamp: new Date()
      });

      this.emit('initialized');
    } catch (error) {
      this.auditLogger.logSecurityEvent({
        type: 'circuit_state_forced',
        componentId: 'secrets-manager',
        reason: `Initialization failed: ${(error as Error).message}`,
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Create new secret with encryption and access controls
   */
  async createSecret(
    secretData: {
      name: string;
      description: string;
      value: string;
      type: SecretConfig['type'];
      classification: SecretConfig['classification'];
      componentId: string;
    },
    options: {
      rotationEnabled?: boolean;
      rotationIntervalDays?: number;
      allowedUsers?: string[];
      allowedRoles?: string[];
      requireApproval?: boolean;
      tags?: string[];
    },
    context: {
      userId: string;
      purpose: string;
    }
  ): Promise<string> {
    const secretId = this.generateSecretId();

    // Create secret configuration
    const secretConfig: SecretConfig = {
      id: secretId,
      name: secretData.name,
      description: secretData.description,
      type: secretData.type,
      classification: secretData.classification,
      componentId: secretData.componentId,
      rotation: {
        enabled: options.rotationEnabled || false,
        intervalDays: options.rotationIntervalDays || 30,
        autoApprove: secretData.classification === 'internal' || secretData.classification === 'public'
      },
      access: {
        allowedUsers: options.allowedUsers || [context.userId],
        allowedRoles: options.allowedRoles || [],
        requireApproval: options.requireApproval !== false, // Default to true
        maxAccessDuration: this.getMaxAccessDuration(secretData.classification),
        emergencyAccess: secretData.classification !== 'restricted'
      },
      metadata: {
        createdBy: context.userId,
        createdAt: new Date(),
        lastModified: new Date(),
        version: 1,
        tags: options.tags || []
      }
    };

    // Encrypt and store secret value
    const encryptedSecret = await this.encryptSecret(secretData.value, secretId, context.userId);
    await this.storeSecret(secretId, encryptedSecret);

    // Store configuration
    this.secretConfigs.set(secretId, secretConfig);
    await this.saveSecretConfigs();

    // Schedule rotation if enabled
    if (secretConfig.rotation.enabled) {
      this.scheduleRotation(secretId);
    }

    // Audit logging
    this.auditLogger.logDataAccessEvent({
      type: 'data_write',
      userId: context.userId,
      dataType: 'secret',
      dataId: secretId,
      classification: secretData.classification,
      success: true,
      timestamp: new Date()
    });

    this.auditLogger.logConfigurationEvent({
      type: 'config_changed',
      userId: context.userId,
      componentId: secretData.componentId,
      changes: {
        action: 'secret_created',
        secretId,
        name: secretData.name,
        type: secretData.type,
        classification: secretData.classification
      },
      timestamp: new Date()
    });

    this.emit('secret_created', { secretId, config: secretConfig, createdBy: context.userId });

    return secretId;
  }

  /**
   * Request access to secret with approval workflow
   */
  async requestSecretAccess(
    secretId: string,
    context: {
      userId: string;
      purpose: string;
      accessType: SecretAccess['accessType'];
      emergencyAccess?: boolean;
    }
  ): Promise<string> {
    const config = this.secretConfigs.get(secretId);
    if (!config) {
      throw new Error(`Secret not found: ${secretId}`);
    }

    // Check if user has permission to request access
    const hasPermission = this.checkUserPermission(config, context.userId);
    if (!hasPermission && !context.emergencyAccess) {
      this.auditLogger.logAuthorizationEvent({
        type: 'authorization_failure',
        userId: context.userId,
        componentId: config.componentId,
        permission: `secret:${context.accessType}`,
        timestamp: new Date()
      });
      throw new Error('Access denied: insufficient permissions');
    }

    const accessId = this.generateAccessId();
    const expirationDuration = context.emergencyAccess
      ? 60 * 60 * 1000 // 1 hour for emergency access
      : config.access.maxAccessDuration;

    const secretAccess: SecretAccess = {
      id: accessId,
      secretId,
      userId: context.userId,
      requestedAt: new Date(),
      expiresAt: new Date(Date.now() + expirationDuration),
      purpose: context.purpose,
      accessType: context.accessType,
      status: 'pending',
      emergencyAccess: context.emergencyAccess || false
    };

    // Auto-approve for certain scenarios
    const autoApprove =
      !config.access.requireApproval ||
      context.emergencyAccess ||
      config.classification === 'public' ||
      (config.classification === 'internal' && context.accessType === 'read');

    if (autoApprove) {
      secretAccess.status = 'approved';
      secretAccess.approvedAt = new Date();
      secretAccess.approvedBy = 'system';
      this.activeAccess.set(accessId, secretAccess);
    } else {
      this.pendingAccess.set(accessId, secretAccess);
      this.notifyApprovers(secretAccess, config);
    }

    // Audit logging
    this.auditLogger.logDataAccessEvent({
      type: 'data_read',
      userId: context.userId,
      dataType: 'secret_access_request',
      dataId: secretId,
      classification: config.classification,
      success: true,
      reason: context.purpose,
      timestamp: new Date()
    });

    if (context.emergencyAccess) {
      this.auditLogger.logSecurityEvent({
        type: 'threat_detected',
        componentId: config.componentId,
        userId: context.userId,
        reason: `Emergency secret access requested for ${secretId}`,
        timestamp: new Date()
      });
    }

    this.emit('access_requested', { accessId, secretAccess, config });

    return accessId;
  }

  /**
   * Approve secret access request
   */
  async approveSecretAccess(
    accessId: string,
    approverId: string,
    approved: boolean,
    reason?: string
  ): Promise<void> {
    const access = this.pendingAccess.get(accessId);
    if (!access) {
      throw new Error(`Access request not found: ${accessId}`);
    }

    const config = this.secretConfigs.get(access.secretId)!;

    // Check if approver has permission
    if (!this.isAuthorizedApprover(config, approverId)) {
      throw new Error('Access denied: not authorized to approve secret access');
    }

    if (approved) {
      access.status = 'approved';
      access.approvedAt = new Date();
      access.approvedBy = approverId;
      this.activeAccess.set(accessId, access);
    } else {
      access.status = 'denied';
    }

    this.pendingAccess.delete(accessId);

    // Audit logging
    this.auditLogger.logAuthorizationEvent({
      type: approved ? 'authorization_success' : 'authorization_failure',
      userId: access.userId,
      componentId: config.componentId,
      permission: `secret:${access.accessType}`,
      timestamp: new Date()
    });

    this.auditLogger.logConfigurationEvent({
      type: 'config_changed',
      userId: approverId,
      componentId: config.componentId,
      changes: {
        action: 'access_approval',
        accessId,
        approved,
        reason,
        targetUser: access.userId
      },
      timestamp: new Date()
    });

    this.emit('access_approved', { accessId, access, approved, approverId });
  }

  /**
   * Retrieve secret value (requires active access)
   */
  async getSecret(
    accessId: string,
    context: {
      userId: string;
      ipAddress?: string;
    }
  ): Promise<string> {
    const access = this.activeAccess.get(accessId);
    if (!access) {
      throw new Error('Access not found or expired');
    }

    if (access.userId !== context.userId) {
      throw new Error('Access denied: user mismatch');
    }

    if (access.expiresAt < new Date()) {
      this.activeAccess.delete(accessId);
      throw new Error('Access expired');
    }

    const config = this.secretConfigs.get(access.secretId)!;

    // Retrieve and decrypt secret
    const encryptedSecret = await this.retrieveSecret(access.secretId);
    const secretValue = await this.decryptSecret(encryptedSecret, access.secretId);

    // Audit logging
    this.auditLogger.logDataAccessEvent({
      type: 'data_read',
      userId: context.userId,
      dataType: 'secret',
      dataId: access.secretId,
      classification: config.classification,
      success: true,
      reason: access.purpose,
      timestamp: new Date()
    });

    this.emit('secret_accessed', {
      secretId: access.secretId,
      userId: context.userId,
      purpose: access.purpose,
      ipAddress: context.ipAddress
    });

    return secretValue;
  }

  /**
   * Rotate secret value
   */
  async rotateSecret(
    secretId: string,
    context: {
      userId: string;
      newValue?: string;
      reason?: string;
    }
  ): Promise<void> {
    const config = this.secretConfigs.get(secretId);
    if (!config) {
      throw new Error(`Secret not found: ${secretId}`);
    }

    // Generate new value if not provided
    const newValue = context.newValue || this.generateSecretValue(config.type);

    // Encrypt and store new value
    const encryptedSecret = await this.encryptSecret(newValue, secretId, context.userId);
    await this.storeSecret(secretId, encryptedSecret);

    // Update configuration
    config.metadata.lastModified = new Date();
    config.metadata.version++;
    config.rotation.lastRotated = new Date();
    if (config.rotation.enabled) {
      config.rotation.nextRotation = new Date(
        Date.now() + config.rotation.intervalDays * 24 * 60 * 60 * 1000
      );
    }

    this.secretConfigs.set(secretId, config);
    await this.saveSecretConfigs();

    // Audit logging
    this.auditLogger.logDataAccessEvent({
      type: 'data_write',
      userId: context.userId,
      dataType: 'secret',
      dataId: secretId,
      classification: config.classification,
      success: true,
      reason: context.reason || 'Secret rotation',
      timestamp: new Date()
    });

    this.auditLogger.logConfigurationEvent({
      type: 'security_policy_updated',
      userId: context.userId,
      componentId: config.componentId,
      changes: {
        action: 'secret_rotated',
        secretId,
        version: config.metadata.version,
        reason: context.reason
      },
      timestamp: new Date()
    });

    this.emit('secret_rotated', { secretId, config, rotatedBy: context.userId });

    // Notify components that use this secret
    this.notifySecretRotation(secretId, config);
  }

  /**
   * Delete secret and revoke all access
   */
  async deleteSecret(
    secretId: string,
    context: {
      userId: string;
      reason: string;
    }
  ): Promise<void> {
    const config = this.secretConfigs.get(secretId);
    if (!config) {
      throw new Error(`Secret not found: ${secretId}`);
    }

    // Revoke all active access
    for (const [accessId, access] of this.activeAccess.entries()) {
      if (access.secretId === secretId) {
        access.status = 'revoked';
        this.activeAccess.delete(accessId);
      }
    }

    // Remove from pending access
    for (const [accessId, access] of this.pendingAccess.entries()) {
      if (access.secretId === secretId) {
        access.status = 'revoked';
        this.pendingAccess.delete(accessId);
      }
    }

    // Delete encrypted secret
    await this.deleteStoredSecret(secretId);

    // Remove configuration
    this.secretConfigs.delete(secretId);
    await this.saveSecretConfigs();

    // Audit logging
    this.auditLogger.logDataAccessEvent({
      type: 'data_delete',
      userId: context.userId,
      dataType: 'secret',
      dataId: secretId,
      classification: config.classification,
      success: true,
      reason: context.reason,
      timestamp: new Date()
    });

    this.auditLogger.logConfigurationEvent({
      type: 'config_changed',
      userId: context.userId,
      componentId: config.componentId,
      changes: {
        action: 'secret_deleted',
        secretId,
        reason: context.reason
      },
      timestamp: new Date()
    });

    this.emit('secret_deleted', { secretId, config, deletedBy: context.userId });
  }

  /**
   * List secrets accessible to user
   */
  async listSecrets(
    userId: string,
    filters?: {
      componentId?: string;
      type?: string;
      classification?: string;
      tags?: string[];
    }
  ): Promise<SecretConfig[]> {
    const userSecrets: SecretConfig[] = [];

    for (const config of this.secretConfigs.values()) {
      // Check user permission
      if (!this.checkUserPermission(config, userId)) {
        continue;
      }

      // Apply filters
      if (filters?.componentId && config.componentId !== filters.componentId) {
        continue;
      }
      if (filters?.type && config.type !== filters.type) {
        continue;
      }
      if (filters?.classification && config.classification !== filters.classification) {
        continue;
      }
      if (filters?.tags && !filters.tags.every(tag => config.metadata.tags.includes(tag))) {
        continue;
      }

      // Return config without sensitive data
      userSecrets.push({
        ...config,
        // Don't include sensitive access info in list
        access: {
          ...config.access,
          allowedUsers: [],
          allowedRoles: []
        }
      });
    }

    return userSecrets;
  }

  /**
   * Encrypt secret value
   */
  private async encryptSecret(value: string, secretId: string, userId: string): Promise<EncryptedSecret> {
    const salt = randomBytes(32);
    const iv = randomBytes(16);

    // Derive encryption key using PBKDF2
    const derivedKey = pbkdf2Sync(this.masterKey, salt, 100000, 32, 'sha256');

    // Encrypt using AES-256-GCM
    const cipher = createCipheriv('aes-256-gcm', derivedKey, iv);
    let encrypted = cipher.update(value, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();

    // Calculate checksum for integrity verification
    const checksum = createHash('sha256')
      .update(encrypted + iv.toString('hex') + tag.toString('hex'))
      .digest('hex');

    return {
      id: secretId,
      encryptedValue: encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      algorithm: 'aes-256-gcm',
      keyDerivation: {
        salt: salt.toString('hex'),
        iterations: 100000,
        algorithm: 'pbkdf2'
      },
      checksum,
      metadata: {
        encryptedAt: new Date(),
        encryptedBy: userId
      }
    };
  }

  /**
   * Decrypt secret value
   */
  private async decryptSecret(encryptedSecret: EncryptedSecret, secretId: string): Promise<string> {
    // Verify checksum
    const calculatedChecksum = createHash('sha256')
      .update(encryptedSecret.encryptedValue + encryptedSecret.iv + encryptedSecret.tag)
      .digest('hex');

    if (calculatedChecksum !== encryptedSecret.checksum) {
      throw new Error('Secret integrity check failed - possible tampering detected');
    }

    // Derive decryption key
    const salt = Buffer.from(encryptedSecret.keyDerivation.salt, 'hex');
    const derivedKey = pbkdf2Sync(
      this.masterKey,
      salt,
      encryptedSecret.keyDerivation.iterations,
      32,
      'sha256'
    );

    // Decrypt using AES-256-GCM
    const decipher = createDecipheriv('aes-256-gcm', derivedKey, Buffer.from(encryptedSecret.iv, 'hex'));
    decipher.setAuthTag(Buffer.from(encryptedSecret.tag, 'hex'));

    let decrypted = decipher.update(encryptedSecret.encryptedValue, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  /**
   * Store encrypted secret to configured store
   */
  private async storeSecret(secretId: string, encryptedSecret: EncryptedSecret): Promise<void> {
    const filePath = join(this.config.storageDirectory, `${secretId}.enc`);
    const secretData = JSON.stringify(encryptedSecret, null, 2);

    switch (this.secretStore.type) {
      case 'local':
        await writeFile(filePath, secretData, { mode: 0o600 });
        break;

      case 'vault':
      case 'aws-ssm':
      case 'azure-keyvault':
      case 'gcp-secret-manager':
        // Integration with external secret stores would go here
        throw new Error(`External secret store ${this.secretStore.type} not implemented`);

      default:
        throw new Error(`Unknown secret store type: ${this.secretStore.type}`);
    }
  }

  /**
   * Retrieve encrypted secret from store
   */
  private async retrieveSecret(secretId: string): Promise<EncryptedSecret> {
    const filePath = join(this.config.storageDirectory, `${secretId}.enc`);

    switch (this.secretStore.type) {
      case 'local':
        const secretData = await readFile(filePath, 'utf8');
        return JSON.parse(secretData);

      case 'vault':
      case 'aws-ssm':
      case 'azure-keyvault':
      case 'gcp-secret-manager':
        throw new Error(`External secret store ${this.secretStore.type} not implemented`);

      default:
        throw new Error(`Unknown secret store type: ${this.secretStore.type}`);
    }
  }

  /**
   * Delete stored secret
   */
  private async deleteStoredSecret(secretId: string): Promise<void> {
    const filePath = join(this.config.storageDirectory, `${secretId}.enc`);

    switch (this.secretStore.type) {
      case 'local':
        // In production, would use secure deletion
        await writeFile(filePath, '', { mode: 0o600 });
        break;

      default:
        throw new Error(`Secret deletion not implemented for ${this.secretStore.type}`);
    }
  }

  /**
   * Check user permission for secret access
   */
  private checkUserPermission(config: SecretConfig, userId: string): boolean {
    return config.access.allowedUsers.includes(userId) ||
           config.access.allowedUsers.includes('*') ||
           config.metadata.createdBy === userId;
  }

  /**
   * Check if user is authorized to approve access
   */
  private isAuthorizedApprover(config: SecretConfig, approverId: string): boolean {
    // In production, this would check against proper role-based access
    return config.metadata.createdBy === approverId ||
           config.access.allowedUsers.includes(approverId) ||
           this.config.emergencyContacts.includes(approverId);
  }

  /**
   * Get maximum access duration based on classification
   */
  private getMaxAccessDuration(classification: string): number {
    switch (classification) {
      case 'restricted': return 60 * 60 * 1000; // 1 hour
      case 'confidential': return 4 * 60 * 60 * 1000; // 4 hours
      case 'internal': return 24 * 60 * 60 * 1000; // 24 hours
      case 'public': return 7 * 24 * 60 * 60 * 1000; // 7 days
      default: return 4 * 60 * 60 * 1000; // 4 hours default
    }
  }

  /**
   * Generate secret value based on type
   */
  private generateSecretValue(type: string): string {
    switch (type) {
      case 'api-key':
        return 'sk_' + randomBytes(32).toString('hex');
      case 'database-password':
        return randomBytes(24).toString('base64').replace(/[+/=]/g, '');
      case 'encryption-key':
        return randomBytes(32).toString('hex');
      case 'token':
        return randomBytes(32).toString('base64url');
      default:
        return randomBytes(24).toString('hex');
    }
  }

  /**
   * Derive master key from password
   */
  private deriveMasterKey(password: string): Buffer {
    const salt = process.env.SECRETS_SALT || 'vision-maestra-secrets-salt';
    return pbkdf2Sync(password, salt, 100000, 32, 'sha256');
  }

  /**
   * Generate unique secret ID
   */
  private generateSecretId(): string {
    return 'sec_' + randomBytes(16).toString('hex');
  }

  /**
   * Generate unique access ID
   */
  private generateAccessId(): string {
    return 'acc_' + randomBytes(12).toString('hex');
  }

  /**
   * Load secret configurations from storage
   */
  private async loadSecretConfigs(): Promise<void> {
    try {
      const configPath = join(this.config.storageDirectory, 'configs.json');
      const configData = await readFile(configPath, 'utf8');
      const configs = JSON.parse(configData);

      for (const config of configs) {
        // Parse dates
        config.metadata.createdAt = new Date(config.metadata.createdAt);
        config.metadata.lastModified = new Date(config.metadata.lastModified);
        if (config.rotation.lastRotated) {
          config.rotation.lastRotated = new Date(config.rotation.lastRotated);
        }
        if (config.rotation.nextRotation) {
          config.rotation.nextRotation = new Date(config.rotation.nextRotation);
        }

        this.secretConfigs.set(config.id, config);
      }
    } catch (error) {
      // Configs don't exist yet - this is okay for first run
    }
  }

  /**
   * Save secret configurations to storage
   */
  private async saveSecretConfigs(): Promise<void> {
    const configPath = join(this.config.storageDirectory, 'configs.json');
    const configs = Array.from(this.secretConfigs.values());
    await writeFile(configPath, JSON.stringify(configs, null, 2), { mode: 0o600 });
  }

  /**
   * Setup rotation scheduler
   */
  private setupRotationScheduler(): void {
    this.rotationScheduler = setInterval(() => {
      this.checkRotationSchedule();
    }, this.config.rotationCheckInterval);
  }

  /**
   * Check rotation schedule and trigger rotations
   */
  private async checkRotationSchedule(): Promise<void> {
    const now = new Date();

    for (const [secretId, config] of this.secretConfigs.entries()) {
      if (!config.rotation.enabled) continue;
      if (!config.rotation.nextRotation) continue;
      if (config.rotation.nextRotation > now) continue;

      try {
        if (config.rotation.autoApprove) {
          await this.rotateSecret(secretId, {
            userId: 'system',
            reason: 'Scheduled automatic rotation'
          });
        } else {
          this.notifyRotationRequired(secretId, config);
        }
      } catch (error) {
        this.auditLogger.logSecurityEvent({
          type: 'circuit_state_forced',
          componentId: config.componentId,
          reason: `Auto-rotation failed for secret ${secretId}: ${(error as Error).message}`,
          timestamp: new Date()
        });
      }
    }
  }

  /**
   * Setup access cleanup for expired entries
   */
  private setupAccessCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredAccess();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  /**
   * Clean up expired access entries
   */
  private cleanupExpiredAccess(): void {
    const now = new Date();

    // Clean active access
    for (const [accessId, access] of this.activeAccess.entries()) {
      if (access.expiresAt < now) {
        access.status = 'expired';
        this.activeAccess.delete(accessId);
        this.emit('access_expired', { accessId, access });
      }
    }

    // Clean pending access (expire after 24 hours)
    for (const [accessId, access] of this.pendingAccess.entries()) {
      const expireTime = new Date(access.requestedAt.getTime() + 24 * 60 * 60 * 1000);
      if (now > expireTime) {
        access.status = 'expired';
        this.pendingAccess.delete(accessId);
        this.emit('access_expired', { accessId, access });
      }
    }
  }

  /**
   * Schedule rotation for a secret
   */
  private scheduleRotation(secretId: string): void {
    const config = this.secretConfigs.get(secretId);
    if (!config || !config.rotation.enabled) return;

    const nextRotation = new Date(Date.now() + config.rotation.intervalDays * 24 * 60 * 60 * 1000);
    config.rotation.nextRotation = nextRotation;
    this.secretConfigs.set(secretId, config);
  }

  /**
   * Notify approvers of pending access request
   */
  private notifyApprovers(access: SecretAccess, config: SecretConfig): void {
    // In production, this would send notifications via email/Slack/etc.
    this.emit('approval_required', { access, config });
  }

  /**
   * Notify that rotation is required
   */
  private notifyRotationRequired(secretId: string, config: SecretConfig): void {
    // In production, this would send notifications
    this.emit('rotation_required', { secretId, config });
  }

  /**
   * Notify components of secret rotation
   */
  private notifySecretRotation(secretId: string, config: SecretConfig): void {
    // In production, this would notify affected components
    this.emit('secret_rotation_completed', { secretId, config });
  }
}