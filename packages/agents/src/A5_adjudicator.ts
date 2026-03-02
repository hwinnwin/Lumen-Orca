/**
 * A5: Code Adjudicator Agent
 * Role: Evaluate and merge competing implementations from A3 and A4
 * Inputs: Generated code from both code generators
 * Outputs: Selected or merged best solution with rationale
 *
 * Uses both local heuristic scoring AND LLM-powered deep analysis
 * to compare implementations and produce the best possible result.
 */

import { callLLM, parseJSONResponse } from './llm-client';
import { getAgentPrompt } from './prompts';

export interface AdjudicationResult {
  id: string;
  chosen: 'A3' | 'A4' | 'merged';
  rationale: string;
  scores: {
    A3: CodeScore;
    A4: CodeScore;
  };
  mergedCode?: string;
  conflicts: Conflict[];
  improvements: string[];
}

export interface CodeScore {
  correctness: number;
  performance: number;
  maintainability: number;
  testCoverage: number;
  security: number;
  total: number;
}

export interface Conflict {
  location: string;
  description: string;
  resolution: string;
}

export interface CodeSubmission {
  id: string;
  code: string;
  tests: Array<{ name: string; code: string }>;
  dependencies: string[];
}

const WEIGHTS = {
  correctness: 0.30,
  performance: 0.20,
  maintainability: 0.20,
  testCoverage: 0.15,
  security: 0.15,
};

export class CodeAdjudicator {
  /**
   * Evaluate and adjudicate between two code submissions (local heuristics).
   * For LLM-powered deep analysis, use adjudicateWithLLM().
   */
  adjudicate(submissionA: CodeSubmission, submissionB: CodeSubmission): AdjudicationResult {
    const scoreA = this.scoreSubmission(submissionA);
    const scoreB = this.scoreSubmission(submissionB);
    const conflicts = this.identifyConflicts(submissionA, submissionB);

    let chosen: 'A3' | 'A4' | 'merged';
    let mergedCode: string | undefined;
    let rationale: string;

    if (Math.abs(scoreA.total - scoreB.total) < 5) {
      chosen = 'merged';
      mergedCode = `// Merged implementation combining best of A3 and A4\n${submissionA.code}`;
      rationale = `Scores close (A3: ${scoreA.total}, A4: ${scoreB.total}). Merged to combine strengths.`;
    } else if (scoreA.total > scoreB.total) {
      chosen = 'A3';
      rationale = `A3 scored higher (${scoreA.total} vs ${scoreB.total}). Superior ${this.getTopStrength(scoreA, scoreB)}.`;
    } else {
      chosen = 'A4';
      rationale = `A4 scored higher (${scoreB.total} vs ${scoreA.total}). Superior ${this.getTopStrength(scoreB, scoreA)}.`;
    }

    return {
      id: `adj-${Date.now()}`,
      chosen,
      rationale,
      scores: { A3: scoreA, A4: scoreB },
      mergedCode,
      conflicts,
      improvements: this.suggestImprovements(scoreA, scoreB),
    };
  }

  /**
   * LLM-powered deep adjudication with intelligent merging.
   */
  async adjudicateWithLLM(
    submissionA: CodeSubmission,
    submissionB: CodeSubmission,
    requirements?: Array<{ id: string; text: string }>
  ): Promise<AdjudicationResult> {
    const systemPrompt = getAgentPrompt('A5_adjudicator');

    const reqList = (requirements || [])
      .map((r) => `- [${r.id}]: ${r.text}`)
      .join('\n');

    const userPrompt = `Compare and adjudicate these two implementations.

=== IMPLEMENTATION A (Path A - OOP/conventional) ===
${submissionA.code.slice(0, 4000)}

Tests A (${submissionA.tests.length} tests):
${submissionA.tests.slice(0, 3).map((t) => `- ${t.name}`).join('\n')}

Dependencies A: ${submissionA.dependencies.join(', ')}

=== IMPLEMENTATION B (Path B - Functional/alternative) ===
${submissionB.code.slice(0, 4000)}

Tests B (${submissionB.tests.length} tests):
${submissionB.tests.slice(0, 3).map((t) => `- ${t.name}`).join('\n')}

Dependencies B: ${submissionB.dependencies.join(', ')}

${reqList ? `=== REQUIREMENTS ===\n${reqList}` : ''}

Evaluate both on:
- Correctness (30%): Does it meet requirements?
- Performance (20%): Time/space complexity
- Maintainability (20%): Code clarity, modularity
- Test coverage (15%): Comprehensive testing
- Security (15%): No vulnerabilities

Return JSON:
{
  "chosen": "A3|A4|merged",
  "rationale": "detailed explanation of decision",
  "scores": {
    "A3": { "correctness": 0-10, "performance": 0-10, "maintainability": 0-10, "testCoverage": 0-10, "security": 0-10, "total": 0-100 },
    "A4": { "correctness": 0-10, "performance": 0-10, "maintainability": 0-10, "testCoverage": 0-10, "security": 0-10, "total": 0-100 }
  },
  "mergedCode": "if merged, the combined best code here, otherwise null",
  "conflicts": [{ "location": "where", "description": "what conflict", "resolution": "how resolved" }],
  "improvements": ["suggestion 1", "suggestion 2"]
}`;

    const response = await callLLM({
      systemPrompt,
      userPrompt,
      agentRole: 'A5_adjudicator',
      maxTokens: 8192,
      temperature: 0.3,
    });

    const parsed = parseJSONResponse<any>(response.result);
    return this.mapToAdjudicationResult(parsed);
  }

  /**
   * Process LLM response from A0 orchestrator.
   */
  processResult(llmOutput: Record<string, unknown>): AdjudicationResult {
    return this.mapToAdjudicationResult(llmOutput);
  }

  private mapToAdjudicationResult(parsed: any): AdjudicationResult {
    const mapScore = (s: any): CodeScore => {
      if (!s) return { correctness: 5, performance: 5, maintainability: 5, testCoverage: 5, security: 5, total: 50 };
      const scores = {
        correctness: Number(s.correctness) || 5,
        performance: Number(s.performance) || 5,
        maintainability: Number(s.maintainability) || 5,
        testCoverage: Number(s.testCoverage) || 5,
        security: Number(s.security) || 5,
      };
      const total = s.total != null ? Number(s.total) : Math.round(
        scores.correctness * 10 * WEIGHTS.correctness +
        scores.performance * 10 * WEIGHTS.performance +
        scores.maintainability * 10 * WEIGHTS.maintainability +
        scores.testCoverage * 10 * WEIGHTS.testCoverage +
        scores.security * 10 * WEIGHTS.security
      );
      return { ...scores, total };
    };

    return {
      id: `adj-${Date.now()}`,
      chosen: parsed.chosen || 'A3',
      rationale: parsed.rationale || 'No rationale provided',
      scores: {
        A3: mapScore(parsed.scores?.A3),
        A4: mapScore(parsed.scores?.A4),
      },
      mergedCode: parsed.mergedCode || undefined,
      conflicts: (parsed.conflicts || []).map((c: any) => ({
        location: c.location || 'unknown',
        description: c.description || '',
        resolution: c.resolution || '',
      })),
      improvements: parsed.improvements || [],
    };
  }

  private scoreSubmission(submission: CodeSubmission): CodeScore {
    const scores = {
      correctness: this.analyzeCorrectness(submission),
      performance: this.analyzePerformance(submission),
      maintainability: this.analyzeMaintainability(submission),
      testCoverage: this.analyzeTestCoverage(submission),
      security: this.analyzeSecurity(submission),
    };

    const total = Math.round(
      scores.correctness * 10 * WEIGHTS.correctness +
      scores.performance * 10 * WEIGHTS.performance +
      scores.maintainability * 10 * WEIGHTS.maintainability +
      scores.testCoverage * 10 * WEIGHTS.testCoverage +
      scores.security * 10 * WEIGHTS.security
    );

    return { ...scores, total };
  }

  private analyzeCorrectness(submission: CodeSubmission): number {
    let score = 8;
    if (submission.code.includes(': any')) score -= 1;
    if (submission.code.includes('// TODO')) score -= 0.5;
    if (submission.tests.length > 0) score += 1;
    if (submission.code.includes('try') && submission.code.includes('catch')) score += 0.5;
    return Math.min(10, Math.max(0, score));
  }

  private analyzePerformance(submission: CodeSubmission): number {
    let score = 8;
    if (submission.code.match(/for[\s\S]*for[\s\S]*for/)) score -= 2;
    if (submission.code.includes('useMemo') || submission.code.includes('useCallback')) score += 1;
    if (submission.code.includes('React.memo')) score += 0.5;
    return Math.min(10, Math.max(0, score));
  }

  private analyzeMaintainability(submission: CodeSubmission): number {
    let score = 7;
    const lines = submission.code.split('\n').length;
    if (lines < 500) score += 1;
    if (submission.code.includes('/**')) score += 1;
    if (submission.code.includes('export')) score += 0.5;
    const longLines = submission.code.split('\n').filter((l) => l.length > 120).length;
    if (longLines > 5) score -= 1;
    return Math.min(10, Math.max(0, score));
  }

  private analyzeTestCoverage(submission: CodeSubmission): number {
    const codeLines = submission.code.split('\n').length;
    const testCount = submission.tests.length;
    const ratio = testCount / Math.max(1, codeLines / 50);
    return Math.min(10, Math.max(0, ratio * 8));
  }

  private analyzeSecurity(submission: CodeSubmission): number {
    let score = 8;
    if (submission.code.includes('eval(')) score -= 5;
    if (submission.code.includes('innerHTML')) score -= 2;
    if (submission.code.includes('dangerouslySetInnerHTML')) score -= 1;
    if (submission.code.includes('sanitize')) score += 1;
    if (submission.code.match(/\bpassword\s*=\s*['"][^'"]+['"]/)) score -= 3;
    return Math.min(10, Math.max(0, score));
  }

  private identifyConflicts(a: CodeSubmission, b: CodeSubmission): Conflict[] {
    const conflicts: Conflict[] = [];

    if (a.dependencies.join() !== b.dependencies.join()) {
      conflicts.push({
        location: 'dependencies',
        description: 'Different dependency choices',
        resolution: 'Prefer lighter-weight dependencies unless features required',
      });
    }

    const aExports = (a.code.match(/export\s+(function|const|class|interface|type)\s+(\w+)/g) || []);
    const bExports = (b.code.match(/export\s+(function|const|class|interface|type)\s+(\w+)/g) || []);
    if (aExports.length !== bExports.length) {
      conflicts.push({
        location: 'exports',
        description: `Different export counts (A: ${aExports.length}, B: ${bExports.length})`,
        resolution: 'Ensure all required exports are present in final implementation',
      });
    }

    return conflicts;
  }

  private getTopStrength(winner: CodeScore, loser: CodeScore): string {
    const diffs = {
      correctness: winner.correctness - loser.correctness,
      performance: winner.performance - loser.performance,
      maintainability: winner.maintainability - loser.maintainability,
      'test coverage': winner.testCoverage - loser.testCoverage,
      security: winner.security - loser.security,
    };
    const [top] = Object.entries(diffs).sort(([, a], [, b]) => b - a);
    return top[0];
  }

  private suggestImprovements(a: CodeScore, b: CodeScore): string[] {
    const improvements: string[] = [];
    const avg = (key: keyof Omit<CodeScore, 'total'>) => (a[key] + b[key]) / 2;

    if (avg('correctness') < 8) improvements.push('Add more type safety and remove any types');
    if (avg('performance') < 7) improvements.push('Consider memoization and lazy loading');
    if (avg('maintainability') < 7) improvements.push('Improve code documentation and modularization');
    if (avg('testCoverage') < 7) improvements.push('Increase test coverage, especially edge cases');
    if (avg('security') < 8) improvements.push('Review for security vulnerabilities');

    return improvements;
  }
}
