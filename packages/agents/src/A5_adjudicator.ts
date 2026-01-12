/**
 * A5: Code Adjudicator Agent
 * Role: Evaluate and merge competing implementations from A3 and A4
 * Inputs: Generated code from both code generators
 * Outputs: Selected or merged best solution with rationale
 */

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
  correctness: number;      // 0-10
  performance: number;      // 0-10
  maintainability: number;  // 0-10
  testCoverage: number;     // 0-10
  security: number;         // 0-10
  total: number;            // Weighted 0-100
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

// Scoring weights for P69 compliance
const WEIGHTS = {
  correctness: 0.30,      // 30%
  performance: 0.20,      // 20%
  maintainability: 0.20,  // 20%
  testCoverage: 0.15,     // 15%
  security: 0.15,         // 15%
};

export class CodeAdjudicator {
  /**
   * Evaluate and adjudicate between two code submissions
   */
  adjudicate(submissionA: CodeSubmission, submissionB: CodeSubmission): AdjudicationResult {
    const scoreA = this.scoreSubmission(submissionA);
    const scoreB = this.scoreSubmission(submissionB);

    const conflicts = this.identifyConflicts(submissionA, submissionB);

    let chosen: 'A3' | 'A4' | 'merged';
    let mergedCode: string | undefined;
    let rationale: string;

    if (Math.abs(scoreA.total - scoreB.total) < 5) {
      // Scores are close - try to merge
      chosen = 'merged';
      mergedCode = this.mergeCode(submissionA, submissionB, conflicts);
      rationale = `Scores were close (A3: ${scoreA.total}, A4: ${scoreB.total}). Merged to combine strengths of both implementations.`;
    } else if (scoreA.total > scoreB.total) {
      chosen = 'A3';
      rationale = `A3 scored higher (${scoreA.total} vs ${scoreB.total}). Selected for superior ${this.getTopStrength(scoreA, scoreB)}.`;
    } else {
      chosen = 'A4';
      rationale = `A4 scored higher (${scoreB.total} vs ${scoreA.total}). Selected for superior ${this.getTopStrength(scoreB, scoreA)}.`;
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

  private scoreSubmission(submission: CodeSubmission): CodeScore {
    // In production, these would use actual static analysis tools
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
    // Check for TypeScript errors, test pass rate
    let score = 8;
    if (submission.code.includes('any')) score -= 1;
    if (submission.code.includes('// TODO')) score -= 0.5;
    if (submission.tests.length > 0) score += 1;
    return Math.min(10, Math.max(0, score));
  }

  private analyzePerformance(submission: CodeSubmission): number {
    // Check for performance anti-patterns
    let score = 8;
    if (submission.code.match(/for.*for.*for/)) score -= 2; // Triple nested loops
    if (submission.code.includes('useMemo') || submission.code.includes('useCallback')) score += 1;
    return Math.min(10, Math.max(0, score));
  }

  private analyzeMaintainability(submission: CodeSubmission): number {
    // Check code organization, naming, documentation
    let score = 7;
    const lines = submission.code.split('\n').length;
    if (lines < 500) score += 1; // Not too large
    if (submission.code.includes('/**')) score += 1; // Has JSDoc
    if (submission.code.includes('export')) score += 0.5; // Proper exports
    return Math.min(10, Math.max(0, score));
  }

  private analyzeTestCoverage(submission: CodeSubmission): number {
    // Estimate test coverage based on test count vs code size
    const codeLines = submission.code.split('\n').length;
    const testCount = submission.tests.length;
    const ratio = testCount / (codeLines / 50); // Expect 1 test per 50 lines
    return Math.min(10, Math.max(0, ratio * 8));
  }

  private analyzeSecurity(submission: CodeSubmission): number {
    // Check for common security issues
    let score = 8;
    if (submission.code.includes('eval(')) score -= 5;
    if (submission.code.includes('innerHTML')) score -= 2;
    if (submission.code.includes('dangerouslySetInnerHTML')) score -= 1;
    if (submission.code.includes('sanitize')) score += 1;
    return Math.min(10, Math.max(0, score));
  }

  private identifyConflicts(a: CodeSubmission, b: CodeSubmission): Conflict[] {
    const conflicts: Conflict[] = [];

    // Check for different approaches to same functionality
    if (a.dependencies.join() !== b.dependencies.join()) {
      conflicts.push({
        location: 'dependencies',
        description: 'Different dependency choices',
        resolution: 'Prefer lighter-weight dependencies unless features required',
      });
    }

    return conflicts;
  }

  private mergeCode(a: CodeSubmission, b: CodeSubmission, conflicts: Conflict[]): string {
    // Simplified merge - in production would use AST analysis
    return `
// MERGED IMPLEMENTATION
// Combines best aspects of A3 and A4

${a.code}

// Additional patterns from B:
// ${b.code.slice(0, 200)}...
`;
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
