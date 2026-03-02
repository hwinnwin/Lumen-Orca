/**
 * @lumen/contracts - Schema-first interop layer
 * All agents and packages consume these typed contracts
 */

export interface Entry {
  id: string;
  timestamp: string;
  type: string;
  payload: unknown;
}

export interface Event {
  eventId: string;
  source: string;
  timestamp: string;
  data: unknown;
}

export interface Session {
  sessionId: string;
  startTime: string;
  endTime?: string;
  metadata: Record<string, unknown>;
}

export interface Settings {
  version: string;
  config: Record<string, unknown>;
}

// Six-nines governance types
export interface QualityGate {
  name: string;
  threshold: number;
  actual: number;
  passed: boolean;
}

export interface EvidenceBundle {
  id: string;
  timestamp: string;
  epoch: number;
  status: 'passed' | 'failed';
  fTotal: number;
  gates: QualityGate[];
  artifacts: string[];
}

// Agent collaboration types
export interface Blocker {
  context: string;
  hypothesis: string;
  options: string[];
  requestedRoles: string[];
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
