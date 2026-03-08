/**
 * Event Type Definitions
 * Centralized event type definitions for all bridges
 */
import { BridgeEvent } from '../types/common.js';
export type EventType = DossierEventType | RufloEventType | ADWEventType | GitNexusEventType | RLMNavigatorEventType | ClaudeCodeEventType | SystemEventType;
export type DossierEventType = 'dossier.connected' | 'dossier.disconnected' | 'dossier.task.created' | 'dossier.task.updated' | 'dossier.task.completed' | 'dossier.task.failed' | 'dossier.workflow.created' | 'dossier.workflow.started' | 'dossier.workflow.completed' | 'dossier.workflow.failed' | 'dossier.ui.state.updated' | 'dossier.ui.component.rendered' | 'dossier.orchestration.task.assigned' | 'dossier.orchestration.task.completed';
export type RufloEventType = 'ruflo.connected' | 'ruflo.disconnected' | 'ruflo.swarm.initialized' | 'ruflo.swarm.terminated' | 'ruflo.swarm.scaled' | 'ruflo.agent.spawned' | 'ruflo.agent.terminated' | 'ruflo.agent.heartbeat' | 'ruflo.task.created' | 'ruflo.task.assigned' | 'ruflo.task.started' | 'ruflo.task.completed' | 'ruflo.task.failed' | 'ruflo.task.cancelled' | 'ruflo.memory.stored' | 'ruflo.memory.retrieved' | 'ruflo.memory.searched' | 'ruflo.coordination.started' | 'ruflo.coordination.completed';
export type ADWEventType = 'adw.connected' | 'adw.disconnected' | 'adw.investigation.created' | 'adw.investigation.updated' | 'adw.investigation.concluded' | 'adw.hypothesis.created' | 'adw.hypothesis.tested' | 'adw.hypothesis.supported' | 'adw.hypothesis.refuted' | 'adw.evidence.collected' | 'adw.evidence.analyzed' | 'adw.test.started' | 'adw.test.completed' | 'adw.test.failed' | 'adw.skill.executed' | 'adw.skill.registered' | 'adw.workflow.started' | 'adw.workflow.completed' | 'adw.timeline.updated';
export type GitNexusEventType = 'gitnexus.connected' | 'gitnexus.disconnected' | 'gitnexus.repository.added' | 'gitnexus.repository.removed' | 'gitnexus.repository.synced' | 'gitnexus.indexing.started' | 'gitnexus.indexing.progress' | 'gitnexus.indexing.completed' | 'gitnexus.indexing.failed' | 'gitnexus.query.executed' | 'gitnexus.analysis.impact.completed' | 'gitnexus.analysis.insights.generated' | 'gitnexus.symbol.found' | 'gitnexus.relationship.discovered' | 'gitnexus.execution.flow.traced';
export type RLMNavigatorEventType = 'rlm.connected' | 'rlm.disconnected' | 'rlm.session.created' | 'rlm.session.closed' | 'rlm.navigation.step' | 'rlm.navigation.bookmark.added' | 'rlm.navigation.bookmark.removed' | 'rlm.ast.parsed' | 'rlm.ast.updated' | 'rlm.analysis.semantic.completed' | 'rlm.analysis.control.flow.completed' | 'rlm.analysis.data.flow.completed' | 'rlm.search.completed' | 'rlm.file.watched' | 'rlm.file.changed';
export type ClaudeCodeEventType = 'claudecode.connected' | 'claudecode.disconnected' | 'claudecode.execution.started' | 'claudecode.execution.progress' | 'claudecode.execution.completed' | 'claudecode.execution.failed' | 'claudecode.execution.cancelled' | 'claudecode.agent.spawned' | 'claudecode.agent.terminated' | 'claudecode.agent.task.assigned' | 'claudecode.agent.task.completed' | 'claudecode.coordination.started' | 'claudecode.coordination.completed' | 'claudecode.tool.invoked' | 'claudecode.tool.completed' | 'claudecode.tool.failed' | 'claudecode.resource.allocated' | 'claudecode.resource.released';
export type SystemEventType = 'system.startup' | 'system.shutdown' | 'system.health.check' | 'system.error' | 'system.warning' | 'system.config.updated' | 'system.bridge.registered' | 'system.bridge.unregistered' | 'system.metrics.collected' | 'system.performance.threshold.exceeded';
export interface DossierEvent extends BridgeEvent {
    type: DossierEventType;
    data: {
        taskId?: string;
        workflowId?: string;
        componentId?: string;
        action: string;
        payload: any;
    };
}
export interface RufloEvent extends BridgeEvent {
    type: RufloEventType;
    data: {
        swarmId?: string;
        agentId?: string;
        taskId?: string;
        memoryKey?: string;
        action: string;
        payload: any;
    };
}
export interface ADWEvent extends BridgeEvent {
    type: ADWEventType;
    data: {
        investigationId?: string;
        hypothesisId?: string;
        evidenceId?: string;
        testId?: string;
        skillId?: string;
        action: string;
        payload: any;
    };
}
export interface GitNexusEvent extends BridgeEvent {
    type: GitNexusEventType;
    data: {
        repositoryId?: string;
        symbolId?: string;
        queryId?: string;
        analysisId?: string;
        action: string;
        payload: any;
    };
}
export interface RLMNavigatorEvent extends BridgeEvent {
    type: RLMNavigatorEventType;
    data: {
        sessionId?: string;
        nodeId?: string;
        file?: string;
        action: string;
        payload: any;
    };
}
export interface ClaudeCodeEvent extends BridgeEvent {
    type: ClaudeCodeEventType;
    data: {
        executionId?: string;
        agentId?: string;
        taskId?: string;
        toolName?: string;
        action: string;
        payload: any;
    };
}
export interface SystemEvent extends BridgeEvent {
    type: SystemEventType;
    data: {
        component?: string;
        bridgeId?: string;
        severity: 'info' | 'warning' | 'error' | 'critical';
        action: string;
        payload: any;
    };
}
export interface EventFilter {
    types?: EventType[];
    sources?: string[];
    patterns?: string[];
    metadata?: Record<string, any>;
    timeRange?: {
        start: Date;
        end: Date;
    };
}
export interface EventSubscription {
    id: string;
    filter: EventFilter;
    callback: (event: BridgeEvent) => void | Promise<void>;
    options: {
        once?: boolean;
        priority?: number;
        timeout?: number;
    };
    created: Date;
    lastTriggered?: Date;
    triggerCount: number;
}
export interface EventCorrelation {
    id: string;
    name: string;
    description: string;
    pattern: EventPattern;
    window: number;
    condition: (events: BridgeEvent[]) => boolean;
    action: (correlatedEvents: BridgeEvent[]) => void | Promise<void>;
    created: Date;
    lastTriggered?: Date;
    triggerCount: number;
}
export interface EventPattern {
    sequence?: EventType[];
    concurrent?: EventType[];
    within?: number;
    minCount?: number;
    maxCount?: number;
    sourcePattern?: string;
}
export interface EventMetrics {
    totalEvents: number;
    eventsByType: Record<EventType, number>;
    eventsBySource: Record<string, number>;
    eventsPerMinute: number;
    averageLatency: number;
    errorRate: number;
    lastUpdated: Date;
}
export interface EventRouter {
    route(event: BridgeEvent): Promise<void>;
    addRoute(filter: EventFilter, handler: EventHandler): void;
    removeRoute(routeId: string): void;
    getRoutes(): EventRoute[];
}
export interface EventRoute {
    id: string;
    filter: EventFilter;
    handler: EventHandler;
    priority: number;
    created: Date;
}
export interface EventHandler {
    id: string;
    name: string;
    handle(event: BridgeEvent): Promise<void>;
    canHandle(event: BridgeEvent): boolean;
}
export interface EventStore {
    store(event: BridgeEvent): Promise<void>;
    retrieve(filter: EventFilter): Promise<BridgeEvent[]>;
    replay(filter: EventFilter, handler: EventHandler): Promise<void>;
    purge(olderThan: Date): Promise<number>;
    getMetrics(): Promise<EventMetrics>;
}
export interface EventStream {
    subscribe(filter: EventFilter): AsyncIterable<BridgeEvent>;
    publish(event: BridgeEvent): Promise<void>;
    close(): Promise<void>;
}
export interface EventValidator {
    validate(event: BridgeEvent): Promise<ValidationResult>;
    getSchema(eventType: EventType): Promise<any>;
    registerSchema(eventType: EventType, schema: any): Promise<void>;
}
export interface ValidationResult {
    valid: boolean;
    errors: ValidationError[];
}
export interface ValidationError {
    field: string;
    message: string;
    value: any;
}
//# sourceMappingURL=EventTypes.d.ts.map