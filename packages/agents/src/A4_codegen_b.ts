/**
 * A4: Code Generator (Path B)
 * Role: Alternative code generation for diversity
 * Inputs: Same architecture design as A3
 * Outputs: Alternative implementation with different patterns
 * Quality: Emphasizes functional patterns and immutability
 *
 * Path B deliberately takes a different approach from Path A:
 * - Functional programming patterns
 * - Composition over inheritance
 * - Immutable data structures
 * - Property-based testing
 * This diversity enables A5 (Adjudicator) to compare and merge the best of both.
 */

import { callLLM, parseJSONResponse } from './llm-client';
import { getAgentPrompt } from './prompts';

export interface GeneratedCodeB {
  id: string;
  code: string;
  language: 'typescript';
  tests: TestCaseB[];
  approachRationale: string;
  tradeoffs: string[];
  dependencies: string[];
}

export interface TestCaseB {
  name: string;
  type: 'unit' | 'integration' | 'property';
  code: string;
  properties?: string[];
}

export interface GenerationOptionsB {
  functionalStyle: boolean;
  useImmutableStructures: boolean;
  preferComposition: boolean;
}

export class CodeGeneratorB {
  private options: GenerationOptionsB;

  constructor(options: Partial<GenerationOptionsB> = {}) {
    this.options = {
      functionalStyle: true,
      useImmutableStructures: true,
      preferComposition: true,
      ...options,
    };
  }

  /**
   * Generate alternative implementation (sync stub for backwards compat).
   * For real LLM-powered generation, use generateWithLLM().
   */
  generate(design: { components: Array<{ name: string; type: string }> }): GeneratedCodeB {
    return {
      id: `gen-b-${Date.now()}`,
      code: '// Pending LLM code generation (Path B)',
      language: 'typescript',
      tests: [],
      approachRationale: 'Pending LLM analysis',
      tradeoffs: [],
      dependencies: [],
    };
  }

  /**
   * Generate alternative implementation using LLM analysis.
   * Deliberately uses different patterns from Path A.
   */
  async generateWithLLM(input: {
    architecture: {
      overview: string;
      components: Array<{ name: string; type: string; responsibility: string; interfaces?: string[]; dependencies?: string[] }>;
      dataFlows?: Array<{ from: string; to: string; data: string }>;
    };
    requirements?: Array<{ id: string; text: string }>;
    pathACode?: string;
  }): Promise<GeneratedCodeB> {
    const systemPrompt = getAgentPrompt('A4_codegen_b');

    const componentList = input.architecture.components
      .map((c) => `- ${c.name} (${c.type}): ${c.responsibility}`)
      .join('\n');

    const reqList = (input.requirements || [])
      .map((r) => `- [${r.id}]: ${r.text}`)
      .join('\n');

    const diversityInstructions = [
      this.options.functionalStyle ? 'Use functional programming patterns (pure functions, function composition, pipe/flow)' : '',
      this.options.useImmutableStructures ? 'Use immutable data structures (Object.freeze, readonly types, spread operators)' : '',
      this.options.preferComposition ? 'Prefer composition over inheritance (higher-order functions, mixins, render props)' : '',
    ].filter(Boolean).join('\n- ');

    const userPrompt = `Generate an ALTERNATIVE implementation for the following architecture.
Your implementation must be DIFFERENT from typical OOP approaches.

Architecture Overview: ${input.architecture.overview}

Components to implement:
${componentList}

${reqList ? `Requirements:\n${reqList}` : ''}

${input.pathACode ? `IMPORTANT: Path A already produced this implementation. Your implementation MUST use different patterns and approaches:\n---\n${input.pathACode.slice(0, 2000)}\n---\n` : ''}

Diversity requirements:
- ${diversityInstructions}
- Use property-based tests (fast-check style) where applicable
- Emphasize type-level safety (branded types, discriminated unions)
- Use Either/Result types for error handling instead of try/catch

Return JSON:
{
  "code": "// Alternative TypeScript implementation using functional patterns",
  "tests": [
    { "name": "test name", "type": "unit|integration|property", "code": "// test code", "properties": ["property being tested"] }
  ],
  "approachRationale": "Why this approach differs and its benefits",
  "tradeoffs": ["tradeoff 1", "tradeoff 2"],
  "dependencies": ["package-name"]
}`;

    const response = await callLLM({
      systemPrompt,
      userPrompt,
      agentRole: 'A4_codegen_b',
      maxTokens: 8192,
      temperature: 0.5,
    });

    const parsed = parseJSONResponse<any>(response.result);
    return this.mapToGeneratedCodeB(parsed);
  }

  /**
   * Process LLM response from A0 orchestrator.
   */
  processResult(llmOutput: Record<string, unknown>): GeneratedCodeB {
    return this.mapToGeneratedCodeB(llmOutput);
  }

  private mapToGeneratedCodeB(parsed: any): GeneratedCodeB {
    const tests: TestCaseB[] = (parsed.tests || []).map((t: any) => ({
      name: t.name || 'unnamed test',
      type: t.type || 'unit',
      code: t.code || '',
      properties: t.properties,
    }));

    return {
      id: `gen-b-${Date.now()}`,
      code: parsed.code || '',
      language: 'typescript',
      tests,
      approachRationale: parsed.approachRationale || 'Alternative functional implementation',
      tradeoffs: parsed.tradeoffs || [],
      dependencies: parsed.dependencies || [],
    };
  }

  /**
   * Validate generated code for Path B quality standards.
   */
  validateCode(generated: GeneratedCodeB): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!generated.code || generated.code.length < 50) {
      issues.push('Generated code is too short or empty');
    }

    if (generated.code.includes('class ') && this.options.preferComposition) {
      issues.push('Code uses class-based patterns despite composition preference');
    }

    if (generated.code.includes('let ') && this.options.useImmutableStructures) {
      const letCount = (generated.code.match(/\blet\b/g) || []).length;
      if (letCount > 2) {
        issues.push(`Code uses ${letCount} mutable 'let' declarations - prefer const/readonly`);
      }
    }

    if (!generated.approachRationale || generated.approachRationale.length < 20) {
      issues.push('Missing or insufficient approach rationale');
    }

    if (generated.tests.length === 0) {
      issues.push('No tests generated');
    }

    const propertyTests = generated.tests.filter((t) => t.type === 'property');
    if (propertyTests.length === 0 && this.options.functionalStyle) {
      issues.push('No property-based tests - functional code benefits from property testing');
    }

    return { valid: issues.length === 0, issues };
  }
}
