/**
 * Workflow YAML/JSON Parser
 * Converts workflow definitions to executable DAGs
 */

import type { WorkflowDefinition, WorkflowTask, RetryConfig, TaskCondition } from '../../packages/agents/src/types';
import { DEFAULT_RETRY_CONFIG } from '../../packages/agents/src/types';

/**
 * Parse workflow from YAML string (uses JSON for now, can add YAML lib later)
 */
export function parseWorkflow(input: string): WorkflowDefinition {
  try {
    // Try JSON first
    const parsed = JSON.parse(input);
    return validateWorkflow(parsed);
  } catch (jsonError) {
    // Try simple YAML-like parsing for basic workflows
    try {
      return parseSimpleYaml(input);
    } catch (yamlError) {
      throw new Error(`Failed to parse workflow: ${jsonError}`);
    }
  }
}

/**
 * Validate workflow definition
 */
function validateWorkflow(data: any): WorkflowDefinition {
  if (!data.name) throw new Error('Workflow must have a name');
  if (!data.version) throw new Error('Workflow must have a version');
  if (!data.tasks || !Array.isArray(data.tasks)) throw new Error('Workflow must have tasks array');
  if (data.tasks.length === 0) throw new Error('Workflow must have at least one task');

  // Validate each task
  const taskIds = new Set<string>();
  for (const task of data.tasks) {
    if (!task.id) throw new Error('Each task must have an id');
    if (!task.agent) throw new Error(`Task ${task.id} must have an agent`);
    if (taskIds.has(task.id)) throw new Error(`Duplicate task id: ${task.id}`);
    taskIds.add(task.id);

    // Validate dependencies exist
    if (task.dependsOn) {
      for (const dep of task.dependsOn) {
        if (!data.tasks.some((t: any) => t.id === dep)) {
          throw new Error(`Task ${task.id} depends on unknown task: ${dep}`);
        }
      }
    }
  }

  // Check for circular dependencies
  if (hasCircularDependencies(data.tasks)) {
    throw new Error('Workflow contains circular dependencies');
  }

  return data as WorkflowDefinition;
}

/**
 * Check for circular dependencies using DFS
 */
function hasCircularDependencies(tasks: WorkflowTask[]): boolean {
  const taskMap = new Map<string, WorkflowTask>();
  tasks.forEach(t => taskMap.set(t.id, t));

  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function dfs(taskId: string): boolean {
    if (recursionStack.has(taskId)) return true;
    if (visited.has(taskId)) return false;

    visited.add(taskId);
    recursionStack.add(taskId);

    const task = taskMap.get(taskId);
    if (task?.dependsOn) {
      for (const dep of task.dependsOn) {
        if (dfs(dep)) return true;
      }
    }

    recursionStack.delete(taskId);
    return false;
  }

  for (const task of tasks) {
    if (dfs(task.id)) return true;
  }

  return false;
}

/**
 * Simple YAML-like parser for basic workflows
 * Supports a subset of YAML syntax
 */
function parseSimpleYaml(input: string): WorkflowDefinition {
  const lines = input.split('\n');
  const workflow: Partial<WorkflowDefinition> = {
    tasks: [],
  };

  let currentTask: Partial<WorkflowTask> | null = null;
  let inTasks = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Top-level properties
    if (trimmed.startsWith('name:')) {
      workflow.name = trimmed.slice(5).trim().replace(/['"]/g, '');
    } else if (trimmed.startsWith('version:')) {
      workflow.version = trimmed.slice(8).trim().replace(/['"]/g, '');
    } else if (trimmed.startsWith('description:')) {
      workflow.description = trimmed.slice(12).trim().replace(/['"]/g, '');
    } else if (trimmed === 'tasks:') {
      inTasks = true;
    } else if (inTasks && trimmed.startsWith('- id:')) {
      // New task
      if (currentTask && currentTask.id && currentTask.agent) {
        workflow.tasks!.push(currentTask as WorkflowTask);
      }
      currentTask = {
        id: trimmed.slice(5).trim().replace(/['"]/g, ''),
        inputs: {},
      };
    } else if (currentTask) {
      // Task properties
      if (trimmed.startsWith('agent:')) {
        currentTask.agent = trimmed.slice(6).trim().replace(/['"]/g, '');
      } else if (trimmed.startsWith('name:')) {
        currentTask.name = trimmed.slice(5).trim().replace(/['"]/g, '');
      } else if (trimmed.startsWith('priority:')) {
        currentTask.priority = parseInt(trimmed.slice(9).trim(), 10);
      } else if (trimmed.startsWith('dependsOn:')) {
        const deps = trimmed.slice(10).trim();
        if (deps.startsWith('[')) {
          currentTask.dependsOn = JSON.parse(deps);
        }
      }
    }
  }

  // Add last task
  if (currentTask && currentTask.id && currentTask.agent) {
    workflow.tasks!.push(currentTask as WorkflowTask);
  }

  return validateWorkflow(workflow);
}

/**
 * Create a workflow definition programmatically
 */
export function createWorkflow(
  name: string,
  version: string,
  tasks: Partial<WorkflowTask>[]
): WorkflowDefinition {
  const fullTasks: WorkflowTask[] = tasks.map((t, i) => ({
    id: t.id || `task_${i}`,
    agent: t.agent || 'A1_spec',
    inputs: t.inputs || {},
    dependsOn: t.dependsOn || [],
    condition: t.condition,
    retry: t.retry,
    timeout: t.timeout,
    priority: t.priority || 0,
    onBlocker: t.onBlocker || 'escalate',
    name: t.name,
  }));

  return {
    name,
    version,
    tasks: fullTasks,
  };
}

/**
 * Pre-built workflow templates
 */
export const WORKFLOW_TEMPLATES = {
  // Standard development workflow
  fullPipeline: createWorkflow('Full Development Pipeline', '1.0.0', [
    {
      id: 'spec',
      agent: 'A1_spec',
      name: 'Requirements Analysis',
      inputs: { requirement: '$vars.requirement' },
      priority: 10,
    },
    {
      id: 'arch',
      agent: 'A2_architect',
      name: 'Architecture Design',
      inputs: '$tasks.spec.outputs',
      dependsOn: ['spec'],
      priority: 9,
    },
    {
      id: 'codegen_a',
      agent: 'A3_codegen_a',
      name: 'Implementation A',
      inputs: '$tasks.arch.outputs',
      dependsOn: ['arch'],
      priority: 8,
    },
    {
      id: 'codegen_b',
      agent: 'A4_codegen_b',
      name: 'Implementation B',
      inputs: '$tasks.arch.outputs',
      dependsOn: ['arch'],
      priority: 8,
    },
    {
      id: 'adjudicate',
      agent: 'A5_adjudicator',
      name: 'Merge Implementations',
      inputs: {
        implA: '$tasks.codegen_a.outputs',
        implB: '$tasks.codegen_b.outputs',
      },
      dependsOn: ['codegen_a', 'codegen_b'],
      priority: 7,
    },
    {
      id: 'qa',
      agent: 'A6_qa_harness',
      name: 'Quality Assurance',
      inputs: '$tasks.adjudicate.outputs',
      dependsOn: ['adjudicate'],
      priority: 6,
    },
    {
      id: 'evidence',
      agent: 'A7_evidence',
      name: 'Generate Evidence Bundle',
      inputs: {
        spec: '$tasks.spec.outputs',
        code: '$tasks.adjudicate.outputs',
        qa: '$tasks.qa.outputs',
      },
      dependsOn: ['qa'],
      priority: 5,
    },
  ]),

  // Quick spec + code workflow
  quickBuild: createWorkflow('Quick Build', '1.0.0', [
    {
      id: 'spec',
      agent: 'A1_spec',
      name: 'Quick Spec',
      inputs: { requirement: '$vars.requirement' },
    },
    {
      id: 'code',
      agent: 'A3_codegen_a',
      name: 'Generate Code',
      inputs: '$tasks.spec.outputs',
      dependsOn: ['spec'],
    },
  ]),

  // Security-focused workflow
  securityAudit: createWorkflow('Security Audit', '1.0.0', [
    {
      id: 'scan',
      agent: 'A9_security',
      name: 'Security Scan',
      inputs: { codebase: '$vars.codebase' },
      priority: 10,
    },
    {
      id: 'report',
      agent: 'A7_evidence',
      name: 'Security Report',
      inputs: '$tasks.scan.outputs',
      dependsOn: ['scan'],
    },
  ]),

  // Performance testing workflow
  performanceTest: createWorkflow('Performance Test', '1.0.0', [
    {
      id: 'profile',
      agent: 'A8_performance',
      name: 'Performance Profile',
      inputs: { target: '$vars.target' },
      retry: { maxRetries: 2, baseDelayMs: 5000 },
    },
    {
      id: 'report',
      agent: 'A7_evidence',
      name: 'Performance Report',
      inputs: '$tasks.profile.outputs',
      dependsOn: ['profile'],
    },
  ]),
};

/**
 * Export workflow to JSON
 */
export function exportWorkflow(workflow: WorkflowDefinition): string {
  return JSON.stringify(workflow, null, 2);
}

/**
 * Get workflow execution order (topological sort)
 */
export function getExecutionOrder(workflow: WorkflowDefinition): string[] {
  const order: string[] = [];
  const visited = new Set<string>();
  const taskMap = new Map<string, WorkflowTask>();
  workflow.tasks.forEach(t => taskMap.set(t.id, t));

  function visit(taskId: string) {
    if (visited.has(taskId)) return;
    visited.add(taskId);

    const task = taskMap.get(taskId);
    if (task?.dependsOn) {
      task.dependsOn.forEach(visit);
    }
    order.push(taskId);
  }

  workflow.tasks.forEach(t => visit(t.id));
  return order;
}

/**
 * Estimate workflow duration based on task count and dependencies
 */
export function estimateWorkflowDuration(workflow: WorkflowDefinition): {
  minMs: number;
  maxMs: number;
  parallelizable: number;
} {
  const avgTaskDuration = 5000; // 5 seconds average per task
  const taskCount = workflow.tasks.length;

  // Calculate critical path length
  const taskMap = new Map<string, WorkflowTask>();
  workflow.tasks.forEach(t => taskMap.set(t.id, t));

  const depths = new Map<string, number>();

  function getDepth(taskId: string): number {
    if (depths.has(taskId)) return depths.get(taskId)!;

    const task = taskMap.get(taskId);
    if (!task?.dependsOn?.length) {
      depths.set(taskId, 1);
      return 1;
    }

    const maxDepDeath = Math.max(...task.dependsOn.map(getDepth));
    const depth = maxDepDeath + 1;
    depths.set(taskId, depth);
    return depth;
  }

  workflow.tasks.forEach(t => getDepth(t.id));
  const criticalPathLength = Math.max(...depths.values());

  return {
    minMs: criticalPathLength * avgTaskDuration,
    maxMs: taskCount * avgTaskDuration,
    parallelizable: taskCount - criticalPathLength,
  };
}
