/**
 * GitNexus Bridge
 * Interface to code graph analysis and Kùzu database
 */
import { BaseBridge } from './base/BaseBridge.js';
import { BaseBridgeConfig, BridgeEvent, BridgeResult, HealthStatus } from './types/common.js';
export interface GitNexusConfig extends BaseBridgeConfig {
    database: {
        kuzuPath: string;
        connectionPool: number;
        queryTimeout: number;
        maxMemory: string;
    };
    indexing: {
        autoIndexing: boolean;
        indexInterval: number;
        parallelWorkers: number;
        supportedLanguages: string[];
    };
    analysis: {
        maxDepth: number;
        includeTests: boolean;
        includeComments: boolean;
        callGraphEnabled: boolean;
    };
    git: {
        repositories: GitRepository[];
        autoSync: boolean;
        syncInterval: number;
    };
}
export interface GitRepository {
    id: string;
    name: string;
    path: string;
    remote: string;
    branch: string;
    lastIndexed?: Date;
    indexStatus: 'pending' | 'indexing' | 'indexed' | 'error';
    symbolCount: number;
    relationshipCount: number;
    executionFlowCount: number;
}
export interface CodeSymbol {
    id: string;
    name: string;
    type: 'class' | 'function' | 'variable' | 'interface' | 'enum' | 'namespace' | 'module';
    language: string;
    file: string;
    startLine: number;
    endLine: number;
    signature?: string;
    visibility: 'public' | 'private' | 'protected' | 'internal';
    isAbstract: boolean;
    isStatic: boolean;
    repository: string;
    metadata: Record<string, any>;
    lastUpdated: Date;
}
export interface CodeRelationship {
    id: string;
    type: 'inherits' | 'implements' | 'calls' | 'imports' | 'depends_on' | 'overrides' | 'references';
    source: string;
    target: string;
    weight: number;
    context?: string;
    file: string;
    line: number;
    repository: string;
    metadata: Record<string, any>;
    createdAt: Date;
}
export interface ExecutionFlow {
    id: string;
    name: string;
    type: 'function_call_chain' | 'data_flow' | 'control_flow' | 'event_flow';
    steps: ExecutionStep[];
    entryPoint: string;
    exitPoints: string[];
    complexity: number;
    cyclomatic: number;
    repository: string;
    metadata: Record<string, any>;
    createdAt: Date;
}
export interface ExecutionStep {
    order: number;
    symbolId: string;
    action: 'call' | 'return' | 'assignment' | 'condition' | 'loop' | 'exception';
    parameters?: Record<string, any>;
    returnValue?: any;
    conditionalBranches?: string[];
    file: string;
    line: number;
}
export interface GraphQuery {
    query: string;
    parameters?: Record<string, any>;
    timeout?: number;
    explain?: boolean;
}
export interface GraphQueryResult {
    columns: string[];
    rows: any[][];
    executionTime: number;
    planExplanation?: string;
    statistics: {
        nodesScanned: number;
        relationshipsScanned: number;
        resultsCount: number;
    };
}
export interface ImpactAnalysis {
    targetSymbol: string;
    impactType: 'modification' | 'deletion' | 'refactoring';
    directlyAffected: CodeSymbol[];
    indirectlyAffected: CodeSymbol[];
    testFiles: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
    estimatedEffort: {
        files: number;
        lines: number;
        complexity: 'simple' | 'moderate' | 'complex';
    };
}
export interface CodeInsight {
    id: string;
    type: 'hotspot' | 'dependency_cycle' | 'unused_code' | 'complexity_spike' | 'architecture_violation';
    severity: 'info' | 'warning' | 'error' | 'critical';
    title: string;
    description: string;
    affectedFiles: string[];
    affectedSymbols: string[];
    recommendations: string[];
    metrics: Record<string, number>;
    repository: string;
    detectedAt: Date;
}
export interface IndexingEvent extends BridgeEvent {
    data: {
        repositoryId: string;
        action: 'started' | 'progress' | 'completed' | 'failed';
        progress?: number;
        symbolsProcessed?: number;
        error?: string;
    };
}
export declare class GitNexusBridge extends BaseBridge {
    protected config: GitNexusConfig;
    private repositories;
    private indexingProgress;
    private queryCache;
    constructor(config: GitNexusConfig);
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    performHealthCheck(): Promise<HealthStatus>;
    addRepository(repository: Omit<GitRepository, 'lastIndexed' | 'indexStatus' | 'symbolCount' | 'relationshipCount' | 'executionFlowCount'>): Promise<BridgeResult<GitRepository>>;
    indexRepository(repositoryId: string, force?: boolean): Promise<BridgeResult<void>>;
    getRepositoryStatus(repositoryId: string): Promise<BridgeResult<GitRepository>>;
    executeQuery(query: GraphQuery): Promise<BridgeResult<GraphQueryResult>>;
    findSymbol(name: string, type?: CodeSymbol['type'], repository?: string): Promise<BridgeResult<CodeSymbol[]>>;
    getSymbolRelationships(symbolId: string, relationshipType?: CodeRelationship['type']): Promise<BridgeResult<CodeRelationship[]>>;
    analyzeImpact(symbolId: string, impactType: ImpactAnalysis['impactType']): Promise<BridgeResult<ImpactAnalysis>>;
    generateInsights(repositoryId: string): Promise<BridgeResult<CodeInsight[]>>;
    getExecutionFlows(symbolId: string): Promise<BridgeResult<ExecutionFlow[]>>;
    private initializeDatabase;
    private createDatabaseSchema;
    private executeKuzuQuery;
    private testDatabaseConnection;
    private closeDatabaseConnections;
    private loadRepositories;
    private validateRepository;
    private loadRepositoriesFromDatabase;
    private parseRepositoryFromRow;
    private initializeFileSystemMonitoring;
    private setupRepositoryWatcher;
    private shouldReindexFile;
    private scheduleRepositoryReindex;
    private setupHealthMonitoring;
    private startAutoIndexing;
    private stopAutoIndexing;
    private performRepositoryIndexing;
    private publishIndexingProgress;
    private scanRepositoryFiles;
    private getLanguageFromExtension;
    private parseSourceFiles;
    private parseFile;
    private extractSymbolsFromContent;
    private determineSymbolType;
    private extractVisibility;
    private analyzeRelationships;
    private findSymbolRelationships;
    private findReferencesInContent;
    private determineRelationshipType;
    private calculateRelationshipWeight;
    private storeIndexData;
    private storeSymbols;
    private storeRelationships;
    private performGraphQuery;
    private getSymbolById;
    private mapRowToSymbol;
    private mapRowToRelationship;
    private calculateRiskLevel;
    private generateRecommendations;
    private detectHotspots;
    private detectDependencyCycles;
    private detectComplexitySpikes;
    private checkDatabaseHealth;
    private checkIndexingHealth;
    private checkRepositoryHealth;
    private calculateErrorRate;
    private calculateThroughput;
    private createGitNexusError;
}
//# sourceMappingURL=GitNexusBridge.d.ts.map