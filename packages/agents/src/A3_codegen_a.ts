/**
 * A3: Code Generator (Path A)
 * Role: Primary code generation
 * Inputs: Architecture design from A2
 * Outputs: TypeScript/React code with tests
 * Quality: Full type safety, comprehensive error handling
 *
 * Path A focuses on conventional best practices:
 * - Object-oriented patterns where appropriate
 * - React hooks and component composition
 * - Comprehensive error handling
 * - Clean code with JSDoc documentation
 */

import { callLLM, parseJSONResponse } from './llm-client';
import { getAgentPrompt } from './prompts';

export interface GeneratedCode {
  id: string;
  code: string;
  language: 'typescript' | 'javascript' | 'python';
  tests: TestCase[];
  dependencies: string[];
  exports: string[];
  complexity: {
    cyclomatic: number;
    cognitive: number;
  };
}

export interface TestCase {
  name: string;
  type: 'unit' | 'integration' | 'e2e';
  code: string;
  assertions: number;
}

export interface GenerationOptions {
  targetFramework: 'react' | 'node' | 'both';
  includeTests: boolean;
  strictTypes: boolean;
  accessibilityLevel: 'A' | 'AA' | 'AAA';
}

export class CodeGeneratorA {
  private options: GenerationOptions;

  constructor(options: Partial<GenerationOptions> = {}) {
    this.options = {
      targetFramework: 'react',
      includeTests: true,
      strictTypes: true,
      accessibilityLevel: 'AA',
      ...options,
    };
  }

  /**
   * Generate code from architecture design (sync stub for backwards compat).
   * For real LLM-powered generation, use generateWithLLM().
   */
  generate(design: { components: Array<{ name: string; type: string }> }): GeneratedCode {
    return {
      id: `gen-a-${Date.now()}`,
      code: '// Pending LLM code generation',
      language: 'typescript',
      tests: [],
      dependencies: [],
      exports: design.components.map((c) => c.name),
      complexity: { cyclomatic: 0, cognitive: 0 },
    };
  }

  /**
   * Generate code using LLM analysis.
   */
  async generateWithLLM(input: {
    architecture: {
      overview: string;
      components: Array<{ name: string; type: string; responsibility: string; interfaces?: string[]; dependencies?: string[] }>;
      dataFlows?: Array<{ from: string; to: string; data: string }>;
    };
    requirements?: Array<{ id: string; text: string }>;
    specification?: string;
  }): Promise<GeneratedCode> {
    const systemPrompt = getAgentPrompt('A3_codegen_a');

    const componentList = input.architecture.components
      .map((c) => `- ${c.name} (${c.type}): ${c.responsibility}${c.interfaces?.length ? `\n  Interfaces: ${c.interfaces.join(', ')}` : ''}${c.dependencies?.length ? `\n  Dependencies: ${c.dependencies.join(', ')}` : ''}`)
      .join('\n');

    const flowList = (input.architecture.dataFlows || [])
      .map((f) => `- ${f.from} -> ${f.to}: ${f.data}`)
      .join('\n');

    const reqList = (input.requirements || [])
      .map((r) => `- [${r.id}]: ${r.text}`)
      .join('\n');

    const userPrompt = `Generate production-quality TypeScript/React code for the following architecture.

Architecture Overview: ${input.architecture.overview}

Components to implement:
${componentList}

${flowList ? `Data Flows:\n${flowList}` : ''}
${reqList ? `Requirements:\n${reqList}` : ''}

Generation options:
- Framework: ${this.options.targetFramework}
- Include tests: ${this.options.includeTests}
- Strict TypeScript: ${this.options.strictTypes}
- Accessibility: WCAG 2.1 Level ${this.options.accessibilityLevel}

Requirements:
- Full TypeScript type safety (no 'any' types)
- Comprehensive error handling with Error boundaries
- Loading and error states for async operations
- JSDoc comments for public APIs
- Unit tests for all functions (if includeTests is true)

Return JSON:
{
  "code": "// Full TypeScript/React implementation code",
  "tests": [
    { "name": "test name", "type": "unit|integration|e2e", "code": "// test code", "assertions": 3 }
  ],
  "dependencies": ["package-name"],
  "exports": ["ExportedName"],
  "complexity": { "cyclomatic": 5, "cognitive": 3 }
}`;

    const response = await callLLM({
      systemPrompt,
      userPrompt,
      agentRole: 'A3_codegen_a',
      maxTokens: 8192,
      temperature: 0.3,
    });

    const parsed = parseJSONResponse<any>(response.result);
    return this.mapToGeneratedCode(parsed);
  }

  /**
   * Process LLM response from A0 orchestrator.
   */
  processResult(llmOutput: Record<string, unknown>): GeneratedCode {
    return this.mapToGeneratedCode(llmOutput);
  }

  private mapToGeneratedCode(parsed: any): GeneratedCode {
    const tests: TestCase[] = (parsed.tests || []).map((t: any) => ({
      name: t.name || 'unnamed test',
      type: t.type || 'unit',
      code: t.code || '',
      assertions: t.assertions || 1,
    }));

    const code = parsed.code || '';

    return {
      id: `gen-a-${Date.now()}`,
      code,
      language: 'typescript',
      tests,
      dependencies: parsed.dependencies || [],
      exports: parsed.exports || [],
      complexity: {
        cyclomatic: parsed.complexity?.cyclomatic || this.calculateCyclomaticComplexity(code),
        cognitive: parsed.complexity?.cognitive || this.calculateCognitiveComplexity(code),
      },
    };
  }

  /**
   * Calculate cyclomatic complexity from code string.
   */
  calculateCyclomaticComplexity(code: string): number {
    const decisions = (code.match(/\b(if|else if|while|for|case|catch|\?\?|&&|\|\|)\b/g) || []).length;
    return decisions + 1;
  }

  /**
   * Calculate cognitive complexity from code string.
   */
  calculateCognitiveComplexity(code: string): number {
    let complexity = 0;
    let nestingLevel = 0;
    const lines = code.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();

      // Track nesting
      if (trimmed.match(/\b(if|for|while|switch)\b.*\{/)) {
        complexity += 1 + nestingLevel;
        nestingLevel++;
      } else if (trimmed.match(/\b(else if)\b/)) {
        complexity += 1 + nestingLevel;
      } else if (trimmed.match(/\b(else)\b.*\{/)) {
        complexity += 1;
      } else if (trimmed === '}') {
        nestingLevel = Math.max(0, nestingLevel - 1);
      }

      // Ternary operators add complexity
      if (trimmed.includes('?') && trimmed.includes(':') && !trimmed.startsWith('//')) {
        complexity += 1 + nestingLevel;
      }
    }

    return complexity;
  }

  /**
   * Validate generated code for quality standards.
   */
  validateCode(generated: GeneratedCode): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!generated.code || generated.code.length < 50) {
      issues.push('Generated code is too short or empty');
    }

    if (this.options.strictTypes && generated.code.includes(': any')) {
      const anyCount = (generated.code.match(/:\s*any\b/g) || []).length;
      issues.push(`Code contains ${anyCount} 'any' type(s) - strict mode requires proper types`);
    }

    if (generated.code.includes('// TODO')) {
      issues.push('Code contains TODO comments - implementation may be incomplete');
    }

    if (this.options.includeTests && generated.tests.length === 0) {
      issues.push('No tests generated despite includeTests option');
    }

    if (generated.complexity.cyclomatic > 15) {
      issues.push(`High cyclomatic complexity (${generated.complexity.cyclomatic}) - consider refactoring`);
    }

    if (generated.complexity.cognitive > 20) {
      issues.push(`High cognitive complexity (${generated.complexity.cognitive}) - consider simplifying`);
    }

    // Check for error handling
    if (generated.code.includes('async') && !generated.code.includes('catch')) {
      issues.push('Async code without error handling detected');
    }

    return { valid: issues.length === 0, issues };
  }
}
