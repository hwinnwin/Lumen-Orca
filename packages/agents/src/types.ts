/**
 * Agent collaboration types and interfaces
 * Enhanced with retry logic, workflow DSL, and blocker protocol
 */

// TODO: Import from @lumen/contracts once monorepo build is configured
// import type { Blocker, AgentLog } from '@lumen/contracts';

export interface Blocker {
  context: string;
  hypothesis: string;
  options: string[];
  requested_roles: string[];
  deadline: string;
  evidencePath?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface AgentLog {
  agentId: string;
  contributor: string;
  scope: string;
  logicSummary: string[];
  evidence: string;
  timestamp: string;
}

// Retry configuration for tasks
export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors?: string[]; // Error patterns that should trigger retry
}

// Default retry configuration
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableErrors: ['timeout', 'rate_limit', 'network', 'temporary'],
};

// Built-in agent roles
export type BuiltInAgentRole =
  | 'A0_orchestrator'
  | 'A1_spec'
  | 'A2_architect'
  | 'A3_codegen_a'
  | 'A4_codegen_b'
  | 'A5_adjudicator'
  | 'A6_qa_harness'
  | 'A7_evidence'
  | 'A8_performance'
  | 'A9_security'
  | 'A10_incident';

// AgentRole can be any string to support custom agents
export type AgentRole = BuiltInAgentRole | string;

export interface CustomAgentDefinition {
  id: string;
  name: string;
  role: string;
  description: string;
  systemPrompt: string;
  icon?: string; // Icon name from lucide-react
  maxConcurrentTasks?: number;
  retryConfig?: Partial<RetryConfig>;
}

export interface AgentTask {
  id: string;
  role: AgentRole;
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'blocked' | 'retrying';
  dependencies: string[];
  blocker?: Blocker;
  // Retry tracking
  retryCount: number;
  retryConfig: RetryConfig;
  lastError?: string;
  nextRetryAt?: string;
  // Timing
  startedAt?: string;
  completedAt?: string;
  // Conditional execution
  condition?: TaskCondition;
  // Priority (higher = run first)
  priority: number;
}

export interface TaskCondition {
  type: 'always' | 'on_success' | 'on_failure' | 'expression';
  expression?: string; // e.g., "outputs.A1_spec.testable === true"
  dependsOn?: string; // Task ID to check condition against
}

export interface AgentStatus {
  role: AgentRole;
  state: 'idle' | 'active' | 'blocked' | 'error' | 'retrying';
  currentTask?: string;
  blockers: Blocker[];
  metrics: {
    tasksCompleted: number;
    tasksFailed: number;
    tasksRetried: number;
    averageLatency: number;
    errorRate: number;
    totalTokensUsed: number;
    estimatedCost: number;
  };
}

// Workflow YAML DSL types
export interface WorkflowDefinition {
  name: string;
  version: string;
  description?: string;
  triggers?: WorkflowTrigger[];
  variables?: Record<string, unknown>;
  tasks: WorkflowTask[];
  onFailure?: FailureHandler;
  onSuccess?: SuccessHandler;
}

export interface WorkflowTrigger {
  type: 'manual' | 'schedule' | 'webhook' | 'event';
  config?: Record<string, unknown>;
}

export interface WorkflowTask {
  id: string;
  name?: string;
  agent: AgentRole;
  inputs: Record<string, unknown> | string; // string = reference like "$tasks.A1_spec.outputs"
  dependsOn?: string[];
  condition?: TaskCondition;
  retry?: Partial<RetryConfig>;
  timeout?: number;
  priority?: number;
  onBlocker?: 'escalate' | 'skip' | 'fail';
}

export interface FailureHandler {
  action: 'rollback' | 'notify' | 'retry_workflow' | 'continue';
  notifyChannels?: string[];
  maxWorkflowRetries?: number;
}

export interface SuccessHandler {
  action: 'notify' | 'trigger_workflow' | 'none';
  notifyChannels?: string[];
  nextWorkflow?: string;
}

// Inter-agent communication
export interface AgentMessage {
  id: string;
  from: AgentRole;
  to: AgentRole | 'broadcast';
  type: 'request' | 'response' | 'blocker' | 'escalation' | 'info';
  payload: Record<string, unknown>;
  timestamp: string;
  correlationId?: string; // Link related messages
}

// Execution context passed to agents
export interface ExecutionContext {
  workflowId: string;
  workflowName: string;
  taskId: string;
  attempt: number;
  variables: Record<string, unknown>;
  previousOutputs: Record<string, Record<string, unknown>>; // taskId -> outputs
  blockers: Blocker[];
}
