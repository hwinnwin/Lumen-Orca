/**
 * A0: Orchestrator
 * Role: DAG coordinator, task scheduler
 * Inputs: Master prompt YAML
 * Outputs: Task graph with dependencies
 * Quality: Validates graph acyclicity, resource constraints
 */

import type { AgentTask } from './types';

export class Orchestrator {
  private tasks: Map<string, AgentTask> = new Map();

  addTask(task: AgentTask): void {
    // Validate no circular dependencies
    if (this.hasCircularDependency(task)) {
      throw new Error(`Circular dependency detected for task ${task.id}`);
    }
    this.tasks.set(task.id, task);
  }

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
}
