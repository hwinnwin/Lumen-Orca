/**
 * Lumen-Orca Agent Package
 * Exports all agents, prompts, and types for the orchestration system
 */

// Core orchestrator
export { Orchestrator } from './A0_orchestrator';

// Agent implementations
export { SpecAgent } from './A1_spec_architect';
export { MetaLearner, getMetaLearner, resetMetaLearner } from './A11_meta_learner';

// Agent prompts
export {
  AGENT_PROMPTS,
  getAgentPrompt,
  getAgentPromptConfig,
  getAllAgentConfigs,
  validateAgentOutput,
} from './prompts';
export type { AgentPromptConfig } from './prompts';

// Types
export type {
  AgentRole,
  BuiltInAgentRole,
  AgentTask,
  AgentStatus,
  CustomAgentDefinition,
  Blocker,
  AgentLog,
  LearningInsight,
  FailurePattern,
  AgentPerformanceSnapshot,
  MetaLearnerState,
} from './types';
