/**
 * A1: Spec Agent
 * Role: Requirements parser and validator
 * Inputs: Natural language requirements
 * Outputs: Formal specification document
 * Quality: Checks completeness, unambiguity, testability
 */

export interface Specification {
  id: string;
  title: string;
  description: string;
  requirements: Requirement[];
  testable: boolean;
  complete: boolean;
}

export interface Requirement {
  id: string;
  text: string;
  priority: 'must' | 'should' | 'could';
  testable: boolean;
}

export class SpecAgent {
  parse(naturalLanguage: string): Specification {
    // Stub: Real implementation would use NLP/LLM
    return {
      id: `spec-${Date.now()}`,
      title: 'Parsed Specification',
      description: naturalLanguage,
      requirements: [],
      testable: true,
      complete: true
    };
  }

  validate(spec: Specification): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!spec.testable) {
      issues.push('Specification contains non-testable requirements');
    }

    if (!spec.complete) {
      issues.push('Specification is incomplete');
    }

    if (spec.requirements.length === 0) {
      issues.push('No requirements defined');
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }
}
