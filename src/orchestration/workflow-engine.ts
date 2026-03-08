/**
 * Workflow Engine for Platform Orchestration
 * Manages complex multi-component workflows
 */

import { EventEmitter } from 'events';

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  steps: WorkflowStep[];
  metadata: WorkflowMetadata;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: 'component' | 'condition' | 'parallel' | 'sequential' | 'loop' | 'human';
  config: StepConfig;
  dependencies: string[];
  conditions?: StepCondition[];
  retryConfig?: RetryConfig;
  timeout?: number;
}

export interface StepConfig {
  component?: string;
  action: string;
  parameters: Record<string, any>;
  outputMapping?: Record<string, string>;
  errorHandling?: ErrorHandlingConfig;
}

export interface StepCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater' | 'less' | 'contains' | 'exists';
  value: any;
}

export interface RetryConfig {
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  baseDelay: number;
  maxDelay: number;
}

export interface ErrorHandlingConfig {
  strategy: 'fail' | 'continue' | 'retry' | 'fallback';
  fallbackStep?: string;
  continueOnError?: boolean;
}

export interface WorkflowMetadata {
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  tags: string[];
  category: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'paused';
  startTime: Date;
  endTime?: Date;
  progress: number;
  currentStep?: string;
  stepExecutions: Map<string, StepExecution>;
  context: WorkflowContext;
  errors: WorkflowError[];
}

export interface StepExecution {
  stepId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped' | 'retrying';
  startTime?: Date;
  endTime?: Date;
  attempts: number;
  output?: any;
  error?: string;
  metadata: StepExecutionMetadata;
}

export interface StepExecutionMetadata {
  executionTime?: number;
  resourcesUsed: string[];
  memoryUsage?: number;
  cpuUsage?: number;
}

export interface WorkflowContext {
  variables: Map<string, any>;
  artifacts: Map<string, any>;
  userInputs: Map<string, any>;
  componentStates: Map<string, any>;
}

export interface WorkflowError {
  stepId: string;
  timestamp: Date;
  error: string;
  stack?: string;
  context: any;
}

export interface OrchestrationConfig {
  maxConcurrentExecutions: number;
  defaultTimeout: number;
  persistenceEnabled: boolean;
  metricsEnabled: boolean;
}

export class WorkflowEngine extends EventEmitter {
  private config: OrchestrationConfig;
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private componentRegistry: Map<string, any> = new Map();
  private executionQueue: string[] = [];
  private isProcessing = false;

  constructor(config: OrchestrationConfig) {
    super();
    this.config = config;
  }

  async initialize(): Promise<void> {
    // Load workflow definitions
    await this.loadWorkflowDefinitions();

    // Setup component registry
    await this.setupComponentRegistry();

    // Start execution processor
    this.startExecutionProcessor();

    // Setup persistence if enabled
    if (this.config.persistenceEnabled) {
      await this.setupPersistence();
    }
  }

  private async loadWorkflowDefinitions(): Promise<void> {
    // Load workflow definitions from storage/configuration
    const predefinedWorkflows = this.createPredefinedWorkflows();
    for (const workflow of predefinedWorkflows) {
      this.workflows.set(workflow.id, workflow);
    }
  }

  private createPredefinedWorkflows(): WorkflowDefinition[] {
    return [
      {
        id: 'full-stack-development',
        name: 'Full Stack Development Workflow',
        description: 'Complete development workflow using all 6 components',
        version: '1.0.0',
        steps: [
          {
            id: 'project-init',
            name: 'Initialize Project',
            type: 'component',
            config: {
              component: 'dossier',
              action: 'create_project',
              parameters: {
                name: '${workflow.project_name}',
                framework: '${workflow.framework}',
                template: '${workflow.template}'
              }
            },
            dependencies: []
          },
          {
            id: 'code-analysis',
            name: 'Analyze Codebase',
            type: 'component',
            config: {
              component: 'gitnexus',
              action: 'analyze_repository',
              parameters: {
                repositoryPath: '${project-init.output.path}',
                includeTests: true
              }
            },
            dependencies: ['project-init']
          },
          {
            id: 'setup-swarm',
            name: 'Initialize Development Swarm',
            type: 'component',
            config: {
              component: 'ruflo',
              action: 'swarm_init',
              parameters: {
                topology: 'hierarchical',
                maxAgents: 8,
                strategy: 'specialized'
              }
            },
            dependencies: ['project-init']
          },
          {
            id: 'parallel-development',
            name: 'Parallel Development Tasks',
            type: 'parallel',
            config: {
              action: 'execute_parallel',
              parameters: {
                tasks: [
                  'frontend-development',
                  'backend-development',
                  'testing-setup'
                ]
              }
            },
            dependencies: ['setup-swarm', 'code-analysis']
          }
        ],
        metadata: {
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['development', 'full-stack', 'automated'],
          category: 'development',
          priority: 'normal'
        }
      },
      {
        id: 'code-refactoring',
        name: 'Intelligent Code Refactoring',
        description: 'Refactor code using graph analysis and AST navigation',
        version: '1.0.0',
        steps: [
          {
            id: 'impact-analysis',
            name: 'Analyze Refactoring Impact',
            type: 'component',
            config: {
              component: 'gitnexus-rlm',
              action: 'analyze_impact',
              parameters: {
                changedFiles: '${workflow.target_files}',
                changeType: 'refactoring'
              }
            },
            dependencies: []
          },
          {
            id: 'create-refactoring-plan',
            name: 'Create Refactoring Plan',
            type: 'component',
            config: {
              component: 'adw-skills',
              action: 'create_plan',
              parameters: {
                methodology: 'adw',
                context: '${impact-analysis.output}'
              }
            },
            dependencies: ['impact-analysis']
          },
          {
            id: 'execute-refactoring',
            name: 'Execute Refactoring',
            type: 'component',
            config: {
              component: 'claude-code',
              action: 'refactor_code',
              parameters: {
                plan: '${create-refactoring-plan.output}',
                safetyChecks: true
              }
            },
            dependencies: ['create-refactoring-plan']
          }
        ],
        metadata: {
          createdBy: 'system',
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: ['refactoring', 'analysis', 'automation'],
          category: 'maintenance',
          priority: 'normal'
        }
      }
    ];
  }

  private async setupComponentRegistry(): Promise<void> {
    // Register available components
    // This would be populated by the platform orchestrator
  }

  private startExecutionProcessor(): void {
    setInterval(async () => {
      if (!this.isProcessing && this.executionQueue.length > 0) {
        await this.processExecutionQueue();
      }
    }, 1000);
  }

  private async setupPersistence(): Promise<void> {
    // Setup persistence layer for workflow state
  }

  async createWorkflow(definition: WorkflowDefinition): Promise<void> {
    this.validateWorkflowDefinition(definition);
    this.workflows.set(definition.id, definition);
    this.emit('workflow:created', definition);
  }

  async execute(workflowId: string, parameters: Record<string, any> = {}): Promise<string> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const executionId = this.generateExecutionId();
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: 'pending',
      startTime: new Date(),
      progress: 0,
      stepExecutions: new Map(),
      context: {
        variables: new Map(Object.entries(parameters)),
        artifacts: new Map(),
        userInputs: new Map(),
        componentStates: new Map()
      },
      errors: []
    };

    // Initialize step executions
    for (const step of workflow.steps) {
      execution.stepExecutions.set(step.id, {
        stepId: step.id,
        status: 'pending',
        attempts: 0,
        metadata: {
          resourcesUsed: []
        }
      });
    }

    this.executions.set(executionId, execution);
    this.executionQueue.push(executionId);

    this.emit('execution:created', execution);

    return executionId;
  }

  private async processExecutionQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      const concurrentExecutions = Array.from(this.executions.values())
        .filter(exec => exec.status === 'running').length;

      if (concurrentExecutions >= this.config.maxConcurrentExecutions) {
        return;
      }

      const executionId = this.executionQueue.shift();
      if (executionId) {
        const execution = this.executions.get(executionId);
        if (execution && execution.status === 'pending') {
          await this.startExecution(execution);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async startExecution(execution: WorkflowExecution): Promise<void> {
    execution.status = 'running';
    execution.startTime = new Date();

    this.emit('execution:started', execution);

    try {
      await this.executeWorkflow(execution);
    } catch (error) {
      execution.status = 'failed';
      execution.errors.push({
        stepId: 'workflow',
        timestamp: new Date(),
        error: (error as Error).message,
        stack: (error as Error).stack,
        context: {}
      });

      this.emit('execution:failed', execution);
    }
  }

  private async executeWorkflow(execution: WorkflowExecution): Promise<void> {
    const workflow = this.workflows.get(execution.workflowId)!;
    const executionOrder = this.calculateExecutionOrder(workflow.steps);

    for (const stepGroup of executionOrder) {
      if (execution.status !== 'running') break;

      if (stepGroup.length === 1) {
        // Sequential execution
        await this.executeStep(execution, stepGroup[0]);
      } else {
        // Parallel execution
        await Promise.all(
          stepGroup.map(step => this.executeStep(execution, step))
        );
      }

      // Update progress
      const completedSteps = Array.from(execution.stepExecutions.values())
        .filter(exec => exec.status === 'completed').length;
      execution.progress = (completedSteps / workflow.steps.length) * 100;

      this.emit('execution:progress', execution);
    }

    if (execution.status === 'running') {
      execution.status = 'completed';
      execution.endTime = new Date();
      this.emit('execution:completed', execution);
    }
  }

  private calculateExecutionOrder(steps: WorkflowStep[]): WorkflowStep[][] {
    const order: WorkflowStep[][] = [];
    const processed = new Set<string>();
    const remaining = new Map(steps.map(step => [step.id, step]));

    while (remaining.size > 0) {
      const currentLevel: WorkflowStep[] = [];

      for (const [stepId, step] of remaining.entries()) {
        const canExecute = step.dependencies.every(dep => processed.has(dep));

        if (canExecute) {
          currentLevel.push(step);
        }
      }

      if (currentLevel.length === 0) {
        throw new Error('Circular dependency detected in workflow steps');
      }

      for (const step of currentLevel) {
        remaining.delete(step.id);
        processed.add(step.id);
      }

      order.push(currentLevel);
    }

    return order;
  }

  private async executeStep(execution: WorkflowExecution, step: WorkflowStep): Promise<void> {
    const stepExecution = execution.stepExecutions.get(step.id)!;
    stepExecution.status = 'running';
    stepExecution.startTime = new Date();

    this.emit('step:started', { execution, step, stepExecution });

    try {
      // Check conditions
      if (step.conditions && !this.evaluateConditions(step.conditions, execution.context)) {
        stepExecution.status = 'skipped';
        stepExecution.endTime = new Date();
        this.emit('step:skipped', { execution, step, stepExecution });
        return;
      }

      // Execute step
      const result = await this.executeStepWithRetry(execution, step, stepExecution);

      stepExecution.status = 'completed';
      stepExecution.endTime = new Date();
      stepExecution.output = result;

      // Process output mapping
      this.processOutputMapping(step.config.outputMapping, result, execution.context);

      this.emit('step:completed', { execution, step, stepExecution });

    } catch (error) {
      stepExecution.status = 'failed';
      stepExecution.endTime = new Date();
      stepExecution.error = (error as Error).message;

      execution.errors.push({
        stepId: step.id,
        timestamp: new Date(),
        error: (error as Error).message,
        stack: (error as Error).stack,
        context: stepExecution
      });

      // Handle error based on configuration
      await this.handleStepError(execution, step, error as Error);

      this.emit('step:failed', { execution, step, stepExecution, error });
    }
  }

  private async executeStepWithRetry(
    execution: WorkflowExecution,
    step: WorkflowStep,
    stepExecution: StepExecution
  ): Promise<any> {
    const maxAttempts = step.retryConfig?.maxAttempts || 1;
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      stepExecution.attempts = attempt;

      try {
        const result = await this.executeStepAction(execution, step);
        return result;
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxAttempts) {
          stepExecution.status = 'retrying';
          const delay = this.calculateRetryDelay(step.retryConfig!, attempt);
          await this.sleep(delay);
          this.emit('step:retrying', { execution, step, stepExecution, attempt });
        }
      }
    }

    throw lastError!;
  }

  private async executeStepAction(execution: WorkflowExecution, step: WorkflowStep): Promise<any> {
    const { component, action, parameters } = step.config;

    // Resolve parameters with context variables
    const resolvedParams = this.resolveParameters(parameters, execution.context);

    switch (step.type) {
      case 'component':
        return this.executeComponentAction(component!, action, resolvedParams);
      case 'condition':
        return this.executeCondition(step, execution.context);
      case 'parallel':
        return this.executeParallel(step, execution);
      case 'sequential':
        return this.executeSequential(step, execution);
      case 'loop':
        return this.executeLoop(step, execution);
      case 'human':
        return this.executeHumanTask(step, execution);
      default:
        throw new Error(`Unsupported step type: ${step.type}`);
    }
  }

  private async executeComponentAction(component: string, action: string, parameters: any): Promise<any> {
    const componentInstance = this.componentRegistry.get(component);
    if (!componentInstance) {
      throw new Error(`Component ${component} not registered`);
    }

    // Execute component action
    return componentInstance.executeCapability(action, parameters);
  }

  private resolveParameters(parameters: Record<string, any>, context: WorkflowContext): Record<string, any> {
    const resolved: Record<string, any> = {};

    for (const [key, value] of Object.entries(parameters)) {
      resolved[key] = this.resolveValue(value, context);
    }

    return resolved;
  }

  private resolveValue(value: any, context: WorkflowContext): any {
    if (typeof value === 'string' && value.startsWith('${') && value.endsWith('}')) {
      const expression = value.slice(2, -1);
      return this.evaluateExpression(expression, context);
    }

    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value)) {
        return value.map(item => this.resolveValue(item, context));
      } else {
        const resolved: Record<string, any> = {};
        for (const [k, v] of Object.entries(value)) {
          resolved[k] = this.resolveValue(v, context);
        }
        return resolved;
      }
    }

    return value;
  }

  private evaluateExpression(expression: string, context: WorkflowContext): any {
    // Simple expression evaluation
    // In a real implementation, you might use a more sophisticated expression parser

    if (expression.startsWith('workflow.')) {
      const varName = expression.substring('workflow.'.length);
      return context.variables.get(varName);
    }

    if (expression.includes('.output')) {
      const [stepId, property] = expression.split('.');
      const stepExecution = Array.from(this.executions.values())
        .flatMap(exec => Array.from(exec.stepExecutions.values()))
        .find(exec => exec.stepId === stepId);

      if (stepExecution && property === 'output') {
        return stepExecution.output;
      }
    }

    return context.variables.get(expression);
  }

  private evaluateConditions(conditions: StepCondition[], context: WorkflowContext): boolean {
    return conditions.every(condition => {
      const fieldValue = this.evaluateExpression(condition.field, context);

      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'not_equals':
          return fieldValue !== condition.value;
        case 'greater':
          return fieldValue > condition.value;
        case 'less':
          return fieldValue < condition.value;
        case 'contains':
          return String(fieldValue).includes(String(condition.value));
        case 'exists':
          return fieldValue !== undefined && fieldValue !== null;
        default:
          return true;
      }
    });
  }

  private processOutputMapping(
    outputMapping: Record<string, string> | undefined,
    result: any,
    context: WorkflowContext
  ): void {
    if (!outputMapping) return;

    for (const [sourceField, targetVariable] of Object.entries(outputMapping)) {
      const value = this.getNestedValue(result, sourceField);
      context.variables.set(targetVariable, value);
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, prop) => current?.[prop], obj);
  }

  private calculateRetryDelay(retryConfig: RetryConfig, attempt: number): number {
    switch (retryConfig.backoffStrategy) {
      case 'linear':
        return Math.min(retryConfig.baseDelay * attempt, retryConfig.maxDelay);
      case 'exponential':
        return Math.min(retryConfig.baseDelay * Math.pow(2, attempt - 1), retryConfig.maxDelay);
      case 'fixed':
      default:
        return retryConfig.baseDelay;
    }
  }

  private async handleStepError(execution: WorkflowExecution, step: WorkflowStep, error: Error): Promise<void> {
    const errorConfig = step.config.errorHandling;

    if (!errorConfig) {
      execution.status = 'failed';
      return;
    }

    switch (errorConfig.strategy) {
      case 'fail':
        execution.status = 'failed';
        break;
      case 'continue':
        if (!errorConfig.continueOnError) {
          execution.status = 'failed';
        }
        break;
      case 'fallback':
        if (errorConfig.fallbackStep) {
          // Execute fallback step
          const fallbackStep = this.workflows.get(execution.workflowId)!.steps
            .find(s => s.id === errorConfig.fallbackStep);
          if (fallbackStep) {
            await this.executeStep(execution, fallbackStep);
          }
        }
        break;
    }
  }

  private async executeCondition(step: WorkflowStep, context: WorkflowContext): Promise<any> {
    // Execute conditional logic
    return true;
  }

  private async executeParallel(step: WorkflowStep, execution: WorkflowExecution): Promise<any> {
    // Execute parallel tasks
    return {};
  }

  private async executeSequential(step: WorkflowStep, execution: WorkflowExecution): Promise<any> {
    // Execute sequential tasks
    return {};
  }

  private async executeLoop(step: WorkflowStep, execution: WorkflowExecution): Promise<any> {
    // Execute loop logic
    return {};
  }

  private async executeHumanTask(step: WorkflowStep, execution: WorkflowExecution): Promise<any> {
    // Handle human interaction task
    execution.status = 'paused';
    this.emit('human:intervention_required', { execution, step });
    return {};
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private validateWorkflowDefinition(definition: WorkflowDefinition): void {
    if (!definition.id || !definition.name || !definition.steps) {
      throw new Error('Invalid workflow definition: missing required fields');
    }

    // Validate steps
    const stepIds = new Set<string>();
    for (const step of definition.steps) {
      if (stepIds.has(step.id)) {
        throw new Error(`Duplicate step ID: ${step.id}`);
      }
      stepIds.add(step.id);

      // Validate dependencies
      for (const dep of step.dependencies) {
        if (!stepIds.has(dep) && !definition.steps.some(s => s.id === dep)) {
          // Allow forward references for now
        }
      }
    }
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
  }

  async getExecution(executionId: string): Promise<WorkflowExecution | undefined> {
    return this.executions.get(executionId);
  }

  async listExecutions(workflowId?: string): Promise<WorkflowExecution[]> {
    const executions = Array.from(this.executions.values());
    return workflowId ? executions.filter(exec => exec.workflowId === workflowId) : executions;
  }

  async cancelExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (execution) {
      execution.status = 'cancelled';
      execution.endTime = new Date();
      this.emit('execution:cancelled', execution);
    }
  }

  async pauseExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'running') {
      execution.status = 'paused';
      this.emit('execution:paused', execution);
    }
  }

  async resumeExecution(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (execution && execution.status === 'paused') {
      execution.status = 'running';
      this.emit('execution:resumed', execution);
    }
  }

  registerComponent(name: string, component: any): void {
    this.componentRegistry.set(name, component);
  }

  async shutdown(): Promise<void> {
    // Cancel all running executions
    for (const execution of this.executions.values()) {
      if (execution.status === 'running') {
        await this.cancelExecution(execution.id);
      }
    }

    this.executions.clear();
    this.workflows.clear();
    this.componentRegistry.clear();
    this.executionQueue = [];
  }
}