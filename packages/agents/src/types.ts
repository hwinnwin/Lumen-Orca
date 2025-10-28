/**
 * Agent collaboration types and interfaces
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
}

export interface AgentLog {
  agentId: string;
  contributor: string;
  scope: string;
  logicSummary: string[];
  evidence: string;
  timestamp: string;
}

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
}

export interface AgentTask {
  id: string;
  role: AgentRole;
  inputs: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'blocked';
  dependencies: string[];
  blocker?: Blocker;
}

export interface AgentStatus {
  role: AgentRole;
  state: 'idle' | 'active' | 'blocked' | 'error';
  currentTask?: string;
  metrics: {
    tasksCompleted: number;
    averageLatency: number;
    errorRate: number;
  };
}
