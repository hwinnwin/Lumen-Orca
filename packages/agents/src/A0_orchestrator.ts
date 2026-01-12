/**
 * A0: Orchestrator (Enhanced)
 * Role: DAG coordinator, task scheduler, execution engine
 *
 * Enhancements:
 * - Task retry with exponential backoff
 * - Workflow YAML DSL support
 * - Inter-agent blocker protocol
 * - Conditional execution
 * - Priority queue
 * - Cost tracking
 */

import type {
  AgentTask,
  AgentStatus,
  AgentRole,
  RetryConfig,
  WorkflowDefinition,
  WorkflowTask,
  Blocker,
  AgentMessage,
  ExecutionContext,
  TaskCondition,
} from './types';
import { DEFAULT_RETRY_CONFIG } from './types';

type TaskEventCallback = (task: AgentTask) => void;
type AgentEventCallback = (status: AgentStatus) => void;
type BlockerEventCallback = (blocker: Blocker, task: AgentTask) => void;
type MessageEventCallback = (message: AgentMessage) => void;

export class Orchestrator {
  private tasks: Map<string, AgentTask> = new Map();
  private agentStates: Map<AgentRole, AgentStatus> = new Map();
  private messages: AgentMessage[] = [];
  private running: boolean = false;
  private paused: boolean = false;
  private maxParallelTasks: number = 4;
  private workflowId: string = '';
  private workflowName: string = '';
  private variables: Record<string, unknown> = {};

  // Event listeners
  private taskListeners: Set<TaskEventCallback> = new Set();
  private agentListeners: Set<AgentEventCallback> = new Set();
  private blockerListeners: Set<BlockerEventCallback> = new Set();
  private messageListeners: Set<MessageEventCallback> = new Set();

  constructor() {
    this.initializeAgentStates();
    this.workflowId = `wf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  // Initialize all agent states
  private initializeAgentStates(): void {
    const roles: AgentRole[] = [
      'A0_orchestrator', 'A1_spec', 'A2_architect',
      'A3_codegen_a', 'A4_codegen_b', 'A5_adjudicator',
      'A6_qa_harness', 'A7_evidence', 'A8_performance',
      'A9_security', 'A10_incident'
    ];

    // Load custom agents from registry
    if (typeof window !== 'undefined') {
      try {
        const customAgents = localStorage.getItem('lumen_custom_agents');
        if (customAgents) {
          const agents = JSON.parse(customAgents);
          agents.forEach((agent: any) => {
            if (!roles.includes(agent.role)) {
              roles.push(agent.role);
            }
          });
        }
      } catch (error) {
        console.warn('[Orchestrator] Failed to load custom agents:', error);
      }
    }

    roles.forEach(role => {
      this.agentStates.set(role, {
        role,
        state: 'idle',
        blockers: [],
        metrics: {
          tasksCompleted: 0,
          tasksFailed: 0,
          tasksRetried: 0,
          averageLatency: 0,
          errorRate: 0,
          totalTokensUsed: 0,
          estimatedCost: 0,
        }
      });
    });
  }

  // ============================================
  // EVENT SUBSCRIPTION
  // ============================================

  onTaskUpdate(callback: TaskEventCallback): () => void {
    this.taskListeners.add(callback);
    return () => this.taskListeners.delete(callback);
  }

  onAgentUpdate(callback: AgentEventCallback): () => void {
    this.agentListeners.add(callback);
    return () => this.agentListeners.delete(callback);
  }

  onBlocker(callback: BlockerEventCallback): () => void {
    this.blockerListeners.add(callback);
    return () => this.blockerListeners.delete(callback);
  }

  onMessage(callback: MessageEventCallback): () => void {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }

  private notifyTaskUpdate(task: AgentTask): void {
    this.taskListeners.forEach(cb => cb(task));
  }

  private notifyAgentUpdate(status: AgentStatus): void {
    this.agentListeners.forEach(cb => cb(status));
  }

  private notifyBlocker(blocker: Blocker, task: AgentTask): void {
    this.blockerListeners.forEach(cb => cb(blocker, task));
  }

  private notifyMessage(message: AgentMessage): void {
    this.messageListeners.forEach(cb => cb(message));
  }

  // ============================================
  // WORKFLOW YAML DSL
  // ============================================

  /**
   * Load workflow from YAML/JSON definition
   */
  loadWorkflow(definition: WorkflowDefinition): void {
    this.reset();
    this.workflowName = definition.name;
    this.variables = definition.variables || {};

    console.log(`[Orchestrator] Loading workflow: ${definition.name} v${definition.version}`);

    // Convert workflow tasks to AgentTasks
    for (const wfTask of definition.tasks) {
      const task = this.workflowTaskToAgentTask(wfTask);
      this.tasks.set(task.id, task);
    }

    // Validate DAG
    const order = this.getExecutionOrder();
    console.log(`[Orchestrator] Loaded ${order.length} tasks in execution order`);
  }

  /**
   * Convert WorkflowTask to AgentTask
   */
  private workflowTaskToAgentTask(wfTask: WorkflowTask): AgentTask {
    // Resolve input references like "$tasks.A1_spec.outputs"
    const inputs = typeof wfTask.inputs === 'string'
      ? this.resolveInputReference(wfTask.inputs)
      : wfTask.inputs;

    return {
      id: wfTask.id,
      role: wfTask.agent,
      inputs,
      status: 'pending',
      dependencies: wfTask.dependsOn || [],
      retryCount: 0,
      retryConfig: { ...DEFAULT_RETRY_CONFIG, ...wfTask.retry },
      condition: wfTask.condition,
      priority: wfTask.priority || 0,
    };
  }

  /**
   * Resolve input references like "$tasks.A1_spec.outputs.specification"
   */
  private resolveInputReference(ref: string): Record<string, unknown> {
    // This will be resolved at execution time
    return { _ref: ref };
  }

  /**
   * Resolve all references in task inputs at execution time
   */
  private resolveTaskInputs(task: AgentTask): Record<string, unknown> {
    const inputs = { ...task.inputs };

    // Check for reference
    if (inputs._ref && typeof inputs._ref === 'string') {
      const ref = inputs._ref;
      // Parse reference: $tasks.taskId.outputs.field
      const match = ref.match(/^\$tasks\.(\w+)\.outputs(?:\.(.+))?$/);
      if (match) {
        const [, taskId, field] = match;
        const depTask = this.tasks.get(taskId);
        if (depTask?.outputs) {
          if (field) {
            return { [field]: (depTask.outputs as any)[field] };
          }
          return depTask.outputs;
        }
      }
      // Parse variable reference: $vars.name
      const varMatch = ref.match(/^\$vars\.(\w+)$/);
      if (varMatch) {
        const [, varName] = varMatch;
        return { [varName]: this.variables[varName] };
      }
    }

    // Recursively resolve nested references
    for (const [key, value] of Object.entries(inputs)) {
      if (typeof value === 'string' && value.startsWith('$')) {
        const resolved = this.resolveInputReference(value);
        inputs[key] = this.resolveTaskInputs({ ...task, inputs: resolved });
      }
    }

    return inputs;
  }

  // ============================================
  // TASK MANAGEMENT
  // ============================================

  /**
   * Add task with validation
   */
  addTask(task: Partial<AgentTask> & { id: string; role: AgentRole }): void {
    const fullTask: AgentTask = {
      inputs: {},
      outputs: undefined,
      status: 'pending',
      dependencies: [],
      retryCount: 0,
      retryConfig: DEFAULT_RETRY_CONFIG,
      priority: 0,
      ...task,
    };

    if (this.hasCircularDependency(fullTask)) {
      throw new Error(`Circular dependency detected for task ${fullTask.id}`);
    }

    this.tasks.set(fullTask.id, fullTask);
    this.notifyTaskUpdate(fullTask);
  }

  /**
   * Circular dependency detection using DFS
   */
  private hasCircularDependency(newTask: AgentTask): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (taskId: string): boolean => {
      if (!this.tasks.has(taskId) && taskId !== newTask.id) return false;
      if (recursionStack.has(taskId)) return true;
      if (visited.has(taskId)) return false;

      visited.add(taskId);
      recursionStack.add(taskId);

      const task = taskId === newTask.id ? newTask : this.tasks.get(taskId)!;
      for (const depId of task.dependencies) {
        if (dfs(depId)) return true;
      }

      recursionStack.delete(taskId);
      return false;
    };

    return dfs(newTask.id);
  }

  /**
   * Get topological execution order
   */
  getExecutionOrder(): AgentTask[] {
    const sorted: AgentTask[] = [];
    const visited = new Set<string>();

    const visit = (taskId: string) => {
      if (visited.has(taskId)) return;
      visited.add(taskId);

      const task = this.tasks.get(taskId);
      if (!task) return;

      task.dependencies.forEach(visit);
      sorted.push(task);
    };

    this.tasks.forEach((_, id) => visit(id));

    // Sort by priority (higher priority first)
    return sorted.sort((a, b) => b.priority - a.priority);
  }

  // ============================================
  // RETRY LOGIC
  // ============================================

  /**
   * Calculate backoff delay for retry
   */
  private calculateBackoff(task: AgentTask): number {
    const { baseDelayMs, maxDelayMs, backoffMultiplier } = task.retryConfig;
    const delay = Math.min(
      baseDelayMs * Math.pow(backoffMultiplier, task.retryCount),
      maxDelayMs
    );
    // Add jitter (±20%)
    const jitter = delay * 0.2 * (Math.random() * 2 - 1);
    return Math.round(delay + jitter);
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: string, retryConfig: RetryConfig): boolean {
    const patterns = retryConfig.retryableErrors || DEFAULT_RETRY_CONFIG.retryableErrors!;
    return patterns.some(pattern => error.toLowerCase().includes(pattern.toLowerCase()));
  }

  /**
   * Schedule task retry
   */
  private async scheduleRetry(task: AgentTask, error: string): Promise<boolean> {
    if (task.retryCount >= task.retryConfig.maxRetries) {
      console.log(`[Orchestrator] Task ${task.id} exceeded max retries (${task.retryConfig.maxRetries})`);
      return false;
    }

    if (!this.isRetryableError(error, task.retryConfig)) {
      console.log(`[Orchestrator] Task ${task.id} error is not retryable: ${error}`);
      return false;
    }

    const backoff = this.calculateBackoff(task);
    task.retryCount++;
    task.status = 'retrying';
    task.lastError = error;
    task.nextRetryAt = new Date(Date.now() + backoff).toISOString();

    // Update agent metrics
    const agentState = this.agentStates.get(task.role);
    if (agentState) {
      agentState.metrics.tasksRetried++;
      agentState.state = 'retrying';
      this.notifyAgentUpdate(agentState);
    }

    this.notifyTaskUpdate(task);

    console.log(`[Orchestrator] Scheduling retry ${task.retryCount}/${task.retryConfig.maxRetries} for ${task.id} in ${backoff}ms`);

    // Wait for backoff
    await new Promise(resolve => setTimeout(resolve, backoff));

    // Reset to pending for re-execution
    task.status = 'pending';
    task.nextRetryAt = undefined;
    this.notifyTaskUpdate(task);

    return true;
  }

  // ============================================
  // BLOCKER PROTOCOL
  // ============================================

  /**
   * Create a blocker from agent
   */
  createBlocker(
    task: AgentTask,
    context: string,
    hypothesis: string,
    options: string[],
    requestedRoles: AgentRole[],
    priority: Blocker['priority'] = 'medium'
  ): Blocker {
    const blocker: Blocker = {
      context,
      hypothesis,
      options,
      requested_roles: requestedRoles,
      deadline: new Date(Date.now() + 3600000).toISOString(), // 1 hour default
      priority,
      createdAt: new Date().toISOString(),
    };

    task.blocker = blocker;
    task.status = 'blocked';
    this.notifyTaskUpdate(task);

    // Update agent state
    const agentState = this.agentStates.get(task.role);
    if (agentState) {
      agentState.state = 'blocked';
      agentState.blockers.push(blocker);
      this.notifyAgentUpdate(agentState);
    }

    // Notify blocker listeners
    this.notifyBlocker(blocker, task);

    // Send escalation message to requested roles
    requestedRoles.forEach(role => {
      this.sendMessage(task.role, role, 'escalation', {
        taskId: task.id,
        blocker,
      });
    });

    console.log(`[Orchestrator] Blocker created for ${task.id}: ${hypothesis}`);

    return blocker;
  }

  /**
   * Resolve a blocker
   */
  resolveBlocker(taskId: string, resolution: string): void {
    const task = this.tasks.get(taskId);
    if (!task?.blocker) return;

    task.blocker.resolvedAt = new Date().toISOString();
    task.blocker.resolution = resolution;
    task.status = 'pending'; // Ready to retry
    this.notifyTaskUpdate(task);

    // Update agent state
    const agentState = this.agentStates.get(task.role);
    if (agentState) {
      agentState.state = 'idle';
      agentState.blockers = agentState.blockers.filter(b => b !== task.blocker);
      this.notifyAgentUpdate(agentState);
    }

    console.log(`[Orchestrator] Blocker resolved for ${task.id}: ${resolution}`);
  }

  // ============================================
  // INTER-AGENT MESSAGING
  // ============================================

  /**
   * Send message between agents
   */
  sendMessage(
    from: AgentRole,
    to: AgentRole | 'broadcast',
    type: AgentMessage['type'],
    payload: Record<string, unknown>,
    correlationId?: string
  ): AgentMessage {
    const message: AgentMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      from,
      to,
      type,
      payload,
      timestamp: new Date().toISOString(),
      correlationId,
    };

    this.messages.push(message);
    this.notifyMessage(message);

    console.log(`[Orchestrator] Message ${type}: ${from} -> ${to}`);

    return message;
  }

  /**
   * Get messages for an agent
   */
  getMessagesForAgent(role: AgentRole): AgentMessage[] {
    return this.messages.filter(m => m.to === role || m.to === 'broadcast');
  }

  // ============================================
  // CONDITIONAL EXECUTION
  // ============================================

  /**
   * Check if task condition is met
   */
  private checkCondition(task: AgentTask): boolean {
    if (!task.condition) return true;

    switch (task.condition.type) {
      case 'always':
        return true;

      case 'on_success':
        if (task.condition.dependsOn) {
          const depTask = this.tasks.get(task.condition.dependsOn);
          return depTask?.status === 'completed';
        }
        return true;

      case 'on_failure':
        if (task.condition.dependsOn) {
          const depTask = this.tasks.get(task.condition.dependsOn);
          return depTask?.status === 'failed';
        }
        return false;

      case 'expression':
        return this.evaluateExpression(task.condition.expression || 'true');

      default:
        return true;
    }
  }

  /**
   * Evaluate condition expression (safe subset)
   */
  private evaluateExpression(expr: string): boolean {
    try {
      // Build context for expression
      const outputs: Record<string, any> = {};
      this.tasks.forEach((t, id) => {
        outputs[id] = t.outputs || {};
      });

      // Very simple expression evaluator (only supports basic comparisons)
      // e.g., "outputs.A1_spec.testable === true"
      const match = expr.match(/outputs\.(\w+)\.(\w+)\s*(===|!==|>|<|>=|<=)\s*(.+)/);
      if (match) {
        const [, taskId, field, operator, valueStr] = match;
        const actual = outputs[taskId]?.[field];
        const expected = JSON.parse(valueStr);

        switch (operator) {
          case '===': return actual === expected;
          case '!==': return actual !== expected;
          case '>': return actual > expected;
          case '<': return actual < expected;
          case '>=': return actual >= expected;
          case '<=': return actual <= expected;
        }
      }

      console.warn(`[Orchestrator] Could not evaluate expression: ${expr}`);
      return true;
    } catch (error) {
      console.error(`[Orchestrator] Expression evaluation error: ${error}`);
      return true;
    }
  }

  // ============================================
  // TASK EXECUTION
  // ============================================

  /**
   * Check if task dependencies are complete
   */
  private areDependenciesComplete(task: AgentTask): boolean {
    return task.dependencies.every(depId => {
      const dep = this.tasks.get(depId);
      return dep?.status === 'completed';
    });
  }

  /**
   * Get tasks ready to run (sorted by priority)
   */
  private getReadyTasks(): AgentTask[] {
    const ready: AgentTask[] = [];

    for (const task of this.tasks.values()) {
      if (
        task.status === 'pending' &&
        this.areDependenciesComplete(task) &&
        this.checkCondition(task)
      ) {
        ready.push(task);
      }
    }

    // Sort by priority (higher first)
    return ready.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Execute a single task with retry support
   */
  private async executeTask(task: AgentTask): Promise<void> {
    const startTime = Date.now();
    task.startedAt = new Date().toISOString();

    // Log task start
    await this.logAuditEvent('agent_task_started', 'success', {
      taskId: task.id,
      agentRole: task.role,
      inputs: task.inputs,
      attempt: task.retryCount + 1,
    });

    // Update task status
    task.status = 'running';
    this.notifyTaskUpdate(task);

    // Update agent state
    const agentState = this.agentStates.get(task.role)!;
    agentState.state = 'active';
    agentState.currentTask = task.id;
    this.notifyAgentUpdate(agentState);

    try {
      // Resolve inputs at execution time
      const resolvedInputs = this.resolveTaskInputs(task);
      task.inputs = resolvedInputs;

      // Execute agent
      const result = await this.executeAgent(task);

      // Update task with result
      task.outputs = result;
      task.status = 'completed';
      task.completedAt = new Date().toISOString();

      // Update agent metrics
      const latency = Date.now() - startTime;
      agentState.metrics.tasksCompleted++;
      agentState.metrics.averageLatency =
        (agentState.metrics.averageLatency * (agentState.metrics.tasksCompleted - 1) + latency) /
        agentState.metrics.tasksCompleted;

      agentState.state = 'idle';
      agentState.currentTask = undefined;

      // Log task completion
      await this.logAuditEvent('agent_task_completed', 'success', {
        taskId: task.id,
        agentRole: task.role,
        latencyMs: latency,
        outputs: task.outputs,
      });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      task.lastError = errorMsg;

      // Try to retry
      const willRetry = await this.scheduleRetry(task, errorMsg);

      if (!willRetry) {
        task.status = 'failed';
        task.completedAt = new Date().toISOString();

        // Update error metrics
        agentState.metrics.tasksFailed++;
        agentState.metrics.errorRate =
          agentState.metrics.tasksFailed /
          (agentState.metrics.tasksCompleted + agentState.metrics.tasksFailed);
        agentState.state = 'error';
        agentState.currentTask = undefined;

        // Log task failure
        await this.logAuditEvent('agent_task_failed', 'failure', {
          taskId: task.id,
          agentRole: task.role,
          error: errorMsg,
          retryCount: task.retryCount,
        });
      }
    }

    this.notifyTaskUpdate(task);
    this.notifyAgentUpdate(agentState);
  }

  /**
   * Agent execution via LLM proxy
   */
  private async executeAgent(task: AgentTask): Promise<Record<string, unknown>> {
    const prompt = this.buildPromptForAgent(task);
    const systemPrompt = this.getSystemPromptForAgent(task.role);

    try {
      const { supabase } = await import('../../../src/integrations/supabase/client');

      console.log(`[Orchestrator] Invoking ${task.role} (attempt ${task.retryCount + 1})...`);
      const startTime = Date.now();

      const { data, error } = await supabase.functions.invoke('llm-proxy', {
        body: {
          agentRole: task.role,
          prompt,
          systemPrompt,
          taskId: task.id,
          context: this.buildExecutionContext(task),
        }
      });

      const llmLatency = Date.now() - startTime;

      if (error) {
        console.error(`[Orchestrator] Error from ${task.role}:`, error);
        await this.logAuditEvent('llm_call_failed', 'failure', {
          taskId: task.id,
          agentRole: task.role,
          error: error.message,
          latencyMs: llmLatency,
        });
        throw error;
      }

      console.log(`[Orchestrator] ✅ ${task.role} completed in ${data.usage?.latencyMs || llmLatency}ms`);

      // Update agent cost metrics
      const agentState = this.agentStates.get(task.role);
      if (agentState && data.usage) {
        agentState.metrics.totalTokensUsed += (data.usage.tokensInput || 0) + (data.usage.tokensOutput || 0);
        agentState.metrics.estimatedCost += data.usage.estimatedCost || 0;
      }

      const parsedResult = this.parseAgentResponse(task.role, data.result);

      // Log LLM call success
      await this.logAuditEvent('llm_call_success', 'success', {
        taskId: task.id,
        agentRole: task.role,
        provider: data.usage?.provider,
        model: data.usage?.model,
        tokensInput: data.usage?.tokensInput,
        tokensOutput: data.usage?.tokensOutput,
        latencyMs: llmLatency,
        estimatedCost: data.usage?.estimatedCost,
      });

      // Check if agent returned a blocker
      if (parsedResult.blocker) {
        const b = parsedResult.blocker as any;
        this.createBlocker(
          task,
          b.context || 'Agent requested human input',
          b.hypothesis || 'Clarification needed',
          b.options || ['Proceed', 'Cancel'],
          b.requestedRoles || ['A0_orchestrator'],
          b.priority || 'medium'
        );
        throw new Error('Task blocked - awaiting resolution');
      }

      // If agent returned code, execute it in sandbox
      if (parsedResult.code && typeof parsedResult.code === 'string') {
        console.log(`[Orchestrator] ${task.role} generated code, executing in sandbox...`);
        const executionResult = await this.executeGeneratedCode(
          parsedResult.code,
          task.role
        );
        parsedResult.executionResult = executionResult;
      }

      return parsedResult;
    } catch (error) {
      console.error(`[Orchestrator] ❌ ${task.role} failed:`, error);
      throw error;
    }
  }

  /**
   * Build execution context for agent
   */
  private buildExecutionContext(task: AgentTask): ExecutionContext {
    const previousOutputs: Record<string, Record<string, unknown>> = {};
    this.tasks.forEach((t, id) => {
      if (t.outputs) {
        previousOutputs[id] = t.outputs;
      }
    });

    const agentState = this.agentStates.get(task.role);

    return {
      workflowId: this.workflowId,
      workflowName: this.workflowName,
      taskId: task.id,
      attempt: task.retryCount + 1,
      variables: this.variables,
      previousOutputs,
      blockers: agentState?.blockers || [],
    };
  }

  /**
   * Execute agent-generated code in sandboxed environment
   */
  private async executeGeneratedCode(
    code: string,
    agentRole: AgentRole
  ): Promise<Record<string, unknown>> {
    try {
      const { supabase } = await import('../../../src/integrations/supabase/client');

      const { data, error } = await supabase.functions.invoke('execute-code', {
        body: {
          code,
          language: 'typescript',
          timeoutMs: 5000,
          memoryLimitMb: 128,
          agentRole,
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return data;
    } catch (error: any) {
      return { success: false, error: error.message || String(error) };
    }
  }

  private buildPromptForAgent(task: AgentTask): string {
    const context = JSON.stringify(task.inputs, null, 2);
    const previousOutputs = Array.from(this.tasks.values())
      .filter(t => task.dependencies.includes(t.id) && t.outputs)
      .map(t => `${t.role}: ${JSON.stringify(t.outputs, null, 2)}`)
      .join('\n\n');

    return `Execute your role as ${task.role}.

## Task ID: ${task.id}
## Attempt: ${task.retryCount + 1}

## Context:
${context}

${previousOutputs ? `## Previous Agent Outputs:\n${previousOutputs}` : ''}

## Instructions:
- Provide your output in structured JSON format
- If you encounter a blocker, return: { "blocker": { "context": "...", "hypothesis": "...", "options": [...], "requestedRoles": [...] } }
- If you generate code, include it in a "code" field
- Be precise and complete`;
  }

  private getSystemPromptForAgent(role: AgentRole): string {
    // Priority: Active Agent Profile > Custom Agent > Built-in Agent
    if (typeof window !== 'undefined') {
      try {
        // Check active profile
        const activeProfileId = localStorage.getItem('lumen_active_agent_profile');
        if (activeProfileId) {
          const profilesData = localStorage.getItem('lumen_agent_profiles');
          if (profilesData) {
            const profiles = JSON.parse(profilesData);
            const activeProfile = profiles.find((p: any) => p.id === activeProfileId);
            if (activeProfile?.systemPrompt) {
              return activeProfile.systemPrompt;
            }
          }
        }

        // Check custom agent
        const customAgents = localStorage.getItem('lumen_custom_agents');
        if (customAgents) {
          const agents = JSON.parse(customAgents);
          const customAgent = agents.find((a: any) => a.role === role || a.id === role);
          if (customAgent?.systemPrompt) {
            return customAgent.systemPrompt;
          }
        }
      } catch (error) {
        console.warn('[Orchestrator] Failed to load custom prompt:', error);
      }
    }

    // Built-in agent prompts
    const prompts: Record<string, string> = {
      'A0_orchestrator': 'You coordinate DAG execution and manage task dependencies. Return JSON with execution status.',
      'A1_spec': 'You are a requirements analyzer. Parse natural language into formal, testable specifications. Return JSON: {specification: string, requirements: [], testable: boolean, acceptanceCriteria: []}',
      'A2_architect': 'You are a system architect. Design component hierarchies, data flows, and patterns. Return JSON: {architecture: string, components: [], dataFlow: [], contracts: []}',
      'A3_codegen_a': 'You are Code Generator A. Write clean TypeScript/React code. Return JSON: {code: string, tests: [], dependencies: []}',
      'A4_codegen_b': 'You are Code Generator B. Write an alternative implementation. Return JSON: {code: string, tests: [], dependencies: []}',
      'A5_adjudicator': 'You compare implementations and merge the best solution. Return JSON: {chosen: "A"|"B"|"merged", mergedCode: string, rationale: string}',
      'A6_qa_harness': 'You generate comprehensive tests. Return JSON: {unitTests: [], integrationTests: [], coverage: number, mutationScore: number}',
      'A7_evidence': 'You compile evidence bundles. Return JSON: {bundleId: string, artifacts: [], fTotal: number, passed: boolean}',
      'A8_performance': 'You measure performance. Return JSON: {latencyP50: number, latencyP99: number, throughput: number, memoryMb: number}',
      'A9_security': 'You audit security. Return JSON: {vulnerabilities: [], owaspChecks: {}, rlsValidated: boolean, sbom: {}}',
      'A10_incident': 'You handle incidents. Return JSON: {rootCause: string, timeline: [], recommendations: [], postmortem: string}',
    };

    return prompts[role] || 'You are an AI agent in the Lumen Orca orchestration system. Complete your task with precision and return structured JSON output.';
  }

  private parseAgentResponse(role: AgentRole, rawResponse: string): Record<string, unknown> {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = rawResponse.match(/```(?:json)?\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      // Try direct JSON parse
      return JSON.parse(rawResponse);
    } catch {
      console.warn(`[Parser] Could not parse JSON from ${role}, using raw response`);
      return { raw: rawResponse, parsed: false };
    }
  }

  // ============================================
  // MAIN EXECUTION LOOP
  // ============================================

  async execute(): Promise<void> {
    if (this.running) {
      throw new Error('Orchestrator already running');
    }

    this.running = true;
    this.paused = false;

    await this.logAuditEvent('orchestrator_started', 'success', {
      workflowId: this.workflowId,
      workflowName: this.workflowName,
      totalTasks: this.tasks.size,
    });

    try {
      while (this.hasIncompleteTasks() && !this.paused) {
        const readyTasks = this.getReadyTasks();
        const batch = readyTasks.slice(0, this.maxParallelTasks);

        if (batch.length === 0) {
          // Check for blocked tasks
          const blocked = Array.from(this.tasks.values()).filter(t => t.status === 'blocked');
          const retrying = Array.from(this.tasks.values()).filter(t => t.status === 'retrying');

          if (blocked.length > 0) {
            console.log(`[Orchestrator] ${blocked.length} tasks blocked, waiting for resolution...`);
          }

          if (retrying.length > 0) {
            // Wait for retries
            await new Promise(resolve => setTimeout(resolve, 100));
            continue;
          }

          const pending = Array.from(this.tasks.values()).filter(t => t.status === 'pending');
          if (pending.length > 0 && blocked.length === 0 && retrying.length === 0) {
            throw new Error('DAG execution blocked - no tasks can proceed');
          }

          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }

        await Promise.all(batch.map(task => this.executeTask(task)));
      }

      const stats = this.getState().stats;
      await this.logAuditEvent('orchestrator_completed', 'success', {
        workflowId: this.workflowId,
        ...stats,
      });

    } catch (error) {
      await this.logAuditEvent('orchestrator_failed', 'failure', {
        workflowId: this.workflowId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    } finally {
      this.running = false;
    }
  }

  /**
   * Pause execution
   */
  pause(): void {
    this.paused = true;
    console.log('[Orchestrator] Execution paused');
  }

  /**
   * Resume execution
   */
  resume(): void {
    if (this.paused && this.running) {
      this.paused = false;
      console.log('[Orchestrator] Execution resumed');
    }
  }

  private hasIncompleteTasks(): boolean {
    return Array.from(this.tasks.values()).some(
      t => ['pending', 'running', 'retrying', 'blocked'].includes(t.status)
    );
  }

  // ============================================
  // STATE & UTILITIES
  // ============================================

  getState() {
    const tasks = Array.from(this.tasks.values());
    return {
      workflowId: this.workflowId,
      workflowName: this.workflowName,
      tasks,
      agents: Array.from(this.agentStates.values()),
      messages: this.messages,
      running: this.running,
      paused: this.paused,
      stats: {
        total: tasks.length,
        pending: tasks.filter(t => t.status === 'pending').length,
        running: tasks.filter(t => t.status === 'running').length,
        completed: tasks.filter(t => t.status === 'completed').length,
        failed: tasks.filter(t => t.status === 'failed').length,
        blocked: tasks.filter(t => t.status === 'blocked').length,
        retrying: tasks.filter(t => t.status === 'retrying').length,
      },
      totalCost: Array.from(this.agentStates.values()).reduce(
        (sum, agent) => sum + agent.metrics.estimatedCost,
        0
      ),
    };
  }

  reset(): void {
    this.tasks.clear();
    this.messages = [];
    this.running = false;
    this.paused = false;
    this.workflowId = `wf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    this.workflowName = '';
    this.variables = {};
    this.initializeAgentStates();
  }

  private async logAuditEvent(
    eventType: string,
    eventStatus: 'success' | 'failure',
    eventDetails: Record<string, unknown>
  ): Promise<void> {
    try {
      const { logAuditEvent } = await import('../../../src/lib/audit-logger');
      await logAuditEvent({ eventType, eventStatus, eventDetails });
    } catch (err) {
      console.error('Failed to log audit event:', err);
    }
  }
}

// Export singleton for convenience
let orchestratorInstance: Orchestrator | null = null;

export function getOrchestrator(): Orchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new Orchestrator();
  }
  return orchestratorInstance;
}

export function resetOrchestrator(): Orchestrator {
  orchestratorInstance = new Orchestrator();
  return orchestratorInstance;
}
