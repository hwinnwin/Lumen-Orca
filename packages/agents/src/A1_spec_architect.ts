/**
 * A1: Spec Agent
 * Role: Requirements parser and validator
 * Inputs: Natural language requirements
 * Outputs: Formal specification document
 * Quality: Checks completeness, unambiguity, testability
 *
 * This agent transforms natural language requirements into formal,
 * testable specifications with acceptance criteria and test scenarios.
 * It uses LLM analysis for parsing and local heuristics for validation.
 */

import { callLLM, parseJSONResponse, validateRequiredFields } from './llm-client';
import { getAgentPrompt } from './prompts';

export interface Specification {
  id: string;
  title: string;
  description: string;
  requirements: Requirement[];
  assumptions: string[];
  constraints: string[];
  risks: Array<{ description: string; mitigation: string }>;
  testable: boolean;
  complete: boolean;
  complexity: 'low' | 'medium' | 'high';
  estimatedEffort: string;
}

export interface Requirement {
  id: string;
  type: 'functional' | 'non-functional' | 'constraint';
  text: string;
  priority: 'must' | 'should' | 'could' | 'wont';
  testable: boolean;
  acceptanceCriteria: string[];
  testScenarios: string[];
}

export class SpecAgent {
  /**
   * Parse natural language into a specification (sync stub for backwards compat).
   * For real LLM-powered parsing, use parseWithLLM().
   */
  parse(naturalLanguage: string): Specification {
    return {
      id: `spec-${Date.now()}`,
      title: 'Pending LLM Analysis',
      description: naturalLanguage,
      requirements: [],
      assumptions: [],
      constraints: [],
      risks: [],
      testable: false,
      complete: false,
      complexity: 'medium',
      estimatedEffort: 'Unknown - requires LLM analysis',
    };
  }

  /**
   * Parse natural language requirements using LLM analysis.
   * This is the real implementation that calls the LLM proxy.
   */
  async parseWithLLM(naturalLanguage: string): Promise<Specification> {
    const systemPrompt = getAgentPrompt('A1_spec');

    const userPrompt = `Analyze the following requirements and produce a formal specification.

Requirements:
${naturalLanguage}

Return a JSON object with this exact structure:
{
  "specification": {
    "title": "string",
    "description": "string",
    "requirements": [
      {
        "id": "REQ-001",
        "type": "functional|non-functional|constraint",
        "priority": "must|should|could|wont",
        "description": "string",
        "acceptanceCriteria": ["string"],
        "testScenarios": ["string"]
      }
    ],
    "assumptions": ["string"],
    "constraints": ["string"],
    "risks": [{"description": "string", "mitigation": "string"}]
  },
  "testable": true|false,
  "complexity": "low|medium|high",
  "estimatedEffort": "string"
}`;

    const response = await callLLM({
      systemPrompt,
      userPrompt,
      agentRole: 'A1_spec',
      maxTokens: 4096,
      temperature: 0.3,
    });

    const parsed = parseJSONResponse<any>(response.result);

    // Handle nested specification object or flat structure
    const specData = parsed.specification || parsed;

    const requirements: Requirement[] = (specData.requirements || []).map(
      (req: any, index: number) => ({
        id: req.id || `REQ-${String(index + 1).padStart(3, '0')}`,
        type: req.type || 'functional',
        text: req.description || req.text || '',
        priority: req.priority || 'should',
        testable: (req.acceptanceCriteria?.length > 0) || (req.testScenarios?.length > 0),
        acceptanceCriteria: req.acceptanceCriteria || [],
        testScenarios: req.testScenarios || [],
      })
    );

    const spec: Specification = {
      id: `spec-${Date.now()}`,
      title: specData.title || 'Parsed Specification',
      description: specData.description || naturalLanguage,
      requirements,
      assumptions: specData.assumptions || [],
      constraints: specData.constraints || [],
      risks: (specData.risks || []).map((r: any) => ({
        description: r.description || String(r),
        mitigation: r.mitigation || 'Needs assessment',
      })),
      testable: parsed.testable ?? requirements.every((r) => r.testable),
      complete: requirements.length > 0,
      complexity: parsed.complexity || 'medium',
      estimatedEffort: parsed.estimatedEffort || 'Requires further estimation',
    };

    return spec;
  }

  /**
   * Process LLM response from A0 orchestrator.
   * Called when A0 has already made the LLM call and passes the parsed result.
   */
  processResult(llmOutput: Record<string, unknown>): Specification {
    const specData = (llmOutput.specification as any) || llmOutput;

    const requirements: Requirement[] = ((specData.requirements || []) as any[]).map(
      (req: any, index: number) => ({
        id: req.id || `REQ-${String(index + 1).padStart(3, '0')}`,
        type: req.type || 'functional',
        text: req.description || req.text || '',
        priority: req.priority || 'should',
        testable: (req.acceptanceCriteria?.length > 0) || (req.testScenarios?.length > 0),
        acceptanceCriteria: req.acceptanceCriteria || [],
        testScenarios: req.testScenarios || [],
      })
    );

    return {
      id: `spec-${Date.now()}`,
      title: specData.title || 'Parsed Specification',
      description: specData.description || '',
      requirements,
      assumptions: specData.assumptions || [],
      constraints: specData.constraints || [],
      risks: (specData.risks || []).map((r: any) => ({
        description: r.description || String(r),
        mitigation: r.mitigation || 'Needs assessment',
      })),
      testable: llmOutput.testable as boolean ?? requirements.every((r) => r.testable),
      complete: requirements.length > 0,
      complexity: (llmOutput.complexity as string as Specification['complexity']) || 'medium',
      estimatedEffort: (llmOutput.estimatedEffort as string) || 'Requires further estimation',
    };
  }

  /**
   * Validate a specification for completeness and quality.
   * Uses heuristic checks - no LLM needed.
   */
  validate(spec: Specification): { valid: boolean; issues: string[]; score: number } {
    const issues: string[] = [];
    let score = 100;

    // Check for empty requirements
    if (spec.requirements.length === 0) {
      issues.push('No requirements defined');
      score -= 40;
    }

    // Check each requirement for quality
    for (const req of spec.requirements) {
      if (!req.text || req.text.trim().length < 10) {
        issues.push(`${req.id}: Requirement text is too short or empty`);
        score -= 5;
      }

      if (req.acceptanceCriteria.length === 0) {
        issues.push(`${req.id}: No acceptance criteria defined`);
        score -= 5;
      }

      if (req.testScenarios.length === 0) {
        issues.push(`${req.id}: No test scenarios defined`);
        score -= 3;
      }

      if (!req.testable) {
        issues.push(`${req.id}: Requirement is not testable`);
        score -= 5;
      }

      // Check for ambiguous language
      const ambiguousWords = ['maybe', 'possibly', 'etc', 'and/or', 'appropriate', 'reasonable', 'as needed'];
      for (const word of ambiguousWords) {
        if (req.text.toLowerCase().includes(word)) {
          issues.push(`${req.id}: Contains ambiguous language "${word}"`);
          score -= 2;
        }
      }
    }

    // Check for must-have requirements
    const mustHaves = spec.requirements.filter((r) => r.priority === 'must');
    if (mustHaves.length === 0 && spec.requirements.length > 0) {
      issues.push('No "must-have" priority requirements defined');
      score -= 10;
    }

    // Check for assumptions and constraints
    if (spec.assumptions.length === 0) {
      issues.push('No assumptions documented');
      score -= 5;
    }

    if (spec.constraints.length === 0) {
      issues.push('No constraints documented');
      score -= 5;
    }

    // Check for risks
    if (spec.risks.length === 0) {
      issues.push('No risks identified');
      score -= 5;
    }

    // Check overall testability
    if (!spec.testable) {
      issues.push('Specification contains non-testable requirements');
      score -= 10;
    }

    // Check completeness
    if (!spec.complete) {
      issues.push('Specification is marked as incomplete');
      score -= 15;
    }

    // Check requirement type diversity
    const types = new Set(spec.requirements.map((r) => r.type));
    if (spec.requirements.length > 3 && !types.has('non-functional')) {
      issues.push('No non-functional requirements defined (consider performance, security, usability)');
      score -= 5;
    }

    score = Math.max(0, score);

    return {
      valid: issues.length === 0,
      issues,
      score,
    };
  }
}
