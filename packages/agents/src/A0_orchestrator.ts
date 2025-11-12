/**
 * A0: Orchestrator
 * Role: DAG coordinator, task scheduler, execution engine
 * Inputs: Master prompt YAML
 * Outputs: Task graph with dependencies + live execution state
 * Quality: Validates graph acyclicity, resource constraints, parallel execution
 */

import type { AgentTask, AgentStatus, AgentRole } from './types';

type TaskEventCallback = (task: AgentTask) => void;
type AgentEventCallback = (status: AgentStatus) => void;

export class Orchestrator {
  private tasks: Map<string, AgentTask> = new Map();
  private agentStates: Map<AgentRole, AgentStatus> = new Map();
  private running: boolean = false;
  private maxParallelTasks: number = 4;
  private taskListeners: Set<TaskEventCallback> = new Set();
  private agentListeners: Set<AgentEventCallback> = new Set();

  constructor() {
    this.initializeAgentStates();
  }

  // Initialize all agent states (built-in + custom agents)
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
        metrics: {
          tasksCompleted: 0,
          averageLatency: 0,
          errorRate: 0
        }
      });
    });
  }

  // Event subscription for live updates
  onTaskUpdate(callback: TaskEventCallback): () => void {
    this.taskListeners.add(callback);
    return () => this.taskListeners.delete(callback);
  }

  onAgentUpdate(callback: AgentEventCallback): () => void {
    this.agentListeners.add(callback);
    return () => this.agentListeners.delete(callback);
  }

  private notifyTaskUpdate(task: AgentTask): void {
    this.taskListeners.forEach(cb => cb(task));
  }

  private notifyAgentUpdate(status: AgentStatus): void {
    this.agentListeners.forEach(cb => cb(status));
  }

  // Add task with validation
  addTask(task: AgentTask): void {
    if (this.hasCircularDependency(task)) {
      throw new Error(`Circular dependency detected for task ${task.id}`);
    }
    this.tasks.set(task.id, task);
    this.notifyTaskUpdate(task);
  }

  // Circular dependency detection
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

  // Get topological execution order
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
    return sorted;
  }

  // Check if task dependencies are complete
  private areDependenciesComplete(task: AgentTask): boolean {
    return task.dependencies.every(depId => {
      const dep = this.tasks.get(depId);
      return dep?.status === 'completed';
    });
  }

  // Get tasks ready to run
  private getReadyTasks(): AgentTask[] {
    const ready: AgentTask[] = [];
    
    for (const task of this.tasks.values()) {
      if (task.status === 'pending' && this.areDependenciesComplete(task)) {
        ready.push(task);
      }
    }

    return ready;
  }

  // Execute a single task
  private async executeTask(task: AgentTask): Promise<void> {
    const startTime = Date.now();
    
    // Log task start
    try {
      const { logAuditEvent } = await import('../../../src/lib/audit-logger');
      await logAuditEvent({
        eventType: 'agent_task_started',
        eventStatus: 'success',
        eventDetails: {
          taskId: task.id,
          agentRole: task.role,
          inputs: task.inputs
        }
      });
    } catch (err) {
      console.error('Failed to log task start:', err);
    }
    
    // Update task status
    task.status = 'running';
    this.notifyTaskUpdate(task);

    // Update agent state
    const agentState = this.agentStates.get(task.role)!;
    agentState.state = 'active';
    agentState.currentTask = task.id;
    this.notifyAgentUpdate(agentState);

    try {
      // Simulate agent execution (replace with real agent calls)
      const result = await this.executeAgent(task);
      
      // Update task with result
      task.outputs = result;
      task.status = 'completed';
      
      // Update agent metrics
      const latency = Date.now() - startTime;
      agentState.metrics.tasksCompleted++;
      agentState.metrics.averageLatency = 
        (agentState.metrics.averageLatency * (agentState.metrics.tasksCompleted - 1) + latency) / 
        agentState.metrics.tasksCompleted;
      
      agentState.state = 'idle';
      agentState.currentTask = undefined;

      // Log task completion
      try {
        const { logAuditEvent } = await import('../../../src/lib/audit-logger');
        await logAuditEvent({
          eventType: 'agent_task_completed',
          eventStatus: 'success',
          eventDetails: {
            taskId: task.id,
            agentRole: task.role,
            latencyMs: latency,
            outputs: task.outputs
          }
        });
      } catch (err) {
        console.error('Failed to log task completion:', err);
      }
      
    } catch (error) {
      task.status = 'failed';
      
      // Update error metrics
      const totalTasks = agentState.metrics.tasksCompleted + 1;
      const previousErrors = agentState.metrics.errorRate * agentState.metrics.tasksCompleted;
      agentState.metrics.errorRate = (previousErrors + 1) / totalTasks;
      agentState.metrics.tasksCompleted++;
      agentState.state = 'error';
      agentState.currentTask = undefined;

      // Log task failure
      try {
        const { logAuditEvent } = await import('../../../src/lib/audit-logger');
        await logAuditEvent({
          eventType: 'agent_task_failed',
          eventStatus: 'failure',
          eventDetails: {
            taskId: task.id,
            agentRole: task.role,
            error: error instanceof Error ? error.message : String(error)
          }
        });
      } catch (err) {
        console.error('Failed to log task failure:', err);
      }
    }

    this.notifyTaskUpdate(task);
    this.notifyAgentUpdate(agentState);
  }

  // Agent execution via LLM proxy with optional code execution
  private async executeAgent(task: AgentTask): Promise<Record<string, unknown>> {
    const prompt = this.buildPromptForAgent(task);
    const systemPrompt = this.getSystemPromptForAgent(task.role);

    try {
      // Dynamic import to avoid circular dependencies
      const { supabase } = await import('../../../src/integrations/supabase/client');
      
      console.log(`[Orchestrator] Invoking ${task.role}...`);
      const startTime = Date.now();
      const { data, error } = await supabase.functions.invoke('llm-proxy', {
        body: {
          agentRole: task.role,
          prompt,
          systemPrompt,
          taskId: task.id,
        }
      });
      const llmLatency = Date.now() - startTime;

      if (error) {
        console.error(`[Orchestrator] Error from ${task.role}:`, error);

        // Log LLM call failure
        try {
          const { logAuditEvent } = await import('../../../src/lib/audit-logger');
          await logAuditEvent({
            eventType: 'llm_call_failed',
            eventStatus: 'failure',
            eventDetails: {
              taskId: task.id,
              agentRole: task.role,
              error: error.message,
              latencyMs: llmLatency
            }
          });
        } catch (err) {
          console.error('Failed to log LLM call failure:', err);
        }
        
        throw error;
      }

      console.log(`[Orchestrator] ✅ ${task.role} completed in ${data.usage.latencyMs}ms`);
      
      const parsedResult = this.parseAgentResponse(task.role, data.result);

      // Log LLM call success
      try {
        const { logAuditEvent } = await import('../../../src/lib/audit-logger');
        await logAuditEvent({
          eventType: 'llm_call_success',
          eventStatus: 'success',
          eventDetails: {
            taskId: task.id,
            agentRole: task.role,
            provider: data.usage?.provider,
            model: data.usage?.model,
            tokensInput: data.usage?.tokensInput,
            tokensOutput: data.usage?.tokensOutput,
            latencyMs: llmLatency,
            estimatedCost: data.usage?.estimatedCost
          }
        });
      } catch (err) {
        console.error('Failed to log LLM call success:', err);
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

      // Log LLM call failure
      try {
        const { logAuditEvent } = await import('../../../src/lib/audit-logger');
        await logAuditEvent({
          eventType: 'llm_call_failed',
          eventStatus: 'failure',
          eventDetails: {
            taskId: task.id,
            agentRole: task.role,
            error: error instanceof Error ? error.message : String(error)
          }
        });
      } catch (err) {
        console.error('Failed to log LLM call failure:', err);
      }

      throw error;
    }
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
        return {
          success: false,
          error: error.message,
        };
      }

      return data;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || String(error),
      };
    }
  }

  private buildPromptForAgent(task: AgentTask): string {
    const context = JSON.stringify(task.inputs, null, 2);
    return `Execute your role as ${task.role}.\n\nContext:\n${context}\n\nProvide your output in structured JSON format that matches your role's responsibilities.`;
  }

  private getSystemPromptForAgent(role: AgentRole): string {
    // Priority: Active Agent Profile > Custom Agent > Built-in Agent
    
    // Check for active agent profile first
    if (typeof window !== 'undefined') {
      try {
        const activeProfileId = localStorage.getItem('lumen_active_agent_profile');
        if (activeProfileId) {
          const profilesData = localStorage.getItem('lumen_agent_profiles');
          if (profilesData) {
            const profiles = JSON.parse(profilesData);
            const activeProfile = profiles.find((p: any) => p.id === activeProfileId);
            if (activeProfile?.systemPrompt) {
              console.log(`[Orchestrator] Using agent profile prompt for ${role}`);
              return activeProfile.systemPrompt;
            }
          }
        }
      } catch (error) {
        console.warn('[Orchestrator] Failed to load agent profile:', error);
      }

      // Check for custom agent definition
      try {
        const customAgents = localStorage.getItem('lumen_custom_agents');
        if (customAgents) {
          const agents = JSON.parse(customAgents);
          const customAgent = agents.find((a: any) => a.role === role || a.id === role);
          if (customAgent?.systemPrompt) {
            console.log(`[Orchestrator] Using custom agent prompt for ${role}`);
            return customAgent.systemPrompt;
          }
        }
      } catch (error) {
        console.warn('[Orchestrator] Failed to load custom agent:', error);
      }
    }

    // Built-in agent prompts
    const prompts: Record<AgentRole, string> = {
      'A0_orchestrator': 'You coordinate DAG execution and manage task dependencies.',
      'A1_spec': 'You are a requirements analyzer. Parse natural language requirements into formal, testable specifications. Return JSON with: {specification: string, requirements: any, testable: boolean}',
      'A2_architect': 'You are a system architect. Design component hierarchies, data flows, and architectural patterns. Return JSON with: {architecture: string, layers: number}',
      'A3_codegen_a': 'You are a code generator (Path A). Write clean, tested TypeScript/React code. Return JSON with: {code: string, tests: any[]}',
      'A4_codegen_b': 'You are a code generator (Path B). Write clean, tested TypeScript/React code independently from Path A. Return JSON with: {code: string, tests: any[]}',
      'A5_adjudicator': 'You are a code adjudicator. Compare two implementations, identify conflicts, and merge the best solution. Return JSON with: {chosen: string, rationale: string}',
      'A6_qa_harness': 'You are a QA engineer. Generate comprehensive tests: unit, integration, mutation, property-based. Return JSON with: {coverage: number, mutation: number, passed: boolean}',
      'A7_evidence': 'You are an evidence reporter. Compile execution results into structured evidence bundles. Return JSON with: {bundleUrl: string}',
      'A8_performance': 'You are a performance analyst. Measure latency, throughput, and resource usage. Return JSON with: {latency: number, throughput: number}',
      'A9_security': 'You are a security auditor. Scan for vulnerabilities, validate RLS policies, check OWASP top 10. Return JSON with: {vulnerabilities: any[], passed: boolean}',
      'A10_incident': 'You are an incident responder. Analyze failures, recommend fixes, and generate postmortems. Return JSON with: {analysis: string, recommendations: any[]}',
    };
    return prompts[role] || 'You are an AI agent in the Lumen Orca orchestration system. Complete your assigned task with precision and return structured JSON output.';
  }

  private parseAgentResponse(role: AgentRole, rawResponse: string): Record<string, unknown> {
    try {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = rawResponse.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      // Try direct JSON parse
      return JSON.parse(rawResponse);
    } catch {
      // Fallback to structured text parsing
      console.warn(`[Parser] Could not parse JSON from ${role}, using raw response`);
      return { raw: rawResponse, parsed: false };
    }
  }

  // Main execution loop
  async execute(): Promise<void> {
    if (this.running) {
      throw new Error('Orchestrator already running');
    }

    this.running = true;

    // Log orchestrator start
    try {
      const { logAuditEvent } = await import('../../../src/lib/audit-logger');
      await logAuditEvent({
        eventType: 'orchestrator_started',
        eventStatus: 'success',
        eventDetails: {
          totalTasks: this.tasks.size,
          timestamp: new Date().toISOString()
        }
      });
    } catch (err) {
      console.error('Failed to log orchestrator start:', err);
    }

    try {
      while (this.hasIncompleteTasks()) {
        const readyTasks = this.getReadyTasks();
        
        // Execute tasks in parallel (up to maxParallelTasks)
        const batch = readyTasks.slice(0, this.maxParallelTasks);
        
        if (batch.length === 0) {
          // Check for blocked tasks
          const blocked = Array.from(this.tasks.values()).filter(
            t => t.status === 'pending' && !this.areDependenciesComplete(t)
          );
          
          if (blocked.length > 0 && readyTasks.length === 0) {
            // Circular dependency or all tasks blocked
            throw new Error('DAG execution blocked - no tasks can proceed');
          }
          
          // Wait a bit before checking again
          await new Promise(resolve => setTimeout(resolve, 100));
          continue;
        }

        await Promise.all(batch.map(task => this.executeTask(task)));
      }

      // Log orchestrator completion
      try {
        const { logAuditEvent } = await import('../../../src/lib/audit-logger');
        await logAuditEvent({
          eventType: 'orchestrator_completed',
          eventStatus: 'success',
          eventDetails: {
            totalTasks: this.tasks.size,
            completedTasks: Array.from(this.tasks.values()).filter(t => t.status === 'completed').length,
            failedTasks: Array.from(this.tasks.values()).filter(t => t.status === 'failed').length
          }
        });
      } catch (err) {
        console.error('Failed to log orchestrator completion:', err);
      }
    } catch (error) {
      // Log orchestrator failure
      try {
        const { logAuditEvent } = await import('../../../src/lib/audit-logger');
        await logAuditEvent({
          eventType: 'orchestrator_failed',
          eventStatus: 'failure',
          eventDetails: {
            error: error instanceof Error ? error.message : String(error),
            incompleteTasks: Array.from(this.tasks.values()).filter(t => t.status === 'pending' || t.status === 'running').length
          }
        });
      } catch (err) {
        console.error('Failed to log orchestrator failure:', err);
      }
      throw error;
    } finally {
      this.running = false;
    }
  }

  // Check if there are incomplete tasks
  private hasIncompleteTasks(): boolean {
    return Array.from(this.tasks.values()).some(
      t => t.status === 'pending' || t.status === 'running'
    );
  }

  // Get current state snapshot
  getState() {
    return {
      tasks: Array.from(this.tasks.values()),
      agents: Array.from(this.agentStates.values()),
      running: this.running,
      stats: {
        total: this.tasks.size,
        pending: Array.from(this.tasks.values()).filter(t => t.status === 'pending').length,
        running: Array.from(this.tasks.values()).filter(t => t.status === 'running').length,
        completed: Array.from(this.tasks.values()).filter(t => t.status === 'completed').length,
        failed: Array.from(this.tasks.values()).filter(t => t.status === 'failed').length,
      }
    };
  }

  // Reset orchestrator
  reset(): void {
    this.tasks.clear();
    this.running = false;
    this.initializeAgentStates();
  }
}
