/**
 * Lumen-Orca Agent Package
 * Exports all agents, prompts, and types for the orchestration system
 *
 * Complete agent lineup (A0-A11):
 * - A0: Orchestrator - DAG coordination and task scheduling
 * - A1: Spec Architect - Requirements analysis
 * - A2: System Architect - System design
 * - A3: Code Generator A - Primary code generation
 * - A4: Code Generator B - Alternative implementation
 * - A5: Adjudicator - Code comparison and merging
 * - A6: QA Harness - Testing and quality gates
 * - A7: Evidence Reporter - Evidence bundle compilation
 * - A8: Performance Analyst - Performance testing
 * - A9: Security Auditor - Security scanning
 * - A10: Incident Responder - Failure analysis
 * - A11: Meta-Learner - Self-improvement
 */

// Shared LLM client for standalone agent use
export { callLLM, parseJSONResponse, validateRequiredFields } from './llm-client';
export type { LLMCallOptions, LLMResponse } from './llm-client';

// Core orchestrator
export { Orchestrator } from './A0_orchestrator';

// Agent implementations (A1-A11)
export { SpecAgent } from './A1_spec_architect';
export { SystemArchitectAgent } from './A2_system_architect';
export { CodeGeneratorA } from './A3_codegen_a';
export { CodeGeneratorB } from './A4_codegen_b';
export { CodeAdjudicator } from './A5_adjudicator';
export { QAHarness } from './A6_qa_harness';
export { EvidenceReporter } from './A7_evidence_reporter';
export { PerformanceAnalyst } from './A8_performance_analyst';
export { SecurityAuditor } from './A9_security_auditor';
export { IncidentResponder } from './A10_incident_responder';
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

// Types from core
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

// Types from agent implementations
export type { Specification, Requirement } from './A1_spec_architect';
export type { ArchitectureDesign, Component, DataFlow } from './A2_system_architect';
export type { GeneratedCode, TestCase } from './A3_codegen_a';
export type { GeneratedCodeB, TestCaseB } from './A4_codegen_b';
export type { AdjudicationResult, CodeScore, Conflict } from './A5_adjudicator';
export type { QAResult, TestSuite, QAMetrics, QualityGateResult } from './A6_qa_harness';
export type { EvidenceBundle, GateEvidence, Artifact, SBOM } from './A7_evidence_reporter';
export type { PerformanceReport, PerformanceMetrics, WebVitals } from './A8_performance_analyst';
export type { SecurityReport, Vulnerability, RLSStatus } from './A9_security_auditor';
export type { Incident, IncidentAnalysis, Postmortem, Remediation } from './A10_incident_responder';
