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

  // Initialize all agent states
  private initializeAgentStates(): void {
    const roles: AgentRole[] = [
      'A0_orchestrator', 'A1_spec', 'A2_architect', 
      'A3_codegen_a', 'A4_codegen_b', 'A5_adjudicator',
      'A6_qa_harness', 'A7_evidence', 'A8_performance',
      'A9_security', 'A10_incident'
    ];

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
      
    } catch (error) {
      task.status = 'failed';
      
      // Update error metrics
      const totalTasks = agentState.metrics.tasksCompleted + 1;
      const previousErrors = agentState.metrics.errorRate * agentState.metrics.tasksCompleted;
      agentState.metrics.errorRate = (previousErrors + 1) / totalTasks;
      agentState.metrics.tasksCompleted++;
      agentState.state = 'error';
      agentState.currentTask = undefined;
    }

    this.notifyTaskUpdate(task);
    this.notifyAgentUpdate(agentState);
  }

  // Stub agent execution (to be replaced with real implementations)
  private async executeAgent(task: AgentTask): Promise<Record<string, unknown>> {
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Return mock output based on role
    switch (task.role) {
      case 'A1_spec':
        return { specification: 'Formal spec document', validated: true };
      case 'A2_architect':
        return { architecture: 'System design', diagrams: ['arch.svg'] };
      case 'A3_codegen_a':
      case 'A4_codegen_b':
        return { code: 'Generated code', tests: ['test.spec.ts'] };
      case 'A5_adjudicator':
        return { verdict: 'merged', conflicts: [] };
      case 'A6_qa_harness':
        return { mutationScore: 0.85, coverage: 0.96, passed: true };
      case 'A7_evidence':
        return { bundle: 'evidence-bundle.html', fTotal: 1e-7 };
      default:
        return { result: 'success' };
    }
  }

  // Main execution loop
  async execute(): Promise<void> {
    if (this.running) {
      throw new Error('Orchestrator already running');
    }

    this.running = true;

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
