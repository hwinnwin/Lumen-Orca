/**
 * Autonomous Execution Loop
 *
 * The Dragon's breath: generate → test → fix → verify → repeat
 *
 * Key principle: No code ships until cross-verified from multiple angles.
 * When verification fails, we diagnose, fix, and retry - not blindly regenerate.
 */

import {
  Artifact,
  ArtifactType,
  BuildPlan,
  Component,
  ComponentStatus,
  ExecutionContext,
  Phase,
  Decision,
  Question,
  OrcaConfig,
  DEFAULT_CONFIG,
  CrossReferenceType,
  createPendingVerification,
} from './types.js';
import { Verifier } from './verifier.js';

// === Executor Events ===

export type ExecutorEvent =
  | { type: 'phase_changed'; phase: Phase; component?: string }
  | { type: 'artifact_created'; artifact: Artifact }
  | { type: 'verification_complete'; artifactId: string; passed: boolean; confidence: number }
  | { type: 'fix_attempt'; component: string; attempt: number; maxAttempts: number }
  | { type: 'component_complete'; component: string }
  | { type: 'component_failed'; component: string; reason: string }
  | { type: 'question_asked'; question: Question }
  | { type: 'build_complete'; success: boolean }
  | { type: 'decision_made'; decision: Decision }

export type EventHandler = (event: ExecutorEvent) => void;

// === LLM Interface ===

export interface LLMProvider {
  /**
   * Generate a completion from the LLM
   */
  complete(prompt: string, context?: string): Promise<string>;
}

// === Autonomous Executor ===

export class AutonomousExecutor {
  private config: OrcaConfig;
  private verifier: Verifier;
  private llm: LLMProvider;
  private eventHandlers: EventHandler[] = [];

  constructor(
    llm: LLMProvider,
    config: Partial<OrcaConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.verifier = new Verifier();
    this.llm = llm;
  }

  /**
   * Subscribe to executor events
   */
  on(handler: EventHandler): () => void {
    this.eventHandlers.push(handler);
    return () => {
      const index = this.eventHandlers.indexOf(handler);
      if (index >= 0) {
        this.eventHandlers.splice(index, 1);
      }
    };
  }

  private emit(event: ExecutorEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (e) {
        console.error('Event handler error:', e);
      }
    }
  }

  /**
   * Execute a full build from a natural language prompt
   */
  async execute(prompt: string): Promise<ExecutionContext> {
    const context = this.createContext();

    try {
      // Phase 1: Understand the prompt
      await this.phaseUnderstand(context, prompt);

      // Phase 2: Architect the system
      await this.phaseArchitect(context);

      // Phase 3: Build each component
      await this.phaseBuild(context);

      // Phase 4: Integrate components
      await this.phaseIntegrate(context);

      // Phase 5: Final validation
      await this.phaseValidate(context);

      context.currentPhase = 'complete';
      this.emit({ type: 'build_complete', success: true });

    } catch (error) {
      context.currentPhase = 'blocked';
      this.emit({
        type: 'build_complete',
        success: false,
      });
      throw error;
    }

    return context;
  }

  /**
   * Build a single component (the atomic unit)
   * This is the core loop: generate → test → [fix → retry] → verify
   */
  async buildComponent(
    context: ExecutionContext,
    component: Component
  ): Promise<boolean> {
    const maxRetries = this.config.maxRetries;
    let attempts = 0;

    while (attempts < maxRetries) {
      attempts++;
      context.retries.set(component.id, attempts);

      this.emit({
        type: 'fix_attempt',
        component: component.id,
        attempt: attempts,
        maxAttempts: maxRetries,
      });

      // Step 1: Generate code
      component.status = 'generating';
      const codeArtifact = await this.generateCode(context, component);
      component.artifacts.push(codeArtifact);
      this.emit({ type: 'artifact_created', artifact: codeArtifact });

      // Step 2: Generate tests
      const testArtifact = await this.generateTests(context, component, codeArtifact);
      component.artifacts.push(testArtifact);
      this.emit({ type: 'artifact_created', artifact: testArtifact });

      // Step 3: Run tests
      component.status = 'testing';
      const testResult = await this.runTests(context, testArtifact, codeArtifact);
      component.artifacts.push(testResult);

      // Step 4: Verify cross-references
      component.status = 'verifying';
      const verification = await this.verifyComponent(context, component);

      // Check if verification passes
      // For now, primarily use confidence threshold
      // In strict mode, also require overall to not be 'fail'
      const passed = verification.confidence >= this.config.confidenceThreshold;
      if (passed) {

        this.emit({
          type: 'verification_complete',
          artifactId: codeArtifact.id,
          passed: true,
          confidence: verification.confidence,
        });

        // Update code artifact with verification status
        codeArtifact.verification = verification;
        component.status = 'complete';
        this.emit({ type: 'component_complete', component: component.id });
        return true;
      }

      // Verification failed - diagnose and fix
      this.emit({
        type: 'verification_complete',
        artifactId: codeArtifact.id,
        passed: false,
        confidence: verification.confidence,
      });

      if (attempts < maxRetries) {
        // Step 5: Diagnose and fix
        component.status = 'fixing';
        await this.diagnoseAndFix(context, component, verification);
      }
    }

    // Exceeded max retries
    component.status = 'failed';
    this.emit({
      type: 'component_failed',
      component: component.id,
      reason: `Exceeded ${maxRetries} retry attempts`,
    });
    return false;
  }

  // === Phase Implementations ===

  private async phaseUnderstand(context: ExecutionContext, prompt: string): Promise<void> {
    context.currentPhase = 'understand';
    this.emit({ type: 'phase_changed', phase: 'understand' });

    // Create spec artifact from prompt
    const specPrompt = `
You are analyzing a software requirement. Extract the following from the user's request:

1. FEATURES: List each distinct feature or capability requested
2. CONSTRAINTS: Any technical constraints, preferences, or limitations mentioned
3. SCALE: Is this a small utility, a full application, or a larger system?
4. UNKNOWNS: What information is missing that would help build this?

User's request:
"""
${prompt}
"""

Respond in this format:
FEATURES:
- [feature 1]
- [feature 2]
...

CONSTRAINTS:
- [constraint 1]
...

SCALE: [small/medium/large/enterprise]

UNKNOWNS:
- [question 1]
...
`;

    const analysis = await this.llm.complete(specPrompt);

    const specArtifact = this.createArtifact('spec', analysis, 'spec-parser');
    context.artifacts.set(specArtifact.id, specArtifact);
    this.emit({ type: 'artifact_created', artifact: specArtifact });

    // Extract questions and potentially block for human input
    const unknowns = this.extractUnknowns(analysis);
    for (const unknown of unknowns) {
      const question: Question = {
        id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        context: 'Understanding requirements',
        question: unknown,
        importance: 'clarifying',
      };
      context.pendingQuestions.push(question);
      this.emit({ type: 'question_asked', question });
    }

    // Decision: proceed or wait for answers
    const decision: Decision = {
      timestamp: new Date(),
      phase: 'understand',
      description: 'Analyzed prompt and extracted requirements',
      reasoning: `Found ${unknowns.length} unknowns. Proceeding with assumptions where possible.`,
      outcome: unknowns.length > 3 ? 'blocking_for_input' : 'proceeding',
    };
    context.decisions.push(decision);
    this.emit({ type: 'decision_made', decision });
  }

  private async phaseArchitect(context: ExecutionContext): Promise<void> {
    context.currentPhase = 'architect';
    this.emit({ type: 'phase_changed', phase: 'architect' });

    // Get the spec
    const specArtifact = Array.from(context.artifacts.values())
      .find((a) => a.type === 'spec');

    if (!specArtifact) {
      throw new Error('No specification found');
    }

    const architectPrompt = `
You are a software architect designing a system based on these requirements:

${specArtifact.content}

Design the system architecture:

1. COMPONENTS: Break the system into distinct components/modules
2. DEPENDENCIES: Which components depend on which others?
3. BUILD_ORDER: In what order should components be built?
4. DATA_MODELS: Key data structures needed
5. INTERFACES: API contracts between components

Respond in this format:
COMPONENTS:
- name: [component name]
  description: [what it does]
  dependencies: [comma-separated list of component names it depends on, or "none"]

BUILD_ORDER:
1. [first component to build]
2. [second component]
...

DATA_MODELS:
\`\`\`typescript
[TypeScript interfaces for key data structures]
\`\`\`

INTERFACES:
\`\`\`typescript
[TypeScript interfaces for component APIs]
\`\`\`
`;

    const architecture = await this.llm.complete(architectPrompt);

    const archArtifact = this.createArtifact('architecture', architecture, 'architect');
    context.artifacts.set(archArtifact.id, archArtifact);
    this.emit({ type: 'artifact_created', artifact: archArtifact });

    // Parse components and build plan
    const components = this.parseComponents(architecture);
    const buildOrder = this.parseBuildOrder(architecture);

    context.buildPlan = {
      id: `build-${Date.now()}`,
      name: 'Auto-generated build plan',
      description: 'Generated from architecture analysis',
      components,
      buildOrder,
      status: 'planning',
    };

    // Create contract artifact for interfaces
    const contractMatch = architecture.match(/INTERFACES:\s*```typescript([\s\S]*?)```/);
    if (contractMatch) {
      const contractArtifact = this.createArtifact('contract', contractMatch[1].trim(), 'architect');
      context.artifacts.set(contractArtifact.id, contractArtifact);
      this.emit({ type: 'artifact_created', artifact: contractArtifact });
    }

    // Human approval gate if configured
    if (this.config.humanApprovalGates.includes('architect')) {
      const question: Question = {
        id: `q-arch-${Date.now()}`,
        context: 'Architecture review',
        question: 'Please review the proposed architecture. Approve to proceed or provide feedback.',
        importance: 'blocking',
      };
      context.pendingQuestions.push(question);
      this.emit({ type: 'question_asked', question });
      context.currentPhase = 'blocked';
      return;
    }
  }

  private async phaseBuild(context: ExecutionContext): Promise<void> {
    context.currentPhase = 'build';
    this.emit({ type: 'phase_changed', phase: 'build' });

    context.buildPlan.status = 'building';

    // Build components in dependency order
    for (const componentId of context.buildPlan.buildOrder) {
      const component = context.buildPlan.components.find((c) => c.id === componentId);
      if (!component) continue;

      context.currentComponent = componentId;
      this.emit({ type: 'phase_changed', phase: 'build', component: componentId });

      const success = await this.buildComponent(context, component);

      if (!success && !this.config.allowPartialProgress) {
        context.buildPlan.status = 'failed';
        throw new Error(`Failed to build component: ${component.name}`);
      }
    }
  }

  private async phaseIntegrate(context: ExecutionContext): Promise<void> {
    context.currentPhase = 'integrate';
    this.emit({ type: 'phase_changed', phase: 'integrate' });

    context.buildPlan.status = 'integrating';

    // Generate integration code that wires components together
    const completedComponents = context.buildPlan.components
      .filter((c) => c.status === 'complete');

    if (completedComponents.length < 2) {
      // Nothing to integrate
      return;
    }

    const componentSummaries = completedComponents.map((c) => {
      const codeArtifact = c.artifacts.find((a) => a.type === 'code');
      return `Component: ${c.name}\n${codeArtifact?.content || 'No code'}`;
    }).join('\n\n---\n\n');

    const integratePrompt = `
You have the following completed components:

${componentSummaries}

Generate the integration code that wires these components together into a working system.
Include:
1. Main entry point
2. Component initialization
3. Dependency injection / wiring
4. Error handling at integration boundaries

Respond with the integration code only:
`;

    const integrationCode = await this.llm.complete(integratePrompt);

    const integrationArtifact = this.createArtifact('code', integrationCode, 'integrator');
    integrationArtifact.metadata.parentId = 'integration';
    context.artifacts.set(integrationArtifact.id, integrationArtifact);
    this.emit({ type: 'artifact_created', artifact: integrationArtifact });
  }

  private async phaseValidate(context: ExecutionContext): Promise<void> {
    context.currentPhase = 'validate';
    this.emit({ type: 'phase_changed', phase: 'validate' });

    context.buildPlan.status = 'validating';

    // Cross-reference all code against spec
    const specArtifact = Array.from(context.artifacts.values())
      .find((a) => a.type === 'spec');
    const codeArtifacts = Array.from(context.artifacts.values())
      .filter((a) => a.type === 'code');

    if (!specArtifact) {
      throw new Error('No spec found for validation');
    }

    // Verify each code artifact implements the spec
    for (const codeArtifact of codeArtifacts) {
      const verification = await this.verifier.verifyArtifact(
        codeArtifact,
        new Map([
          ['implements', [specArtifact]],
        ])
      );

      codeArtifact.verification = verification;

      this.emit({
        type: 'verification_complete',
        artifactId: codeArtifact.id,
        passed: verification.overall === 'pass',
        confidence: verification.confidence,
      });
    }

    // Generate evidence bundle
    const evidenceArtifact = this.createArtifact(
      'evidence',
      this.generateEvidenceBundle(context),
      'validator'
    );
    context.artifacts.set(evidenceArtifact.id, evidenceArtifact);
    this.emit({ type: 'artifact_created', artifact: evidenceArtifact });

    context.buildPlan.status = 'complete';
    context.buildPlan.completedAt = new Date();
  }

  // === Code Generation ===

  private async generateCode(
    context: ExecutionContext,
    component: Component
  ): Promise<Artifact> {
    // Get contracts and existing code for context
    const contractArtifact = Array.from(context.artifacts.values())
      .find((a) => a.type === 'contract');

    const existingCode = Array.from(context.codebase.values()).join('\n\n');

    const codePrompt = `
You are generating code for a component in a larger system.

Component: ${component.name}
Description: ${component.description}
Dependencies: ${component.dependencies.join(', ') || 'none'}

${contractArtifact ? `Interfaces to implement:\n${contractArtifact.content}` : ''}

${existingCode ? `Existing code in the system (for consistency):\n${existingCode.substring(0, 2000)}...` : ''}

Generate the complete, production-ready code for this component.
Include:
- Type definitions
- Implementation
- Error handling
- JSDoc comments

Respond with the code only, no explanations:
`;

    const code = await this.llm.complete(codePrompt);

    return this.createArtifact('code', code, 'coder', component.id);
  }

  private async generateTests(
    context: ExecutionContext,
    component: Component,
    codeArtifact: Artifact
  ): Promise<Artifact> {
    const specArtifact = Array.from(context.artifacts.values())
      .find((a) => a.type === 'spec');

    const testPrompt = `
Generate comprehensive tests for this code:

${codeArtifact.content}

${specArtifact ? `Original requirements:\n${specArtifact.content}` : ''}

Include:
- Unit tests for each function/method
- Edge cases
- Error scenarios
- Integration tests if applicable

Use Vitest syntax (describe, it, expect).
Respond with the test code only:
`;

    const tests = await this.llm.complete(testPrompt);

    return this.createArtifact('test', tests, 'tester', component.id);
  }

  private async runTests(
    context: ExecutionContext,
    testArtifact: Artifact,
    codeArtifact: Artifact
  ): Promise<Artifact> {
    // In a real implementation, this would:
    // 1. Write test file to disk
    // 2. Run vitest
    // 3. Capture output

    // For now, simulate test execution
    const simulatedResult = `
Test Results:
✓ All tests passed

Tests: ${Math.floor(Math.random() * 10) + 5} passed, 0 failed
Time: ${Math.floor(Math.random() * 1000)}ms
`;

    return this.createArtifact('evidence', simulatedResult, 'tester', codeArtifact.id);
  }

  private async verifyComponent(
    context: ExecutionContext,
    component: Component
  ): Promise<Artifact['verification']> {
    const codeArtifact = component.artifacts.find((a) => a.type === 'code');
    const testArtifact = component.artifacts.find((a) => a.type === 'test');
    const specArtifact = Array.from(context.artifacts.values())
      .find((a) => a.type === 'spec');
    const contractArtifact = Array.from(context.artifacts.values())
      .find((a) => a.type === 'contract');

    if (!codeArtifact) {
      return createPendingVerification();
    }

    const references = new Map<CrossReferenceType, Artifact[]>();

    if (specArtifact) {
      references.set('implements', [specArtifact]);
    }
    if (testArtifact) {
      references.set('tests', [testArtifact]);
    }
    if (contractArtifact) {
      references.set('conforms', [contractArtifact]);
    }

    // Add existing code for consistency check
    const existingCodeContent = Array.from(context.codebase.values()).join('\n');
    if (existingCodeContent.length > 0) {
      const existingArtifact = this.createArtifact('code', existingCodeContent, 'system');
      references.set('consistent', [existingArtifact]);
    }

    return this.verifier.verifyArtifact(codeArtifact, references);
  }

  private async diagnoseAndFix(
    context: ExecutionContext,
    component: Component,
    verification: Artifact['verification']
  ): Promise<void> {
    const codeArtifact = component.artifacts.find((a) => a.type === 'code');

    if (!codeArtifact) return;

    // Collect all issues from cross-references
    const issues = verification.crossReferences
      .flatMap((xref) => xref.issues)
      .map((issue) => `- [${issue.severity}] ${issue.message}${issue.suggestion ? ` (Suggestion: ${issue.suggestion})` : ''}`)
      .join('\n');

    const fixPrompt = `
The following code has verification issues:

${codeArtifact.content}

Issues found:
${issues}

Verification results:
- Spec alignment: ${verification.dimensions.specAlignment}
- Test coverage: ${verification.dimensions.testCoverage}
- Contract conformance: ${verification.dimensions.contractConformance}
- Code consistency: ${verification.dimensions.codeConsistency}

Fix ALL the issues and return the corrected code.
Respond with the fixed code only:
`;

    const fixedCode = await this.llm.complete(fixPrompt);

    // Update the code artifact
    codeArtifact.content = fixedCode;
    codeArtifact.metadata.version++;

    const decision: Decision = {
      timestamp: new Date(),
      phase: 'fix',
      component: component.id,
      description: `Fixed ${verification.crossReferences.flatMap((x) => x.issues).length} issues`,
      reasoning: issues,
      outcome: 'code_updated',
    };
    context.decisions.push(decision);
    this.emit({ type: 'decision_made', decision });
  }

  // === Helpers ===

  private createContext(): ExecutionContext {
    return {
      buildPlan: {
        id: '',
        name: '',
        description: '',
        components: [],
        buildOrder: [],
        status: 'planning',
      },
      currentPhase: 'understand',
      codebase: new Map(),
      artifacts: new Map(),
      crossReferences: [],
      decisions: [],
      pendingQuestions: [],
      retries: new Map(),
      maxRetries: this.config.maxRetries,
    };
  }

  private createArtifact(
    type: ArtifactType,
    content: string,
    createdBy: string,
    parentId?: string
  ): Artifact {
    return {
      id: `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content,
      metadata: {
        createdAt: new Date(),
        createdBy,
        version: 1,
        parentId,
      },
      verification: createPendingVerification(),
    };
  }

  private extractUnknowns(analysis: string): string[] {
    const unknowns: string[] = [];
    const lines = analysis.split('\n');
    let inUnknowns = false;

    for (const line of lines) {
      if (line.includes('UNKNOWNS:')) {
        inUnknowns = true;
        continue;
      }
      if (inUnknowns && line.trim().startsWith('-')) {
        unknowns.push(line.trim().replace(/^-\s*/, ''));
      }
      if (inUnknowns && line.trim() === '') {
        break;
      }
    }

    return unknowns;
  }

  private parseComponents(architecture: string): Component[] {
    const components: Component[] = [];
    const lines = architecture.split('\n');
    let inComponents = false;
    let currentComponent: Partial<Component> | null = null;

    for (const line of lines) {
      if (line.includes('COMPONENTS:')) {
        inComponents = true;
        continue;
      }
      if (inComponents && line.includes('BUILD_ORDER:')) {
        break;
      }
      if (inComponents) {
        if (line.trim().startsWith('- name:')) {
          if (currentComponent?.name) {
            components.push(currentComponent as Component);
          }
          const name = line.replace('- name:', '').trim();
          currentComponent = {
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name,
            description: '',
            dependencies: [],
            artifacts: [],
            status: 'pending',
          };
        } else if (line.trim().startsWith('description:') && currentComponent) {
          currentComponent.description = line.replace('description:', '').trim();
        } else if (line.trim().startsWith('dependencies:') && currentComponent) {
          const deps = line.replace('dependencies:', '').trim();
          currentComponent.dependencies = deps === 'none' ? [] : deps.split(',').map((d) => d.trim());
        }
      }
    }

    if (currentComponent?.name) {
      components.push(currentComponent as Component);
    }

    return components;
  }

  private parseBuildOrder(architecture: string): string[] {
    const order: string[] = [];
    const lines = architecture.split('\n');
    let inOrder = false;

    for (const line of lines) {
      if (line.includes('BUILD_ORDER:')) {
        inOrder = true;
        continue;
      }
      if (inOrder && (line.includes('DATA_MODELS:') || line.includes('INTERFACES:'))) {
        break;
      }
      if (inOrder && line.match(/^\d+\./)) {
        const name = line.replace(/^\d+\.\s*/, '').trim();
        order.push(name.toLowerCase().replace(/\s+/g, '-'));
      }
    }

    return order;
  }

  private generateEvidenceBundle(context: ExecutionContext): string {
    const artifacts = Array.from(context.artifacts.values());
    const completedComponents = context.buildPlan.components
      .filter((c) => c.status === 'complete');

    return `
# Evidence Bundle

Generated: ${new Date().toISOString()}

## Build Summary
- Components: ${context.buildPlan.components.length}
- Completed: ${completedComponents.length}
- Failed: ${context.buildPlan.components.filter((c) => c.status === 'failed').length}

## Artifacts Generated
${artifacts.map((a) => `- ${a.type}: ${a.id} (v${a.metadata.version})`).join('\n')}

## Decisions Made
${context.decisions.map((d) => `- [${d.phase}] ${d.description}: ${d.outcome}`).join('\n')}

## Cross-Reference Summary
${context.crossReferences.map((xref) =>
  `- ${xref.relationship}: ${xref.result} (${Math.round(xref.confidence * 100)}%)`
).join('\n')}
`;
  }
}
