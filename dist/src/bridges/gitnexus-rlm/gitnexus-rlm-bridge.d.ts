/**
 * GitNexus-RLM Navigator Integration Bridge
 * Connects code graph analysis with AST navigation
 */
import { ComponentBridge, ComponentMessage, HealthMetrics, ComponentCapability } from '../base/component-bridge';
export interface GitNexusGraph {
    nodes: GraphNode[];
    edges: GraphEdge[];
    metadata: GraphMetadata;
}
export interface GraphNode {
    id: string;
    type: 'class' | 'function' | 'variable' | 'import' | 'export' | 'interface' | 'type';
    name: string;
    filePath: string;
    startLine: number;
    endLine: number;
    properties: NodeProperties;
}
export interface GraphEdge {
    id: string;
    sourceId: string;
    targetId: string;
    type: 'calls' | 'imports' | 'extends' | 'implements' | 'uses' | 'defines';
    weight: number;
    metadata: EdgeMetadata;
}
export interface NodeProperties {
    visibility?: 'public' | 'private' | 'protected';
    isStatic?: boolean;
    isAsync?: boolean;
    complexity?: number;
    dependencies: string[];
    usages: string[];
}
export interface EdgeMetadata {
    filePath: string;
    lineNumber: number;
    confidence: number;
    context: string;
}
export interface GraphMetadata {
    totalNodes: number;
    totalEdges: number;
    lastUpdated: Date;
    version: string;
    statistics: GraphStatistics;
}
export interface GraphStatistics {
    complexity: {
        average: number;
        maximum: number;
        distribution: Record<string, number>;
    };
    dependencies: {
        mostUsed: string[];
        circular: CircularDependency[];
        depth: number;
    };
    coverage: {
        analyzed: number;
        total: number;
        percentage: number;
    };
}
export interface CircularDependency {
    path: string[];
    severity: 'low' | 'medium' | 'high' | 'critical';
}
export interface RLMNavigationContext {
    currentFile: string;
    currentFunction?: string;
    currentClass?: string;
    selectionRange?: {
        start: {
            line: number;
            character: number;
        };
        end: {
            line: number;
            character: number;
        };
    };
    breadcrumbs: NavigationBreadcrumb[];
}
export interface NavigationBreadcrumb {
    type: 'file' | 'class' | 'function' | 'variable';
    name: string;
    filePath: string;
    range: {
        start: {
            line: number;
            character: number;
        };
        end: {
            line: number;
            character: number;
        };
    };
}
export interface NavigationRequest {
    type: 'find_usages' | 'find_definitions' | 'find_implementations' | 'find_references' | 'trace_dependencies';
    target: string;
    context: RLMNavigationContext;
    options: NavigationOptions;
}
export interface NavigationOptions {
    includeTests?: boolean;
    maxDepth?: number;
    excludePaths?: string[];
    includeExternal?: boolean;
    sortBy?: 'relevance' | 'alphabetical' | 'usage_count';
}
export interface NavigationResult {
    requestId: string;
    results: NavigationItem[];
    metadata: NavigationMetadata;
}
export interface NavigationItem {
    id: string;
    type: string;
    name: string;
    filePath: string;
    range: {
        start: {
            line: number;
            character: number;
        };
        end: {
            line: number;
            character: number;
        };
    };
    preview: string;
    relevance: number;
    context: string;
}
export interface NavigationMetadata {
    totalResults: number;
    executionTime: number;
    graphNodesTraversed: number;
    cacheHits: number;
    accuracy: number;
}
export declare class GitNexusRLMBridge extends ComponentBridge {
    private eventEmitter;
    private graphCache;
    private navigationHistory;
    private maxHistorySize;
    constructor(config: any);
    initialize(): Promise<void>;
    private initializeGitNexus;
    private initializeRLMNavigator;
    private setupEventHandlers;
    private loadCachedGraphs;
    shutdown(): Promise<void>;
    checkHealth(): Promise<HealthMetrics>;
    private checkGitNexusHealth;
    private checkRLMHealth;
    private calculateErrorRate;
    private calculateMemoryUsage;
    sendMessage(message: ComponentMessage): Promise<any>;
    getCapabilities(): ComponentCapability[];
    subscribe(eventType: string, callback: (event: any) => void): void;
    unsubscribe(eventType: string, callback?: (event: any) => void): void;
    private analyzeCodeGraph;
    private enhanceWithRLMAnalysis;
    private findUsages;
    private traceDependencies;
    private analyzeChangeImpact;
    private callGitNexus;
    private callRLMNavigator;
    private combineNavigationResults;
    private calculateResultAccuracy;
    private calculateGraphStatistics;
    private enhanceTraversalWithAST;
    private getAffectedNodes;
    private analyzeImpactPropagation;
    private addToNavigationHistory;
    private saveGraphState;
    private handleGraphUpdate;
    private handleNavigationRequest;
    private handleImpactAnalysis;
}
//# sourceMappingURL=gitnexus-rlm-bridge.d.ts.map