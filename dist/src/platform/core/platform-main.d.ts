/**
 * Main Platform Entry Point for Visión Maestra
 * Initializes and coordinates all 6 components
 */
import { PlatformConfig } from '../../config/platform/platform-config';
export declare class VisionMaestraPlatform {
    private orchestrator;
    private config;
    private isRunning;
    constructor(configPath?: string);
    start(): Promise<void>;
    stop(): Promise<void>;
    private setupGracefulShutdown;
    private startMonitoring;
    private logSystemStatus;
    getHealth(): any;
    getConfig(): PlatformConfig;
    isHealthy(): boolean;
}
export declare function startPlatform(options?: any): Promise<VisionMaestraPlatform>;
//# sourceMappingURL=platform-main.d.ts.map