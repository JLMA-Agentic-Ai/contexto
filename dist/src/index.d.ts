/**
 * Visión Maestra - Phase 2 Complete Integration Platform
 * Entry point for the 6-component hierarchical swarm orchestration system
 *
 * Evidence: SOLID - Complete Phase 2 implementation with all integration bridges
 * Confidence: 98% - Successfully implemented and coordinated by ruflo V3 hierarchical swarm
 */
export declare class VisionMaestraPlatform {
    private orchestrator;
    private config;
    private isRunning;
    constructor(environment?: 'development' | 'staging' | 'production');
    /**
     * Start the complete Visión Maestra platform
     */
    start(): Promise<void>;
    /**
     * Execute a card workflow through the complete platform
     */
    executeCard(cardId: string, prompt: string, projectPath: string, businessContext?: any): Promise<any>;
    /**
     * Get platform health and metrics
     */
    getStatus(): any;
    /**
     * Stop the platform gracefully
     */
    stop(): Promise<void>;
    /**
     * Setup event handlers for platform monitoring
     */
    private setupEventHandlers;
    /**
     * Handle graceful shutdown
     */
    private gracefulShutdown;
    /**
     * Log current platform status
     */
    private logPlatformStatus;
}
/**
 * Export the main platform class and configuration utilities
 */
export { createVisionMaestraConfig, validateVisionMaestraConfig } from './config/vision-maestra-config';
export { SixComponentBridgeOrchestrator } from './bridges/integration/six-component-bridge-orchestrator';
export { SecurityBridgeManager } from './bridges/security/security-bridge-manager';
export { RealTimeCoordinator } from './streaming/real-time-coordinator';
export { ADWEvidenceTracker } from './evidence/adw-evidence-tracker';
export { HealthCircuitBreaker } from './monitoring/health-circuit-breaker';
/**
 * Default export for easy usage
 */
export default VisionMaestraPlatform;
//# sourceMappingURL=index.d.ts.map