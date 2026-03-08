/**
 * Bridge Integration System Entry Point
 * Exports all bridges, types, and utilities for integration use
 */

// Import all bridge implementations first
import { BaseBridge } from './base/BaseBridge';
import { DossierBridge } from './DossierBridge';
import { RufloBridge } from './RufloBridge';
import { ADWSkillsBridge } from './ADWSkillsBridge';
import { GitNexusBridge } from './GitNexusBridge';
import { RLMNavigatorBridge } from './RLMNavigatorBridge';
import { ClaudeCodeBridge } from './ClaudeCodeBridge';

// Re-export bridge implementations
export { BaseBridge, DossierBridge, RufloBridge, ADWSkillsBridge, GitNexusBridge, RLMNavigatorBridge, ClaudeCodeBridge };

// Type definitions
export * from './types/common';

// Event system
export * from './events/EventTypes';

// Error handling
export * from './errors/ErrorHandling';

// Bridge configuration interfaces
export type {
  DossierConfig,
  DossierTask,
  DossierWorkflow,
  DossierWorkflowStep,
  UIComponentState,
  OrchestrationEvent
} from './DossierBridge';

export type {
  RufloConfig,
  RufloAgent,
  RufloTask,
  SwarmConfiguration,
  SwarmState,
  RufloMemoryItem,
  TaskExecutionEvent
} from './RufloBridge';

export type {
  ADWConfig,
  ADWInvestigation,
  ADWHypothesis,
  ADWTest,
  ADWSkill,
  ADWSkillParameter,
  ADWSkillOutput,
  ADWTimelineEvent,
  ADWWorkflowTemplate,
  ADWWorkflowStep,
  InvestigationEvent
} from './ADWSkillsBridge';

export type {
  GitNexusConfig,
  GitRepository,
  CodeSymbol,
  CodeRelationship,
  ExecutionFlow,
  ExecutionStep,
  GraphQuery,
  GraphQueryResult,
  ImpactAnalysis,
  CodeInsight,
  IndexingEvent
} from './GitNexusBridge';

export type {
  RLMNavigatorConfig,
  ASTNode,
  NodeReference,
  NavigationSession,
  NavigationStep,
  NavigationBookmark,
  NavigationFilter,
  SemanticQuery,
  SemanticResult,
  ControlFlowGraph,
  CFGNode,
  CFGEdge,
  DataFlowAnalysis,
  VariableFlow,
  DataDependency,
  DefUseChain,
  LiveVariable,
  NavigationEvent
} from './RLMNavigatorBridge';

export type {
  ClaudeCodeConfig,
  ExecutionContext,
  ExecutionPermissions,
  ExecutionResources,
  ExecutionConstraints,
  CodeExecution,
  ExecutionResult,
  ExecutionArtifact,
  ExecutionMetrics,
  Agent,
  AgentCapability,
  CapabilityParameter,
  CapabilityOutput,
  AgentPerformance,
  TaskCoordination,
  CoordinatedTask,
  TaskDependency,
  TaskResult,
  ToolInvocation,
  ClaudeCodeEvent
} from './ClaudeCodeBridge';

// Bridge factory and registry
export interface BridgeFactory {
  createDossierBridge(config: any): DossierBridge;
  createRufloBridge(config: any): RufloBridge;
  createADWSkillsBridge(config: any): ADWSkillsBridge;
  createGitNexusBridge(config: any): GitNexusBridge;
  createRLMNavigatorBridge(config: any): RLMNavigatorBridge;
  createClaudeCodeBridge(config: any): ClaudeCodeBridge;
}

export interface BridgeRegistry {
  register(id: string, bridge: BaseBridge): void;
  unregister(id: string): void;
  get(id: string): BaseBridge | undefined;
  list(): string[];
  getAll(): Map<string, BaseBridge>;
}

// Bridge orchestration and coordination
export interface BridgeOrchestrator {
  initialize(config: any): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  status(): BridgeOrchestratorStatus;
  getBridge(id: string): BaseBridge | undefined;
  executeWorkflow(workflow: BridgeWorkflow): Promise<BridgeWorkflowResult>;
}

export interface BridgeOrchestratorStatus {
  status: 'initializing' | 'running' | 'stopping' | 'stopped' | 'error';
  bridges: {
    id: string;
    name: string;
    status: 'connected' | 'disconnected' | 'error';
    health: 'healthy' | 'degraded' | 'unhealthy';
  }[];
  startedAt?: Date;
  lastHealthCheck: Date;
}

export interface BridgeWorkflow {
  id: string;
  name: string;
  description: string;
  steps: BridgeWorkflowStep[];
  variables?: Record<string, any>;
  timeout?: number;
}

export interface BridgeWorkflowStep {
  id: string;
  name: string;
  bridgeId: string;
  operation: string;
  parameters: Record<string, any>;
  dependencies?: string[];
  timeout?: number;
  retryPolicy?: {
    maxAttempts: number;
    backoffStrategy: 'fixed' | 'exponential';
    baseDelay: number;
  };
  condition?: string;
}

export interface BridgeWorkflowResult {
  workflowId: string;
  success: boolean;
  results: Record<string, any>;
  errors: any[];
  executionTime: number;
  stepResults: BridgeStepResult[];
  completedAt: Date;
}

export interface BridgeStepResult {
  stepId: string;
  success: boolean;
  result?: any;
  error?: any;
  executionTime: number;
  startedAt: Date;
  completedAt: Date;
}

// Utility functions and helpers
export class BridgeUtils {
  /**
   * Create a bridge configuration from environment variables
   */
  static createConfigFromEnv(bridgeType: string): any {
    // Implementation would read from process.env and create appropriate config
    return {};
  }

  /**
   * Validate bridge configuration
   */
  static validateConfig(config: any, schema: any): boolean {
    // Implementation would validate config against JSON schema
    return true;
  }

  /**
   * Merge configurations with defaults
   */
  static mergeConfigs(config: any, defaults: any): any {
    return { ...defaults, ...config };
  }

  /**
   * Create a standardized bridge ID
   */
  static createBridgeId(bridgeType: string, instanceName?: string): string {
    const timestamp = Date.now();
    const suffix = instanceName || Math.random().toString(36).substr(2, 9);
    return `${bridgeType}_${suffix}_${timestamp}`;
  }

  /**
   * Parse event correlation patterns
   */
  static parseEventPattern(pattern: string): any {
    // Implementation would parse event pattern strings
    return {};
  }

  /**
   * Generate event fingerprint for deduplication
   */
  static generateEventFingerprint(event: any): string {
    // Implementation would generate unique fingerprint
    return '';
  }
}

// Default implementations and factories
import type { DossierConfig } from './DossierBridge';
import type { RufloConfig } from './RufloBridge';
import type { ADWConfig } from './ADWSkillsBridge';
import type { GitNexusConfig } from './GitNexusBridge';
import type { RLMNavigatorConfig } from './RLMNavigatorBridge';
import type { ClaudeCodeConfig } from './ClaudeCodeBridge';

export class DefaultBridgeFactory implements BridgeFactory {
  createDossierBridge(config: DossierConfig): DossierBridge {
    return new DossierBridge(config);
  }

  createRufloBridge(config: RufloConfig): RufloBridge {
    return new RufloBridge(config);
  }

  createADWSkillsBridge(config: ADWConfig): ADWSkillsBridge {
    return new ADWSkillsBridge(config);
  }

  createGitNexusBridge(config: GitNexusConfig): GitNexusBridge {
    return new GitNexusBridge(config);
  }

  createRLMNavigatorBridge(config: RLMNavigatorConfig): RLMNavigatorBridge {
    return new RLMNavigatorBridge(config);
  }

  createClaudeCodeBridge(config: ClaudeCodeConfig): ClaudeCodeBridge {
    return new ClaudeCodeBridge(config);
  }
}

export class DefaultBridgeRegistry implements BridgeRegistry {
  private bridges: Map<string, BaseBridge> = new Map();

  register(id: string, bridge: BaseBridge): void {
    this.bridges.set(id, bridge);
  }

  unregister(id: string): void {
    this.bridges.delete(id);
  }

  get(id: string): BaseBridge | undefined {
    return this.bridges.get(id);
  }

  list(): string[] {
    return Array.from(this.bridges.keys());
  }

  getAll(): Map<string, BaseBridge> {
    return new Map(this.bridges);
  }
}

// Default exports for common use cases
export const bridgeFactory = new DefaultBridgeFactory();
export const bridgeRegistry = new DefaultBridgeRegistry();

/**
 * Quick setup function for common bridge configurations
 */
export async function setupBridges(config: {
  dossier?: DossierConfig;
  ruflo?: RufloConfig;
  adwSkills?: ADWConfig;
  gitNexus?: GitNexusConfig;
  rlmNavigator?: RLMNavigatorConfig;
  claudeCode?: ClaudeCodeConfig;
}): Promise<Map<string, BaseBridge>> {
  const bridges = new Map<string, BaseBridge>();

  if (config.dossier) {
    const bridge = bridgeFactory.createDossierBridge(config.dossier);
    await bridge.connect();
    bridges.set('dossier', bridge);
  }

  if (config.ruflo) {
    const bridge = bridgeFactory.createRufloBridge(config.ruflo);
    await bridge.connect();
    bridges.set('ruflo', bridge);
  }

  if (config.adwSkills) {
    const bridge = bridgeFactory.createADWSkillsBridge(config.adwSkills);
    await bridge.connect();
    bridges.set('adwSkills', bridge);
  }

  if (config.gitNexus) {
    const bridge = bridgeFactory.createGitNexusBridge(config.gitNexus);
    await bridge.connect();
    bridges.set('gitNexus', bridge);
  }

  if (config.rlmNavigator) {
    const bridge = bridgeFactory.createRLMNavigatorBridge(config.rlmNavigator);
    await bridge.connect();
    bridges.set('rlmNavigator', bridge);
  }

  if (config.claudeCode) {
    const bridge = bridgeFactory.createClaudeCodeBridge(config.claudeCode);
    await bridge.connect();
    bridges.set('claudeCode', bridge);
  }

  return bridges;
}