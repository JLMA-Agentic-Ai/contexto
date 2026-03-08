/**
 * RLM Navigator Bridge
 * Interface to AST navigation via MCP protocol
 */
import { BaseBridge } from './base/BaseBridge.js';
import { BaseBridgeConfig, BridgeEvent, BridgeResult, HealthStatus } from './types/common.js';
export interface RLMNavigatorConfig extends BaseBridgeConfig {
    navigator: {
        mcpEndpoint: string;
        protocol: 'stdio' | 'websocket' | 'http';
        maxConcurrentNavigations: number;
        cacheEnabled: boolean;
        cacheTTL: number;
    };
    ast: {
        supportedLanguages: string[];
        parseTimeout: number;
        maxFileSize: number;
        includeComments: boolean;
        includeWhitespace: boolean;
    };
    analysis: {
        semanticAnalysis: boolean;
        typeInference: boolean;
        controlFlowAnalysis: boolean;
        dataFlowAnalysis: boolean;
    };
    indexing: {
        incrementalUpdates: boolean;
        watchFileChanges: boolean;
        debounceDelay: number;
    };
}
export interface ASTNode {
    id: string;
    type: string;
    name?: string;
    value?: any;
    children: ASTNode[];
    parent?: string;
    position: {
        start: {
            line: number;
            column: number;
            offset: number;
        };
        end: {
            line: number;
            column: number;
            offset: number;
        };
    };
    file: string;
    language: string;
    metadata: Record<string, any>;
    semanticInfo?: {
        scope: string;
        type: string;
        references: NodeReference[];
        declarations: NodeReference[];
    };
}
export interface NodeReference {
    nodeId: string;
    file: string;
    position: ASTNode['position'];
    type: 'declaration' | 'usage' | 'modification' | 'call';
    context: string;
}
export interface NavigationSession {
    id: string;
    file: string;
    language: string;
    ast: ASTNode;
    currentPosition?: {
        line: number;
        column: number;
    };
    navigationHistory: NavigationStep[];
    bookmarks: NavigationBookmark[];
    filters: NavigationFilter[];
    status: 'active' | 'paused' | 'completed' | 'error';
    createdAt: Date;
    lastActive: Date;
}
export interface NavigationStep {
    id: string;
    action: 'goto' | 'search' | 'filter' | 'bookmark' | 'analyze';
    target: {
        nodeId?: string;
        query?: string;
        position?: {
            line: number;
            column: number;
        };
    };
    result?: any;
    timestamp: Date;
    duration: number;
}
export interface NavigationBookmark {
    id: string;
    name: string;
    description?: string;
    nodeId: string;
    position: {
        line: number;
        column: number;
    };
    context: string;
    tags: string[];
    createdAt: Date;
}
export interface NavigationFilter {
    id: string;
    name: string;
    type: 'node_type' | 'name_pattern' | 'semantic_type' | 'custom';
    criteria: Record<string, any>;
    active: boolean;
}
export interface SemanticQuery {
    type: 'find_usages' | 'find_declarations' | 'find_implementations' | 'find_references' | 'call_hierarchy';
    target: string;
    scope?: 'file' | 'project' | 'workspace';
    includeTests?: boolean;
    maxResults?: number;
}
export interface SemanticResult {
    query: SemanticQuery;
    results: NodeReference[];
    metadata: {
        totalMatches: number;
        searchTime: number;
        scope: string;
    };
}
export interface ControlFlowGraph {
    id: string;
    function: string;
    nodes: CFGNode[];
    edges: CFGEdge[];
    entryPoint: string;
    exitPoints: string[];
    complexity: {
        cyclomatic: number;
        cognitive: number;
        halstead: {
            vocabulary: number;
            length: number;
            difficulty: number;
            effort: number;
        };
    };
}
export interface CFGNode {
    id: string;
    type: 'entry' | 'exit' | 'statement' | 'condition' | 'loop' | 'exception';
    astNodeId: string;
    code: string;
    position: {
        line: number;
        column: number;
    };
}
export interface CFGEdge {
    id: string;
    from: string;
    to: string;
    type: 'sequence' | 'true_branch' | 'false_branch' | 'exception' | 'return';
    condition?: string;
}
export interface DataFlowAnalysis {
    variables: VariableFlow[];
    dependencies: DataDependency[];
    definitionUseChains: DefUseChain[];
    liveVariables: LiveVariable[];
}
export interface VariableFlow {
    variable: string;
    type: string;
    definitions: NodeReference[];
    uses: NodeReference[];
    scope: string;
}
export interface DataDependency {
    from: string;
    to: string;
    type: 'flow' | 'anti' | 'output';
    through: string[];
}
export interface DefUseChain {
    definition: NodeReference;
    uses: NodeReference[];
    reachable: boolean;
}
export interface LiveVariable {
    variable: string;
    liveAt: string[];
    deadAt: string[];
}
export interface NavigationEvent extends BridgeEvent {
    data: {
        sessionId: string;
        action: 'session_created' | 'session_closed' | 'navigation_step' | 'bookmark_added' | 'analysis_completed';
        details: any;
    };
}
export declare class RLMNavigatorBridge extends BaseBridge {
    protected config: RLMNavigatorConfig;
    private activeSessions;
    private astCache;
    private analysisCache;
    constructor(config: RLMNavigatorConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    performHealthCheck(): Promise<HealthStatus>;
    createNavigationSession(file: string): Promise<BridgeResult<NavigationSession>>;
    closeNavigationSession(sessionId: string): Promise<BridgeResult<void>>;
    navigateToNode(sessionId: string, nodeId: string): Promise<BridgeResult<ASTNode>>;
    searchNodes(sessionId: string, query: string, filters?: NavigationFilter[]): Promise<BridgeResult<ASTNode[]>>;
    addBookmark(sessionId: string, bookmark: Omit<NavigationBookmark, 'id' | 'createdAt'>): Promise<BridgeResult<NavigationBookmark>>;
    performSemanticQuery(sessionId: string, query: SemanticQuery): Promise<BridgeResult<SemanticResult>>;
    analyzeControlFlow(sessionId: string, functionNodeId: string): Promise<BridgeResult<ControlFlowGraph>>;
    analyzeDataFlow(sessionId: string, scopeNodeId: string): Promise<BridgeResult<DataFlowAnalysis>>;
    refreshAST(sessionId: string): Promise<BridgeResult<ASTNode>>;
    getSupportedLanguages(): Promise<BridgeResult<string[]>>;
    private initializeMCPConnection;
    private establishMCPTransport;
    private initializeParsingCapabilities;
    private initializeLanguageParser;
    private sendMCPCommand;
    private generateMockAST;
    private generateMockSearchResults;
    private generateMockSemanticAnalysis;
    private generateMockControlFlow;
    private generateMockDataFlow;
    private closeMCPConnection;
    private setupFileWatching;
    private handleFileChanged;
    private parseFileToAST;
    private enhanceASTWithSemantics;
    private applySemanticInformation;
    private enhanceASTWithTypes;
    private applyTypeInformation;
    private detectLanguage;
    private findNodeInAST;
    private searchInAST;
    private matchesQuery;
    private passesFilters;
    private executeSemanticQuery;
    private buildControlFlowGraph;
    private performDataFlowAnalysis;
    private isCacheValid;
    private checkMCPHealth;
    private checkParsingHealth;
    private checkAnalysisHealth;
    private calculateErrorRate;
    private calculateThroughput;
    private createRLMError;
}
//# sourceMappingURL=RLMNavigatorBridge.d.ts.map