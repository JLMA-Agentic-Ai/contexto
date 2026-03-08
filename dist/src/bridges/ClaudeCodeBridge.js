"use strict";
/**
 * Claude Code Bridge
 * Interface to execution engine and agent coordination
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeCodeBridge = void 0;
const BaseBridge_js_1 = require("./base/BaseBridge.js");
class ClaudeCodeBridge extends BaseBridge_js_1.BaseBridge {
    config;
    activeExecutions = new Map();
    activeAgents = new Map();
    coordinations = new Map();
    toolInvocations = new Map();
    constructor(config) {
        super(config);
        this.config = config;
    }
    // Connection management
    async connect() {
        try {
            // TODO: Initialize connection to Claude Code execution engine
            await this.initializeExecutionEngine();
            // TODO: Connect to agent coordinator
            await this.initializeAgentCoordinator();
            // TODO: Load available tools
            await this.loadToolRegistry();
            this.emit('connected');
            console.log('Claude Code Bridge connected');
        }
        catch (error) {
            throw this.createClaudeCodeError('CONNECTION_FAILED', 'Failed to connect to Claude Code', error);
        }
    }
    async disconnect() {
        // TODO: Gracefully stop all active executions
        for (const [executionId] of this.activeExecutions) {
            await this.cancelExecution(executionId);
        }
        // TODO: Terminate all agents
        for (const [agentId] of this.activeAgents) {
            await this.terminateAgent(agentId);
        }
        // TODO: Close connections
        this.emit('disconnected');
    }
    isConnected() {
        // TODO: Check connection status to execution engine and agent coordinator
        return true;
    }
    async performHealthCheck() {
        const startTime = Date.now();
        try {
            const executionEngineHealth = await this.checkExecutionEngineHealth();
            const agentCoordinatorHealth = await this.checkAgentCoordinatorHealth();
            const toolRegistryHealth = await this.checkToolRegistryHealth();
            const responseTime = Date.now() - startTime;
            const overallStatus = executionEngineHealth && agentCoordinatorHealth && toolRegistryHealth ? 'healthy' : 'degraded';
            return {
                status: overallStatus,
                lastCheck: new Date(),
                details: {
                    executionEngine: executionEngineHealth,
                    agentCoordinator: agentCoordinatorHealth,
                    toolRegistry: toolRegistryHealth,
                    activeExecutions: this.activeExecutions.size,
                    activeAgents: this.activeAgents.size
                },
                metrics: {
                    responseTime,
                    errorRate: this.calculateErrorRate(),
                    throughput: this.calculateThroughput()
                }
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                lastCheck: new Date(),
                details: { error: error instanceof Error ? error.message : 'Unknown error' }
            };
        }
    }
    // Code execution operations
    async executeCode(execution) {
        return this.executeWithRetry(async () => {
            const newExecution = {
                ...execution,
                id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                status: 'pending',
                metrics: {
                    memoryUsed: 0,
                    cpuTime: 0,
                    wallTime: 0,
                    diskIO: { bytesRead: 0, bytesWritten: 0 },
                    networkIO: { bytesReceived: 0, bytesSent: 0 },
                    resourceUtilization: { peakMemoryMB: 0, averageCPUPercent: 0 }
                },
                createdAt: new Date()
            };
            this.activeExecutions.set(newExecution.id, newExecution);
            // TODO: Submit execution to Claude Code engine
            await this.submitExecution(newExecution);
            await this.publishEvent({
                id: `execution_started_${newExecution.id}`,
                type: 'execution.started',
                source: 'claude-code-bridge',
                timestamp: new Date(),
                data: {
                    executionId: newExecution.id,
                    action: 'execution_started',
                    details: { type: execution.type, language: execution.language }
                }
            });
            return newExecution;
        });
    }
    async getExecutionStatus(executionId) {
        return this.executeWithRetry(async () => {
            const execution = this.activeExecutions.get(executionId);
            if (!execution) {
                throw this.createClaudeCodeError('EXECUTION_NOT_FOUND', `Execution ${executionId} not found`);
            }
            return execution;
        });
    }
    async cancelExecution(executionId) {
        return this.executeWithRetry(async () => {
            const execution = this.activeExecutions.get(executionId);
            if (!execution) {
                throw this.createClaudeCodeError('EXECUTION_NOT_FOUND', `Execution ${executionId} not found`);
            }
            if (execution.status === 'running') {
                // TODO: Cancel running execution
                execution.status = 'cancelled';
                execution.completedAt = new Date();
            }
            this.activeExecutions.delete(executionId);
        });
    }
    // Agent coordination operations
    async spawnAgent(type, name, configuration) {
        return this.executeWithRetry(async () => {
            const newAgent = {
                id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                type,
                name,
                description: `${type} agent: ${name}`,
                status: 'idle',
                capabilities: [], // TODO: Load capabilities based on type
                performance: {
                    tasksCompleted: 0,
                    tasksTotal: 0,
                    successRate: 0,
                    averageExecutionTime: 0,
                    averageResponseTime: 0,
                    errorRate: 0,
                    lastEvaluated: new Date()
                },
                configuration: configuration || {},
                lastHeartbeat: new Date(),
                createdAt: new Date()
            };
            this.activeAgents.set(newAgent.id, newAgent);
            // TODO: Spawn agent via agent coordinator
            await this.requestAgentSpawn(newAgent);
            await this.publishEvent({
                id: `agent_spawned_${newAgent.id}`,
                type: 'agent.spawned',
                source: 'claude-code-bridge',
                timestamp: new Date(),
                data: {
                    agentId: newAgent.id,
                    action: 'agent_spawned',
                    details: { type, name }
                }
            });
            return newAgent;
        });
    }
    async terminateAgent(agentId) {
        return this.executeWithRetry(async () => {
            const agent = this.activeAgents.get(agentId);
            if (!agent) {
                throw this.createClaudeCodeError('AGENT_NOT_FOUND', `Agent ${agentId} not found`);
            }
            // TODO: Terminate agent via coordinator
            agent.status = 'terminated';
            this.activeAgents.delete(agentId);
            await this.publishEvent({
                id: `agent_terminated_${agentId}`,
                type: 'agent.terminated',
                source: 'claude-code-bridge',
                timestamp: new Date(),
                data: {
                    agentId,
                    action: 'agent_terminated',
                    details: {}
                }
            });
        });
    }
    async assignTask(agentId, task) {
        return this.executeWithRetry(async () => {
            const agent = this.activeAgents.get(agentId);
            if (!agent) {
                throw this.createClaudeCodeError('AGENT_NOT_FOUND', `Agent ${agentId} not found`);
            }
            if (agent.status !== 'idle') {
                throw this.createClaudeCodeError('AGENT_BUSY', `Agent ${agentId} is not available`);
            }
            const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            // TODO: Assign task to agent
            agent.status = 'busy';
            agent.currentTask = taskId;
            agent.performance.tasksTotal++;
            await this.publishEvent({
                id: `task_assigned_${taskId}`,
                type: 'task.assigned',
                source: 'claude-code-bridge',
                timestamp: new Date(),
                data: {
                    agentId,
                    taskId,
                    action: 'task_assigned',
                    details: task
                }
            });
            return taskId;
        });
    }
    // Coordination operations
    async coordinateTasks(coordination) {
        return this.executeWithRetry(async () => {
            const newCoordination = {
                ...coordination,
                id: `coord_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                status: 'pending',
                results: []
            };
            this.coordinations.set(newCoordination.id, newCoordination);
            // TODO: Start task coordination
            await this.startTaskCoordination(newCoordination);
            return newCoordination;
        });
    }
    async getCoordinationStatus(coordinationId) {
        return this.executeWithRetry(async () => {
            const coordination = this.coordinations.get(coordinationId);
            if (!coordination) {
                throw this.createClaudeCodeError('COORDINATION_NOT_FOUND', `Coordination ${coordinationId} not found`);
            }
            return coordination;
        });
    }
    // Tool operations
    async invokeTool(toolName, parameters, context) {
        return this.executeWithRetry(async () => {
            const invocation = {
                id: `tool_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                toolName,
                parameters,
                context: context || this.createDefaultContext('tool_invocation'),
                status: 'pending',
                metrics: {
                    executionTime: 0,
                    memoryUsed: 0,
                    rateLimitHits: 0
                },
                createdAt: new Date()
            };
            this.toolInvocations.set(invocation.id, invocation);
            // TODO: Execute tool via Claude Code
            const result = await this.executeToolInvocation(invocation);
            invocation.status = 'completed';
            invocation.result = result;
            invocation.completedAt = new Date();
            return result;
        });
    }
    async listAvailableTools() {
        return this.executeWithRetry(async () => {
            return this.config.tools.availableTools;
        });
    }
    // Private helper methods
    async initializeExecutionEngine() {
        try {
            // Initialize connection to Claude Code execution engine
            await this.establishExecutionConnection();
            // Test execution capabilities
            await this.testExecutionCapabilities();
            // Set up execution monitoring
            this.setupExecutionMonitoring();
            console.log('Claude Code execution engine initialized');
        }
        catch (error) {
            throw new Error(`Failed to initialize execution engine: ${error}`);
        }
    }
    async establishExecutionConnection() {
        const connectionConfig = {
            apiEndpoint: this.config.execution.apiEndpoint,
            apiKey: this.config.execution.apiKey,
            sandboxMode: this.config.execution.sandboxMode,
            timeout: this.config.execution.executionTimeout
        };
        console.log('Establishing Claude Code execution connection...');
        // Test API connectivity
        try {
            const response = await fetch(`${this.config.execution.apiEndpoint}/health`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.config.execution.apiKey}`,
                    'Content-Type': 'application/json'
                },
                signal: AbortSignal.timeout(5000)
            });
            if (!response.ok) {
                throw new Error(`Execution engine health check failed: ${response.status}`);
            }
            console.log('Claude Code execution engine connection established');
        }
        catch (error) {
            throw new Error(`Failed to connect to execution engine: ${error}`);
        }
    }
    async testExecutionCapabilities() {
        // Test basic execution capability
        const testExecution = {
            type: 'snippet',
            language: 'javascript',
            code: 'console.log("Claude Code Bridge Test");',
            context: this.createDefaultContext('code_execution')
        };
        try {
            const result = await this.executeCodeDirect(testExecution);
            if (!result.success) {
                throw new Error('Test execution failed');
            }
            console.log('Execution capabilities verified');
        }
        catch (error) {
            console.warn('Execution capability test failed:', error);
        }
    }
    async executeCodeDirect(execution) {
        try {
            const response = await fetch(`${this.config.execution.apiEndpoint}/execute`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.execution.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    language: execution.language,
                    code: execution.code,
                    arguments: execution.arguments,
                    workingDirectory: execution.workingDirectory,
                    environment: execution.environment,
                    sandbox: this.config.execution.sandboxMode,
                    timeout: execution.context.constraints.timeout
                }),
                signal: AbortSignal.timeout(execution.context.constraints.timeout)
            });
            if (!response.ok) {
                return {
                    success: false,
                    error: `HTTP ${response.status}: ${response.statusText}`
                };
            }
            const data = await response.json();
            return {
                success: true,
                result: {
                    success: data.success,
                    exitCode: data.exitCode,
                    stdout: data.stdout || '',
                    stderr: data.stderr || '',
                    output: data.output || {},
                    error: data.error,
                    warnings: data.warnings || []
                }
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    setupExecutionMonitoring() {
        // Set up periodic monitoring of active executions
        setInterval(() => {
            this.monitorActiveExecutions();
        }, 10000); // Every 10 seconds
        // Set up resource usage monitoring
        setInterval(() => {
            this.monitorResourceUsage();
        }, 5000); // Every 5 seconds
    }
    async monitorActiveExecutions() {
        for (const [executionId, execution] of this.activeExecutions) {
            if (execution.status === 'running') {
                // Check if execution has exceeded timeout
                const elapsed = Date.now() - (execution.startedAt?.getTime() || execution.createdAt.getTime());
                const timeout = execution.context.constraints.timeout;
                if (elapsed > timeout) {
                    await this.timeoutExecution(executionId);
                }
            }
        }
    }
    async timeoutExecution(executionId) {
        const execution = this.activeExecutions.get(executionId);
        if (!execution)
            return;
        execution.status = 'timeout';
        execution.completedAt = new Date();
        execution.result = {
            success: false,
            stdout: '',
            stderr: 'Execution timed out',
            output: {},
            error: 'Execution exceeded timeout limit',
            warnings: ['Execution was terminated due to timeout']
        };
        await this.publishEvent({
            id: `execution_timeout_${executionId}`,
            type: 'execution.timeout',
            source: 'claude-code-bridge',
            timestamp: new Date(),
            data: {
                executionId,
                action: 'execution_timeout',
                details: { timeout: execution.context.constraints.timeout }
            }
        });
    }
    async monitorResourceUsage() {
        try {
            const resourceStats = await this.getResourceUsageStats();
            // Check for resource constraints
            if (resourceStats.memoryUsagePercent > 90) {
                this.emit('resource-warning', {
                    type: 'memory',
                    usage: resourceStats.memoryUsagePercent,
                    threshold: 90
                });
            }
            if (resourceStats.cpuUsagePercent > 95) {
                this.emit('resource-warning', {
                    type: 'cpu',
                    usage: resourceStats.cpuUsagePercent,
                    threshold: 95
                });
            }
        }
        catch (error) {
            console.error('Resource monitoring failed:', error);
        }
    }
    async getResourceUsageStats() {
        // Simulate resource usage monitoring
        return {
            memoryUsagePercent: Math.random() * 100,
            cpuUsagePercent: Math.random() * 100,
            activeExecutions: this.activeExecutions.size
        };
    }
    async initializeAgentCoordinator() {
        try {
            // Initialize connection to agent coordinator
            await this.establishCoordinatorConnection();
            // Register this bridge as an agent coordinator
            await this.registerAsCoordinator();
            // Load agent capabilities
            await this.loadAgentCapabilities();
            console.log('Agent coordinator initialized');
        }
        catch (error) {
            throw new Error(`Failed to initialize agent coordinator: ${error}`);
        }
    }
    async establishCoordinatorConnection() {
        try {
            const response = await fetch(`${this.config.agents.coordinatorEndpoint}/health`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.config.execution.apiKey}`,
                    'Content-Type': 'application/json'
                },
                signal: AbortSignal.timeout(5000)
            });
            if (!response.ok) {
                throw new Error(`Coordinator health check failed: ${response.status}`);
            }
            console.log('Agent coordinator connection established');
        }
        catch (error) {
            throw new Error(`Failed to connect to agent coordinator: ${error}`);
        }
    }
    async registerAsCoordinator() {
        const registrationPayload = {
            bridgeId: 'claude-code-bridge',
            capabilities: ['code-execution', 'agent-spawning', 'task-coordination'],
            maxConcurrentExecutions: this.config.execution.maxConcurrentExecutions,
            maxActiveAgents: this.config.agents.maxActiveAgents,
            availableTools: this.config.tools.availableTools
        };
        try {
            const response = await fetch(`${this.config.agents.coordinatorEndpoint}/register`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.execution.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(registrationPayload)
            });
            if (!response.ok) {
                throw new Error(`Failed to register coordinator: ${response.status}`);
            }
            console.log('Registered as agent coordinator');
        }
        catch (error) {
            console.error('Failed to register as coordinator:', error);
        }
    }
    async loadAgentCapabilities() {
        // Load standard agent capabilities
        const standardCapabilities = {
            'coder': [
                {
                    name: 'code-generation',
                    version: '1.0.0',
                    description: 'Generate code from specifications',
                    parameters: [
                        { name: 'language', type: 'string', required: true, description: 'Programming language' },
                        { name: 'requirements', type: 'string', required: true, description: 'Code requirements' }
                    ],
                    outputs: [
                        { name: 'code', type: 'string', description: 'Generated code' }
                    ],
                    complexity: 'moderate',
                    reliability: 0.85
                },
                {
                    name: 'debugging',
                    version: '1.0.0',
                    description: 'Debug and fix code issues',
                    parameters: [
                        { name: 'code', type: 'string', required: true, description: 'Code to debug' },
                        { name: 'error', type: 'string', required: false, description: 'Error description' }
                    ],
                    outputs: [
                        { name: 'fixed_code', type: 'string', description: 'Fixed code' },
                        { name: 'explanation', type: 'string', description: 'Bug explanation' }
                    ],
                    complexity: 'complex',
                    reliability: 0.8
                }
            ],
            'reviewer': [
                {
                    name: 'code-review',
                    version: '1.0.0',
                    description: 'Review code for quality and best practices',
                    parameters: [
                        { name: 'code', type: 'string', required: true, description: 'Code to review' },
                        { name: 'criteria', type: 'array', required: false, description: 'Review criteria' }
                    ],
                    outputs: [
                        { name: 'review_comments', type: 'array', description: 'Review feedback' },
                        { name: 'score', type: 'number', description: 'Quality score' }
                    ],
                    complexity: 'moderate',
                    reliability: 0.9
                }
            ],
            'tester': [
                {
                    name: 'test-generation',
                    version: '1.0.0',
                    description: 'Generate comprehensive test cases',
                    parameters: [
                        { name: 'code', type: 'string', required: true, description: 'Code to test' },
                        { name: 'test_type', type: 'string', required: false, description: 'Type of tests' }
                    ],
                    outputs: [
                        { name: 'test_code', type: 'string', description: 'Generated test code' },
                        { name: 'coverage', type: 'number', description: 'Expected coverage' }
                    ],
                    complexity: 'moderate',
                    reliability: 0.85
                }
            ]
        };
        // Store capabilities for agent types
        this.agentCapabilities = standardCapabilities;
        console.log(`Loaded capabilities for ${Object.keys(standardCapabilities).length} agent types`);
    }
    async loadToolRegistry() {
        try {
            // Load available tools from configuration
            const toolsFromConfig = this.config.tools.availableTools;
            // Load additional tools from registry if specified
            if (this.config.tools.customToolRegistry) {
                const customTools = await this.loadCustomTools();
                toolsFromConfig.push(...customTools);
            }
            // Initialize tool rate limiters
            this.initializeToolRateLimiters();
            console.log(`Loaded ${toolsFromConfig.length} tools into registry`);
        }
        catch (error) {
            throw new Error(`Failed to load tool registry: ${error}`);
        }
    }
    async loadCustomTools() {
        try {
            const response = await fetch(this.config.tools.customToolRegistry, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.config.execution.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                return data.tools || [];
            }
            return [];
        }
        catch (error) {
            console.error('Failed to load custom tools:', error);
            return [];
        }
    }
    initializeToolRateLimiters() {
        this.toolRateLimiters = new Map();
        for (const [toolName, limit] of Object.entries(this.config.tools.toolRateLimits)) {
            this.toolRateLimiters.set(toolName, {
                requests: [],
                limit,
                window: 60000 // 1 minute window
            });
        }
    }
    agentCapabilities = {};
    toolRateLimiters = new Map();
    async submitExecution(execution) {
        try {
            execution.status = 'running';
            execution.startedAt = new Date();
            // Submit to Claude Code execution engine
            const executionResult = await this.executeCodeDirect(execution);
            // Update execution with results
            execution.status = executionResult.success ? 'completed' : 'failed';
            execution.completedAt = new Date();
            execution.result = executionResult.result || {
                success: false,
                stdout: '',
                stderr: executionResult.error || 'Unknown error',
                output: {},
                warnings: []
            };
            // Calculate metrics
            if (execution.startedAt) {
                execution.metrics.wallTime = execution.completedAt.getTime() - execution.startedAt.getTime();
            }
            // Simulate resource metrics (in real implementation, get from execution engine)
            execution.metrics.memoryUsed = Math.floor(Math.random() * 512);
            execution.metrics.cpuTime = Math.floor(execution.metrics.wallTime * 0.8);
            // Publish completion event
            await this.publishEvent({
                id: `execution_completed_${execution.id}`,
                type: 'execution.completed',
                source: 'claude-code-bridge',
                timestamp: new Date(),
                data: {
                    executionId: execution.id,
                    action: 'execution_completed',
                    details: execution.result
                }
            });
            // Stream execution updates
            this.emit('stream-event', {
                component: 'claude-code',
                type: 'execution-completed',
                data: {
                    executionId: execution.id,
                    status: execution.status,
                    metrics: execution.metrics,
                    result: execution.result
                },
                timestamp: new Date()
            });
        }
        catch (error) {
            execution.status = 'failed';
            execution.completedAt = new Date();
            execution.result = {
                success: false,
                stdout: '',
                stderr: '',
                output: {},
                error: error instanceof Error ? error.message : 'Unknown error',
                warnings: []
            };
            console.error(`Execution ${execution.id} failed:`, error);
        }
    }
    async requestAgentSpawn(agent) {
        try {
            // Request agent spawn via coordinator
            const spawnRequest = {
                agentId: agent.id,
                type: agent.type,
                name: agent.name,
                configuration: agent.configuration,
                capabilities: agent.capabilities.map(cap => cap.name)
            };
            const response = await fetch(`${this.config.agents.coordinatorEndpoint}/agents/spawn`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.execution.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(spawnRequest),
                signal: AbortSignal.timeout(30000)
            });
            if (!response.ok) {
                throw new Error(`Agent spawn request failed: ${response.status}`);
            }
            const result = await response.json();
            // Update agent with spawn result
            agent.status = result.status || 'idle';
            agent.lastHeartbeat = new Date();
            // Set up heartbeat monitoring for this agent
            this.setupAgentHeartbeat(agent);
            console.log(`Agent ${agent.name} spawned successfully`);
        }
        catch (error) {
            agent.status = 'error';
            console.error(`Failed to spawn agent ${agent.name}:`, error);
            throw error;
        }
    }
    setupAgentHeartbeat(agent) {
        const heartbeatInterval = setInterval(async () => {
            try {
                const isAlive = await this.checkAgentHealth(agent);
                if (isAlive) {
                    agent.lastHeartbeat = new Date();
                }
                else {
                    agent.status = 'error';
                    clearInterval(heartbeatInterval);
                    this.emit('agent-health-failed', { agentId: agent.id, reason: 'heartbeat-failed' });
                }
            }
            catch (error) {
                console.error(`Heartbeat check failed for agent ${agent.id}:`, error);
            }
        }, this.config.agents.heartbeatInterval);
        // Store interval reference for cleanup
        agent._heartbeatInterval = heartbeatInterval;
    }
    async checkAgentHealth(agent) {
        try {
            const response = await fetch(`${this.config.agents.coordinatorEndpoint}/agents/${agent.id}/health`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.config.execution.apiKey}`
                },
                signal: AbortSignal.timeout(5000)
            });
            return response.ok;
        }
        catch (error) {
            return false;
        }
    }
    async startTaskCoordination(coordination) {
        try {
            coordination.status = 'running';
            coordination.startedAt = new Date();
            console.log(`Starting task coordination: ${coordination.name}`);
            // Process tasks based on coordination type
            switch (coordination.type) {
                case 'sequential':
                    await this.executeSequentialTasks(coordination);
                    break;
                case 'parallel':
                    await this.executeParallelTasks(coordination);
                    break;
                case 'pipeline':
                    await this.executePipelineTasks(coordination);
                    break;
                case 'fan_out':
                    await this.executeFanOutTasks(coordination);
                    break;
                case 'fan_in':
                    await this.executeFanInTasks(coordination);
                    break;
                default:
                    throw new Error(`Unknown coordination type: ${coordination.type}`);
            }
            coordination.status = 'completed';
            coordination.completedAt = new Date();
            await this.publishEvent({
                id: `coordination_completed_${coordination.id}`,
                type: 'coordination.completed',
                source: 'claude-code-bridge',
                timestamp: new Date(),
                data: {
                    taskId: coordination.id,
                    action: 'coordination_completed',
                    details: {
                        type: coordination.type,
                        tasksCompleted: coordination.tasks.length,
                        results: coordination.results.length
                    }
                }
            });
        }
        catch (error) {
            coordination.status = 'failed';
            coordination.completedAt = new Date();
            console.error(`Task coordination ${coordination.id} failed:`, error);
        }
    }
    async executeSequentialTasks(coordination) {
        for (const task of coordination.tasks) {
            try {
                await this.executeCoordinatedTask(task, coordination);
            }
            catch (error) {
                if (this.config.coordination.failureStrategy === 'abort') {
                    throw error;
                }
                console.error(`Task ${task.id} failed, continuing with next task:`, error);
            }
        }
    }
    async executeParallelTasks(coordination) {
        const taskPromises = coordination.tasks.map(task => this.executeCoordinatedTask(task, coordination).catch(error => {
            if (this.config.coordination.failureStrategy === 'abort') {
                throw error;
            }
            console.error(`Task ${task.id} failed:`, error);
            return null;
        }));
        await Promise.allSettled(taskPromises);
    }
    async executePipelineTasks(coordination) {
        // Execute tasks in dependency order
        const sortedTasks = this.topologicalSort(coordination.tasks, coordination.dependencies);
        for (const task of sortedTasks) {
            // Wait for dependencies to complete
            await this.waitForTaskDependencies(task, coordination);
            // Execute task
            await this.executeCoordinatedTask(task, coordination);
        }
    }
    async executeFanOutTasks(coordination) {
        // Execute first task, then fan out to parallel execution of remaining tasks
        if (coordination.tasks.length === 0)
            return;
        const firstTask = coordination.tasks[0];
        await this.executeCoordinatedTask(firstTask, coordination);
        const remainingTasks = coordination.tasks.slice(1);
        await this.executeParallelTasks({ ...coordination, tasks: remainingTasks });
    }
    async executeFanInTasks(coordination) {
        // Execute all tasks except last in parallel, then execute last task
        if (coordination.tasks.length === 0)
            return;
        const lastTask = coordination.tasks[coordination.tasks.length - 1];
        const parallelTasks = coordination.tasks.slice(0, -1);
        if (parallelTasks.length > 0) {
            await this.executeParallelTasks({ ...coordination, tasks: parallelTasks });
        }
        await this.executeCoordinatedTask(lastTask, coordination);
    }
    async executeCoordinatedTask(task, coordination) {
        const startTime = Date.now();
        try {
            task.status = 'running';
            task.startedAt = new Date();
            let result;
            switch (task.type) {
                case 'execution':
                    result = await this.executeTaskAsCode(task);
                    break;
                case 'tool_call':
                    result = await this.executeTaskAsTool(task);
                    break;
                case 'agent_task':
                    result = await this.executeTaskAsAgent(task);
                    break;
                case 'workflow':
                    result = await this.executeTaskAsWorkflow(task);
                    break;
                default:
                    throw new Error(`Unknown task type: ${task.type}`);
            }
            task.status = 'completed';
            task.completedAt = new Date();
            task.output = result;
            // Store task result
            const taskResult = {
                taskId: task.id,
                success: true,
                data: result,
                executionTime: Date.now() - startTime,
                resourceUsage: {
                    memory: Math.random() * 100,
                    cpu: Math.random() * 100,
                    io: Math.random() * 100
                },
                completedAt: new Date()
            };
            coordination.results.push(taskResult);
        }
        catch (error) {
            task.status = 'failed';
            task.completedAt = new Date();
            const taskResult = {
                taskId: task.id,
                success: false,
                data: null,
                error: error instanceof Error ? error.message : 'Unknown error',
                executionTime: Date.now() - startTime,
                resourceUsage: {
                    memory: 0,
                    cpu: 0,
                    io: 0
                },
                completedAt: new Date()
            };
            coordination.results.push(taskResult);
            throw error;
        }
    }
    async executeTaskAsCode(task) {
        // Execute task as code execution
        const codeExecution = {
            type: 'script',
            language: task.input.language || 'javascript',
            code: task.input.code,
            arguments: task.input.arguments,
            workingDirectory: task.input.workingDirectory,
            environment: task.input.environment,
            context: this.createDefaultContext('code_execution')
        };
        const result = await this.executeCodeDirect(codeExecution);
        return result.result;
    }
    async executeTaskAsTool(task) {
        // Execute task as tool invocation
        const toolResult = await this.invokeTool(task.input.toolName, task.input.parameters, task.input.context);
        return toolResult.data;
    }
    async executeTaskAsAgent(task) {
        // Assign task to specific agent
        if (!task.assignedAgent) {
            throw new Error('No agent assigned for agent task');
        }
        const taskId = await this.assignTask(task.assignedAgent, task.input);
        return { taskId, status: 'assigned' };
    }
    async executeTaskAsWorkflow(task) {
        // Execute nested workflow
        const nestedCoordination = task.input;
        await this.startTaskCoordination(nestedCoordination);
        return nestedCoordination.results;
    }
    topologicalSort(tasks, dependencies) {
        // Simple topological sort implementation
        const sorted = [];
        const visited = new Set();
        const visiting = new Set();
        const visit = (taskId) => {
            if (visiting.has(taskId)) {
                throw new Error(`Circular dependency detected involving task ${taskId}`);
            }
            if (visited.has(taskId)) {
                return;
            }
            visiting.add(taskId);
            // Visit dependencies first
            const taskDeps = dependencies.filter(dep => dep.taskId === taskId);
            for (const dep of taskDeps) {
                for (const depId of dep.dependsOn) {
                    visit(depId);
                }
            }
            visiting.delete(taskId);
            visited.add(taskId);
            const task = tasks.find(t => t.id === taskId);
            if (task) {
                sorted.push(task);
            }
        };
        for (const task of tasks) {
            visit(task.id);
        }
        return sorted;
    }
    async waitForTaskDependencies(task, coordination) {
        const dependencies = coordination.dependencies.filter(dep => dep.taskId === task.id);
        for (const dep of dependencies) {
            for (const depId of dep.dependsOn) {
                await this.waitForTaskCompletion(depId, coordination);
            }
        }
    }
    async waitForTaskCompletion(taskId, coordination) {
        const task = coordination.tasks.find(t => t.id === taskId);
        if (!task)
            return;
        while (task.status === 'pending' || task.status === 'running') {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
    async executeToolInvocation(invocation) {
        const startTime = Date.now();
        try {
            // Check rate limits
            const rateLimiter = this.toolRateLimiters.get(invocation.toolName);
            if (rateLimiter) {
                const now = Date.now();
                const windowStart = now - rateLimiter.window;
                // Clean old requests
                rateLimiter.requests = rateLimiter.requests.filter(time => time > windowStart);
                // Check if rate limit exceeded
                if (rateLimiter.requests.length >= rateLimiter.limit) {
                    invocation.metrics.rateLimitHits++;
                    throw new Error(`Rate limit exceeded for tool ${invocation.toolName}`);
                }
                // Add current request
                rateLimiter.requests.push(now);
            }
            invocation.status = 'running';
            // Execute tool via Claude Code
            const response = await fetch(`${this.config.execution.apiEndpoint}/tools/${invocation.toolName}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.execution.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    parameters: invocation.parameters,
                    context: {
                        timeout: invocation.context.constraints?.timeout || 30000,
                        permissions: invocation.context.permissions,
                        resources: invocation.context.resources
                    }
                }),
                signal: AbortSignal.timeout(invocation.context.constraints?.timeout || 30000)
            });
            if (!response.ok) {
                throw new Error(`Tool execution failed: ${response.status} ${response.statusText}`);
            }
            const result = await response.json();
            invocation.metrics.executionTime = Date.now() - startTime;
            invocation.metrics.memoryUsed = result.metrics?.memoryUsed || 0;
            return result.data || result;
        }
        catch (error) {
            invocation.metrics.executionTime = Date.now() - startTime;
            throw error;
        }
    }
    createDefaultContext(type) {
        return {
            id: `ctx_${Date.now()}`,
            type,
            initiator: 'claude-code-bridge',
            environment: this.config.execution.sandboxMode ? 'sandbox' : 'production',
            permissions: {
                fileSystem: { read: [], write: [], execute: [] },
                network: { allowedDomains: [], allowedPorts: [], restrictLocal: true },
                system: {
                    allowProcessSpawn: false,
                    maxMemoryMB: 512,
                    maxCPUPercent: 50,
                    allowedCommands: []
                }
            },
            resources: {
                maxMemoryMB: 512,
                maxCPUTime: 30000,
                maxWallTime: 60000,
                maxOutputSize: 1048576,
                tempDirectoryQuota: 104857600
            },
            constraints: {
                timeout: this.config.execution.executionTimeout,
                maxRetries: 3,
                requireApproval: false,
                auditLevel: 'basic'
            },
            metadata: {},
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 3600000) // 1 hour
        };
    }
    async checkExecutionEngineHealth() {
        // TODO: Check execution engine health
        return true;
    }
    async checkAgentCoordinatorHealth() {
        // TODO: Check agent coordinator health
        return true;
    }
    async checkToolRegistryHealth() {
        // TODO: Check tool registry health
        return true;
    }
    calculateErrorRate() {
        const { requestCount, errorCount } = this.getMetrics();
        return requestCount > 0 ? errorCount / requestCount : 0;
    }
    calculateThroughput() {
        return this.getMetrics().requestCount / 60;
    }
    createClaudeCodeError(code, message, originalError) {
        const error = new Error(message);
        error.code = code;
        error.severity = 'medium';
        error.retryable = ![
            'EXECUTION_NOT_FOUND',
            'AGENT_NOT_FOUND',
            'COORDINATION_NOT_FOUND',
            'AGENT_BUSY'
        ].includes(code);
        error.context = originalError;
        error.timestamp = new Date();
        return error;
    }
}
exports.ClaudeCodeBridge = ClaudeCodeBridge;
//# sourceMappingURL=ClaudeCodeBridge.js.map