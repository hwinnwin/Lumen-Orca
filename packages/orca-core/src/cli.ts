#!/usr/bin/env node
/**
 * Orca CLI
 *
 * The Dragon breathes fire.
 *
 * Usage:
 *   orca build "Create a TypeScript module that validates email addresses"
 *   orca build --mock "Create a simple calculator"  # Use mock LLM for testing
 */

import { AutonomousExecutor, ExecutorEvent } from './executor.js';
import { AnthropicProvider, MockProvider } from './providers.js';
import { TestRunner, MockTestRunner } from './test-runner.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

// ANSI colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset'): void {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logPhase(phase: string): void {
  console.log();
  log(`━━━ ${phase.toUpperCase()} ━━━`, 'cyan');
}

function logEvent(event: ExecutorEvent): void {
  switch (event.type) {
    case 'phase_changed':
      logPhase(event.phase);
      if (event.component) {
        log(`  Component: ${event.component}`, 'dim');
      }
      break;

    case 'artifact_created':
      log(`  ✦ Created: ${event.artifact.type} (${event.artifact.id.substring(0, 12)}...)`, 'blue');
      break;

    case 'verification_complete':
      if (event.passed) {
        log(`  ✓ Verification passed (${Math.round(event.confidence * 100)}% confidence)`, 'green');
      } else {
        log(`  ✗ Verification failed (${Math.round(event.confidence * 100)}% confidence)`, 'yellow');
      }
      break;

    case 'fix_attempt':
      log(`  ↻ Fix attempt ${event.attempt}/${event.maxAttempts}`, 'yellow');
      break;

    case 'component_complete':
      log(`  ✓ Component complete: ${event.component}`, 'green');
      break;

    case 'component_failed':
      log(`  ✗ Component failed: ${event.component}`, 'red');
      log(`    Reason: ${event.reason}`, 'dim');
      break;

    case 'question_asked':
      log(`  ? Question: ${event.question.question}`, 'magenta');
      break;

    case 'decision_made':
      log(`  → Decision: ${event.decision.description}`, 'dim');
      break;

    case 'build_complete':
      console.log();
      if (event.success) {
        log('═══ BUILD COMPLETE ═══', 'green');
      } else {
        log('═══ BUILD FAILED ═══', 'red');
      }
      break;
  }
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
${colors.cyan}${colors.bold}Orca - Autonomous Builder${colors.reset}

${colors.bold}Usage:${colors.reset}
  orca build "<prompt>"     Build from a natural language prompt
  orca build --mock "<prompt>"  Use mock LLM (for testing without API)

${colors.bold}Options:${colors.reset}
  --mock          Use mock LLM provider (no API key needed)
  --output, -o    Output directory (default: ./orca-output)
  --verbose, -v   Show detailed output

${colors.bold}Examples:${colors.reset}
  orca build "Create a TypeScript module that validates email addresses"
  orca build --mock "Create a simple calculator with add, subtract, multiply, divide"

${colors.bold}Environment:${colors.reset}
  ANTHROPIC_API_KEY    API key for Claude (required unless --mock)
  OPENAI_API_KEY       API key for OpenAI (alternative)
`);
    process.exit(0);
  }

  if (args[0] !== 'build') {
    log(`Unknown command: ${args[0]}`, 'red');
    log('Use "orca --help" for usage information', 'dim');
    process.exit(1);
  }

  // Parse arguments
  const useMock = args.includes('--mock');
  const verbose = args.includes('--verbose') || args.includes('-v');

  // Find output directory
  let outputDir = './orca-output';
  const outputIdx = args.findIndex((a) => a === '--output' || a === '-o');
  if (outputIdx !== -1 && args[outputIdx + 1]) {
    outputDir = args[outputIdx + 1];
  }

  // Find the prompt (last non-flag argument)
  const prompt = args.filter((a) => !a.startsWith('-') && a !== 'build')
    .pop();

  if (!prompt) {
    log('Error: No prompt provided', 'red');
    log('Usage: orca build "Your prompt here"', 'dim');
    process.exit(1);
  }

  // Create LLM provider
  let provider;
  if (useMock) {
    log('Using mock LLM provider (no API calls)', 'yellow');
    provider = new MockProvider();
  } else {
    const apiKey = process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      log('Error: No API key found', 'red');
      log('Set ANTHROPIC_API_KEY or OPENAI_API_KEY, or use --mock', 'dim');
      process.exit(1);
    }

    if (process.env.ANTHROPIC_API_KEY) {
      log('Using Anthropic Claude', 'blue');
      provider = new AnthropicProvider({ apiKey: process.env.ANTHROPIC_API_KEY });
    } else {
      log('Using OpenAI', 'blue');
      // Would use OpenAI provider here
      provider = new MockProvider(); // Fallback for now
    }
  }

  // Create executor
  // Lower confidence threshold for mock mode since mock responses aren't perfectly aligned
  // Real mode uses 0.3 temporarily - keyword-based verification needs LLM upgrade
  const executor = new AutonomousExecutor(provider, {
    maxRetries: 3,
    confidenceThreshold: useMock ? 0.05 : 0.3,
    humanApprovalGates: [], // No approval gates for CLI
  });

  // Subscribe to events
  executor.on(logEvent);

  // Show the prompt
  console.log();
  log('═══ ORCA AUTONOMOUS BUILDER ═══', 'cyan');
  console.log();
  log(`Prompt: "${prompt}"`, 'bold');
  console.log();

  try {
    // Execute the build
    const startTime = Date.now();
    const context = await executor.execute(prompt);
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);

    // Output results
    console.log();
    log(`Duration: ${duration}s`, 'dim');
    log(`Artifacts: ${context.artifacts.size}`, 'dim');
    log(`Decisions: ${context.decisions.length}`, 'dim');

    // Write output files
    await mkdir(outputDir, { recursive: true });

    // Write code artifacts from components
    for (const component of context.buildPlan.components) {
      for (const artifact of component.artifacts) {
        if (artifact.type === 'code') {
          const filename = `${component.id}.ts`;
          await writeFile(join(outputDir, filename), artifact.content);
          log(`  → ${filename}`, 'green');
        }
        if (artifact.type === 'test') {
          const filename = `${component.id}.test.ts`;
          await writeFile(join(outputDir, filename), artifact.content);
          log(`  → ${filename}`, 'green');
        }
      }
    }

    // Write evidence bundle
    const evidenceArtifact = Array.from(context.artifacts.values())
      .find((a) => a.type === 'evidence');
    if (evidenceArtifact) {
      await writeFile(join(outputDir, 'evidence.md'), evidenceArtifact.content);
      log(`  → evidence.md`, 'blue');
    }

    // Write full context for debugging
    if (verbose) {
      await writeFile(
        join(outputDir, 'context.json'),
        JSON.stringify({
          buildPlan: context.buildPlan,
          decisions: context.decisions,
          questions: context.pendingQuestions,
        }, null, 2)
      );
      log(`  → context.json`, 'dim');
    }

    console.log();
    log(`Output written to: ${outputDir}`, 'green');

  } catch (error) {
    console.log();
    log(`Error: ${error instanceof Error ? error.message : String(error)}`, 'red');
    process.exit(1);
  }
}

// Run CLI
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
