/**
 * Main Platform Entry Point for Visión Maestra
 * Initializes and coordinates all 6 components
 */

import { PlatformOrchestrator } from './platform-orchestrator';
import { PlatformConfig } from '../../config/platform/platform-config';
import { DossierRufloBridge } from '../bridges/dossier-ruflo/dossier-ruflo-bridge';
import { RufloADWBridge } from '../bridges/ruflo-adw/ruflo-adw-bridge';
import { GitNexusRLMBridge } from '../bridges/gitnexus-rlm/gitnexus-rlm-bridge';

export class VisionMaestraPlatform {
  private orchestrator: PlatformOrchestrator;
  private config: PlatformConfig;
  private isRunning = false;

  constructor(configPath?: string) {
    this.config = new PlatformConfig(configPath);
    this.orchestrator = new PlatformOrchestrator(this.config);
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Platform is already running');
    }

    try {
      console.log('🚀 Starting Visión Maestra Platform...');

      // Initialize platform orchestrator
      await this.orchestrator.initialize();

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      this.isRunning = true;

      console.log('✅ Visión Maestra Platform is ready!');
      console.log(`📊 Dashboard: http://localhost:${this.config.components.dossier.port}`);
      console.log(`🔗 API: http://localhost:${this.config.integration.api.port}`);
      console.log(`🔄 WebSocket: ws://localhost:${this.config.streaming.websocket.port}`);

      // Start platform monitoring
      this.startMonitoring();

    } catch (error) {
      console.error('❌ Failed to start platform:', error);
      await this.stop();
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    console.log('🛑 Stopping Visión Maestra Platform...');

    try {
      await this.orchestrator.shutdown();
      this.isRunning = false;
      console.log('✅ Platform stopped successfully');
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async () => {
      console.log('\n🔄 Graceful shutdown initiated...');
      await this.stop();
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      shutdown();
    });
    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown();
    });
  }

  private startMonitoring(): void {
    if (!this.config.monitoring.enabled) {
      return;
    }

    setInterval(() => {
      this.logSystemStatus();
    }, 30000); // Log status every 30 seconds
  }

  private logSystemStatus(): void {
    const state = this.orchestrator.getState();
    const componentCount = state.components.size;
    const activeWorkflows = state.workflows.size;
    const activeStreams = state.streams.size;

    console.log(`📊 System Status: ${componentCount} components, ${activeWorkflows} workflows, ${activeStreams} streams`);
  }

  getHealth(): any {
    return {
      platform: {
        running: this.isRunning,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: this.config.platform.version
      },
      components: this.orchestrator.getState()
    };
  }

  getConfig(): PlatformConfig {
    return this.config;
  }

  isHealthy(): boolean {
    return this.isRunning && this.orchestrator !== null;
  }
}

// CLI Integration
export async function startPlatform(options: any = {}): Promise<VisionMaestraPlatform> {
  const configPath = options.config;
  const platform = new VisionMaestraPlatform(configPath);

  await platform.start();
  return platform;
}

// Main execution when run directly
if (require.main === module) {
  const args = process.argv.slice(2);
  const configPath = args.find(arg => arg.startsWith('--config='))?.split('=')[1];

  startPlatform({ config: configPath })
    .then((platform) => {
      console.log('🎯 Platform started successfully. Press Ctrl+C to stop.');
    })
    .catch((error) => {
      console.error('💥 Failed to start platform:', error);
      process.exit(1);
    });
}