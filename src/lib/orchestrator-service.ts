/**
 * Orchestrator Service - Singleton for managing DAG execution
 * Provides React hooks and utilities for dashboard integration
 */

import { Orchestrator } from '../../packages/agents/src/A0_orchestrator';
import type { AgentTask, AgentStatus } from '../../packages/agents/src/types';
import { evidenceService } from './evidence-service';

class OrchestratorService {
  private orchestrator: Orchestrator;
  private static instance: OrchestratorService;

  private constructor() {
    this.orchestrator = new Orchestrator();
    this.initializeSampleTasks();
  }

  static getInstance(): OrchestratorService {
    if (!OrchestratorService.instance) {
      OrchestratorService.instance = new OrchestratorService();
    }
    return OrchestratorService.instance;
  }

  // Initialize sample workflow for demonstration
  private initializeSampleTasks(): void {
    const tasks: AgentTask[] = [
      {
        id: 'task-spec',
        role: 'A1_spec',
        inputs: { requirements: 'Build auth system' },
        status: 'pending',
        dependencies: []
      },
      {
        id: 'task-arch',
        role: 'A2_architect',
        inputs: {},
        status: 'pending',
        dependencies: ['task-spec']
      },
      {
        id: 'task-codegen-a',
        role: 'A3_codegen_a',
        inputs: {},
        status: 'pending',
        dependencies: ['task-arch']
      },
      {
        id: 'task-codegen-b',
        role: 'A4_codegen_b',
        inputs: {},
        status: 'pending',
        dependencies: ['task-arch']
      },
      {
        id: 'task-adjudicate',
        role: 'A5_adjudicator',
        inputs: {},
        status: 'pending',
        dependencies: ['task-codegen-a', 'task-codegen-b']
      },
      {
        id: 'task-qa',
        role: 'A6_qa_harness',
        inputs: {},
        status: 'pending',
        dependencies: ['task-adjudicate']
      },
      {
        id: 'task-evidence',
        role: 'A7_evidence',
        inputs: {},
        status: 'pending',
        dependencies: ['task-qa']
      }
    ];

    tasks.forEach(task => this.orchestrator.addTask(task));
  }

  getOrchestrator(): Orchestrator {
    return this.orchestrator;
  }

  async start(): Promise<void> {
    await this.orchestrator.execute();
    
    // Generate evidence bundle after execution completes
    const state = this.orchestrator.getState();
    evidenceService.generateFromOrchestrator({
      tasks: state.tasks.map(t => ({
        id: t.id,
        status: t.status,
        role: t.role,
        outputs: t.outputs
      })),
      agents: state.agents.map(a => ({
        role: a.role,
        metrics: a.metrics
      })),
      stats: state.stats
    });
  }

  getState() {
    return this.orchestrator.getState();
  }

  reset(): void {
    this.orchestrator.reset();
    this.initializeSampleTasks();
  }

  onTaskUpdate(callback: (task: AgentTask) => void): () => void {
    return this.orchestrator.onTaskUpdate(callback);
  }

  onAgentUpdate(callback: (status: AgentStatus) => void): () => void {
    return this.orchestrator.onAgentUpdate(callback);
  }
}

export const orchestratorService = OrchestratorService.getInstance();

