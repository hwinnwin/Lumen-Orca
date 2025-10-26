/**
 * Agent collaboration types and interfaces
 */

import type { Blocker, AgentLog } from '@lumen/contracts';

export { Blocker, AgentLog };

export type AgentRole = 
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
