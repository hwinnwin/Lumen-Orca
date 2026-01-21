/**
 * @orca/core - Autonomous Builder Core
 *
 * The Dragon Architect Pattern:
 * Truth emerges from cross-verification, not generation.
 *
 * Key components:
 * - Types: Artifact, verification, and execution context types
 * - Verifier: Cross-reference verification engine
 * - Executor: Autonomous build loop (generate → test → fix → verify)
 * - Providers: LLM integrations (Anthropic, OpenAI)
 * - TestRunner: Real test execution with vitest
 */

export * from './types.js';
export * from './verifier.js';
export * from './executor.js';
export * from './providers.js';
export * from './test-runner.js';
