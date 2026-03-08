/**
 * Visión Maestra: Deployment Manager
 * Handles production deployment and environment management for 6-component platform
 */
import { EventEmitter } from 'events';
import { PlatformConfig } from '../platform/VisualMaestraMain.js';
export interface DeploymentConfig {
    environment: 'staging' | 'production';
    strategy: 'blue-green' | 'rolling' | 'canary' | 'atomic';
    validation: {
        preDeployment: ValidationCheck[];
        postDeployment: ValidationCheck[];
        rollbackTriggers: RollbackTrigger[];
    };
    infrastructure: {
        containerization: boolean;
        orchestration: 'docker-compose' | 'kubernetes' | 'docker-swarm';
        scaling: ScalingConfig;
        monitoring: MonitoringConfig;
    };
    security: {
        secretsManagement: boolean;
        networkPolicies: boolean;
        rbacPolicies: boolean;
        auditLogging: boolean;
    };
    backup: {
        enabled: boolean;
        retention: number;
        strategy: 'full' | 'incremental';
    };
}
export interface ValidationCheck {
    id: string;
    name: string;
    description: string;
    script: string;
    timeout: number;
    retryCount: number;
    critical: boolean;
}
export interface RollbackTrigger {
    metric: string;
    threshold: number;
    window: number;
    action: 'rollback' | 'alert' | 'pause';
}
export interface ScalingConfig {
    minInstances: number;
    maxInstances: number;
    cpuThreshold: number;
    memoryThreshold: number;
    autoScaling: boolean;
}
export interface MonitoringConfig {
    healthChecks: boolean;
    metrics: boolean;
    logging: boolean;
    alerting: boolean;
    dashboards: boolean;
}
export interface DeploymentStatus {
    id: string;
    environment: string;
    strategy: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'rolled-back';
    progress: number;
    startTime: Date;
    endTime?: Date;
    components: ComponentDeploymentStatus[];
    validationResults: ValidationResult[];
    rollbackInfo?: RollbackInfo;
}
export interface ComponentDeploymentStatus {
    component: string;
    status: 'pending' | 'deploying' | 'deployed' | 'failed';
    version: string;
    health: 'healthy' | 'unhealthy' | 'unknown';
    startTime: Date;
    endTime?: Date;
    errors?: string[];
}
export interface ValidationResult {
    checkId: string;
    status: 'passed' | 'failed' | 'skipped';
    message: string;
    executionTime: number;
    timestamp: Date;
}
export interface RollbackInfo {
    reason: string;
    triggeredBy: string;
    previousVersion: string;
    rollbackTime: Date;
    success: boolean;
}
/**
 * Deployment Manager for Production Deployment
 */
export declare class DeploymentManager extends EventEmitter {
    private config;
    private activeDeployments;
    constructor(config: DeploymentConfig);
    /**
     * Deploy the platform to specified environment
     */
    deployPlatform(platformConfig: PlatformConfig, deploymentId?: string): Promise<DeploymentStatus>;
    /**
     * Rollback a deployment
     */
    rollbackDeployment(deploymentId: string, reason: string): Promise<boolean>;
    /**
     * Get deployment status
     */
    getDeploymentStatus(deploymentId: string): DeploymentStatus | undefined;
    /**
     * Get all active deployments
     */
    getActiveDeployments(): DeploymentStatus[];
    /**
     * Validate deployment configuration
     */
    validateDeploymentConfig(): Promise<{
        valid: boolean;
        errors: string[];
        warnings: string[];
    }>;
    /**
     * Initialize component deployment statuses
     */
    private initializeComponentStatuses;
    /**
     * Run pre-deployment validation checks
     */
    private runPreDeploymentValidation;
    /**
     * Prepare infrastructure for deployment
     */
    private prepareInfrastructure;
    /**
     * Deploy all platform components
     */
    private deployComponents;
    /**
     * Run post-deployment validation
     */
    private runPostDeploymentValidation;
    /**
     * Verify deployment health
     */
    private verifyDeploymentHealth;
    /**
     * Execute a validation check
     */
    private executeValidationCheck;
    /**
     * Run validation script
     */
    private runValidationScript;
    /**
     * Setup orchestration (Docker/Kubernetes)
     */
    private setupOrchestration;
    /**
     * Setup networking
     */
    private setupNetworking;
    /**
     * Setup secrets management
     */
    private setupSecrets;
    /**
     * Setup monitoring
     */
    private setupMonitoring;
    /**
     * Deploy individual component
     */
    private deployComponent;
    /**
     * Deploy Dossier component
     */
    private deployDossierComponent;
    /**
     * Deploy ruflo component
     */
    private deployRufloComponent;
    /**
     * Deploy GitNexus component
     */
    private deployGitNexusComponent;
    /**
     * Deploy generic component
     */
    private deployGenericComponent;
    /**
     * Simulate component deployment
     */
    private simulateDeployment;
    /**
     * Wait for components to start up
     */
    private waitForComponentsStartup;
    /**
     * Check component health
     */
    private checkComponentHealth;
    /**
     * Execute rollback strategy
     */
    private executeRollback;
    /**
     * Rollback individual component
     */
    private rollbackComponent;
    /**
     * Check if auto-rollback should be triggered
     */
    private shouldAutoRollback;
}
//# sourceMappingURL=DeploymentManager.d.ts.map