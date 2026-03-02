/**
 * Cross-Reference Verifier
 *
 * The heart of the Dragon Architect pattern.
 * Truth emerges from agreement across multiple verification angles.
 *
 * Key principle: No artifact is "true" until verified from multiple perspectives.
 */

import {
  Artifact,
  CrossReference,
  CrossReferenceType,
  VerificationResult,
  VerificationStatus,
  Issue,
  createPendingVerification,
} from './types.js';

// === Verification Engine ===

export class Verifier {
  /**
   * Verify an artifact against multiple reference points
   */
  async verifyArtifact(
    artifact: Artifact,
    references: Map<CrossReferenceType, Artifact[]>
  ): Promise<VerificationStatus> {
    const status = createPendingVerification();
    const crossRefs: CrossReference[] = [];

    // Verify against each reference type
    for (const [refType, refArtifacts] of references) {
      for (const refArtifact of refArtifacts) {
        const crossRef = await this.createCrossReference(
          artifact,
          refArtifact,
          refType
        );
        crossRefs.push(crossRef);
      }
    }

    status.crossReferences = crossRefs;

    // Update dimensions based on cross-references
    status.dimensions = this.computeDimensions(crossRefs);

    // Compute overall status and confidence
    status.overall = this.computeOverallResult(status.dimensions);
    status.confidence = this.computeConfidence(crossRefs);

    return status;
  }

  /**
   * Create a cross-reference between two artifacts
   */
  async createCrossReference(
    source: Artifact,
    target: Artifact,
    relationship: CrossReferenceType
  ): Promise<CrossReference> {
    const verification = await this.verify(source, target, relationship);

    return {
      id: `xref-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sourceArtifact: source.id,
      targetArtifact: target.id,
      relationship,
      result: verification.result,
      confidence: verification.confidence,
      reasoning: verification.reasoning,
      issues: verification.issues,
      verifiedAt: new Date(),
    };
  }

  /**
   * Perform the actual verification between two artifacts
   * This is where the LLM-powered analysis happens
   */
  private async verify(
    source: Artifact,
    target: Artifact,
    relationship: CrossReferenceType
  ): Promise<{
    result: VerificationResult;
    confidence: number;
    reasoning: string;
    issues: Issue[];
  }> {
    // Route to specific verifier based on relationship type
    switch (relationship) {
      case 'implements':
        return this.verifyImplements(source, target);
      case 'tests':
        return this.verifyTests(source, target);
      case 'covers':
        return this.verifyCovers(source, target);
      case 'conforms':
        return this.verifyConforms(source, target);
      case 'consistent':
        return this.verifyConsistent(source, target);
      case 'validates':
        return this.verifyValidates(source, target);
      case 'resolves':
        return this.verifyResolves(source, target);
      default:
        return {
          result: 'pending',
          confidence: 0,
          reasoning: `Unknown relationship type: ${relationship}`,
          issues: [],
        };
    }
  }

  /**
   * Verify: Code implements Spec
   * Check that generated code fulfills all requirements in the spec
   */
  private async verifyImplements(
    code: Artifact,
    spec: Artifact
  ): Promise<{
    result: VerificationResult;
    confidence: number;
    reasoning: string;
    issues: Issue[];
  }> {
    // Extract requirements from spec
    const requirements = this.extractRequirements(spec.content);
    const issues: Issue[] = [];

    // Check each requirement against the code
    let implemented = 0;
    let missing = 0;
    let partial = 0;

    for (const req of requirements) {
      const check = this.checkRequirementInCode(req, code.content);
      if (check === 'implemented') {
        implemented++;
      } else if (check === 'partial') {
        partial++;
        issues.push({
          severity: 'warning',
          message: `Requirement partially implemented: ${req}`,
          suggestion: 'Review implementation for completeness',
        });
      } else {
        missing++;
        issues.push({
          severity: 'error',
          message: `Requirement not implemented: ${req}`,
          suggestion: 'Add implementation for this requirement',
        });
      }
    }

    const total = requirements.length || 1;
    const score = (implemented + partial * 0.5) / total;

    return {
      result: missing === 0 && partial === 0 ? 'pass' : missing === 0 ? 'partial' : 'fail',
      confidence: score,
      reasoning: `${implemented}/${total} requirements fully implemented, ${partial} partial, ${missing} missing`,
      issues,
    };
  }

  /**
   * Verify: Test tests Code
   * Check that tests actually exercise the code
   */
  private async verifyTests(
    test: Artifact,
    code: Artifact
  ): Promise<{
    result: VerificationResult;
    confidence: number;
    reasoning: string;
    issues: Issue[];
  }> {
    const issues: Issue[] = [];

    // Extract functions/classes from code
    const codeElements = this.extractCodeElements(code.content);

    // Extract test cases from test
    const testCases = this.extractTestCases(test.content);

    // Check coverage
    let covered = 0;
    const uncovered: string[] = [];

    for (const element of codeElements) {
      const isTested = testCases.some((tc) =>
        tc.toLowerCase().includes(element.toLowerCase())
      );
      if (isTested) {
        covered++;
      } else {
        uncovered.push(element);
        issues.push({
          severity: 'warning',
          message: `No test found for: ${element}`,
          suggestion: `Add test case for ${element}`,
        });
      }
    }

    const total = codeElements.length || 1;
    const coverage = covered / total;

    return {
      result: coverage >= 0.8 ? 'pass' : coverage >= 0.5 ? 'partial' : 'fail',
      confidence: coverage,
      reasoning: `${covered}/${total} code elements have test coverage (${Math.round(coverage * 100)}%)`,
      issues,
    };
  }

  /**
   * Verify: Test covers Spec requirement
   * Check that tests cover all specification requirements
   */
  private async verifyCovers(
    test: Artifact,
    spec: Artifact
  ): Promise<{
    result: VerificationResult;
    confidence: number;
    reasoning: string;
    issues: Issue[];
  }> {
    const requirements = this.extractRequirements(spec.content);
    const testCases = this.extractTestCases(test.content);
    const issues: Issue[] = [];

    let covered = 0;

    for (const req of requirements) {
      // Check if any test case mentions this requirement
      const isCovered = testCases.some((tc) =>
        this.semanticMatch(tc, req)
      );
      if (isCovered) {
        covered++;
      } else {
        issues.push({
          severity: 'error',
          message: `Requirement not tested: ${req}`,
          suggestion: `Add test case for: ${req}`,
        });
      }
    }

    const total = requirements.length || 1;
    const coverage = covered / total;

    return {
      result: coverage >= 0.9 ? 'pass' : coverage >= 0.7 ? 'partial' : 'fail',
      confidence: coverage,
      reasoning: `${covered}/${total} requirements have test coverage`,
      issues,
    };
  }

  /**
   * Verify: Code conforms to Contract
   * Check that code follows defined interfaces
   */
  private async verifyConforms(
    code: Artifact,
    contract: Artifact
  ): Promise<{
    result: VerificationResult;
    confidence: number;
    reasoning: string;
    issues: Issue[];
  }> {
    const interfaces = this.extractInterfaces(contract.content);
    const implementations = this.extractImplementations(code.content);
    const issues: Issue[] = [];

    let conforming = 0;

    for (const iface of interfaces) {
      const impl = implementations.find((i) => i.name === iface.name);
      if (!impl) {
        issues.push({
          severity: 'error',
          message: `Interface not implemented: ${iface.name}`,
        });
        continue;
      }

      // Check method signatures match
      const methodsMatch = this.compareSignatures(iface.methods, impl.methods);
      if (methodsMatch) {
        conforming++;
      } else {
        issues.push({
          severity: 'error',
          message: `Interface ${iface.name} has mismatched signatures`,
        });
      }
    }

    const total = interfaces.length || 1;
    const conformance = conforming / total;

    return {
      result: conformance === 1 ? 'pass' : conformance >= 0.8 ? 'partial' : 'fail',
      confidence: conformance,
      reasoning: `${conforming}/${total} interfaces properly implemented`,
      issues,
    };
  }

  /**
   * Verify: Code consistent with existing Codebase
   * Check for pattern consistency
   */
  private async verifyConsistent(
    newCode: Artifact,
    existingCode: Artifact
  ): Promise<{
    result: VerificationResult;
    confidence: number;
    reasoning: string;
    issues: Issue[];
  }> {
    const issues: Issue[] = [];
    const checks = {
      namingConvention: this.checkNamingConsistency(newCode.content, existingCode.content),
      importStyle: this.checkImportStyle(newCode.content, existingCode.content),
      errorHandling: this.checkErrorHandlingStyle(newCode.content, existingCode.content),
      asyncPatterns: this.checkAsyncPatterns(newCode.content, existingCode.content),
    };

    let consistent = 0;
    let total = 0;

    for (const [check, result] of Object.entries(checks)) {
      total++;
      if (result.consistent) {
        consistent++;
      } else {
        issues.push({
          severity: 'warning',
          message: `Inconsistent ${check}: ${result.reason}`,
          suggestion: result.suggestion,
        });
      }
    }

    const score = consistent / total;

    return {
      result: score >= 0.75 ? 'pass' : score >= 0.5 ? 'partial' : 'fail',
      confidence: score,
      reasoning: `${consistent}/${total} consistency checks passed`,
      issues,
    };
  }

  /**
   * Verify: Runtime validates Code behavior
   * Check that code actually works when run
   */
  private async verifyValidates(
    runtimeResult: Artifact,
    code: Artifact
  ): Promise<{
    result: VerificationResult;
    confidence: number;
    reasoning: string;
    issues: Issue[];
  }> {
    // Parse runtime results (test output, execution logs)
    const results = this.parseRuntimeResults(runtimeResult.content);
    const issues: Issue[] = [];

    if (results.errors.length > 0) {
      for (const error of results.errors) {
        issues.push({
          severity: 'error',
          message: error,
        });
      }
    }

    const passRate = results.total > 0
      ? results.passed / results.total
      : 0;

    return {
      result: passRate === 1 ? 'pass' : passRate >= 0.8 ? 'partial' : 'fail',
      confidence: passRate,
      reasoning: `${results.passed}/${results.total} tests passed at runtime`,
      issues,
    };
  }

  /**
   * Verify: Answer resolves Question
   * Check that a clarification actually addresses the question
   */
  private async verifyResolves(
    answer: Artifact,
    question: Artifact
  ): Promise<{
    result: VerificationResult;
    confidence: number;
    reasoning: string;
    issues: Issue[];
  }> {
    // Simple check: does the answer address the question?
    const questionKeywords = this.extractKeywords(question.content);
    const answerKeywords = this.extractKeywords(answer.content);

    const addressed = questionKeywords.filter((k) =>
      answerKeywords.some((a) => a.includes(k) || k.includes(a))
    );

    const coverage = addressed.length / (questionKeywords.length || 1);

    return {
      result: coverage >= 0.7 ? 'pass' : coverage >= 0.4 ? 'partial' : 'fail',
      confidence: coverage,
      reasoning: `Answer addresses ${addressed.length}/${questionKeywords.length} key aspects of the question`,
      issues: [],
    };
  }

  // === Helper Methods ===

  private extractRequirements(specContent: string): string[] {
    // Extract bullet points, numbered items, or "should/must" statements
    const lines = specContent.split('\n');
    const requirements: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      // Bullet points
      if (trimmed.match(/^[-*•]\s+/)) {
        requirements.push(trimmed.replace(/^[-*•]\s+/, ''));
      }
      // Numbered items
      else if (trimmed.match(/^\d+\.\s+/)) {
        requirements.push(trimmed.replace(/^\d+\.\s+/, ''));
      }
      // Should/must statements
      else if (trimmed.match(/\b(should|must|shall|will)\b/i)) {
        requirements.push(trimmed);
      }
    }

    return requirements;
  }

  private checkRequirementInCode(
    requirement: string,
    codeContent: string
  ): 'implemented' | 'partial' | 'missing' {
    const keywords = this.extractKeywords(requirement);
    const codeKeywords = this.extractKeywords(codeContent);

    const matches = keywords.filter((k) =>
      codeKeywords.some((ck) => ck.includes(k) || k.includes(ck))
    );

    const matchRate = matches.length / (keywords.length || 1);

    if (matchRate >= 0.7) return 'implemented';
    if (matchRate >= 0.3) return 'partial';
    return 'missing';
  }

  private extractCodeElements(codeContent: string): string[] {
    const elements: string[] = [];

    // Function declarations
    const funcMatches = codeContent.matchAll(/function\s+(\w+)/g);
    for (const match of funcMatches) {
      elements.push(match[1]);
    }

    // Arrow functions assigned to const
    const arrowMatches = codeContent.matchAll(/const\s+(\w+)\s*=\s*(?:async\s*)?\(/g);
    for (const match of arrowMatches) {
      elements.push(match[1]);
    }

    // Class declarations
    const classMatches = codeContent.matchAll(/class\s+(\w+)/g);
    for (const match of classMatches) {
      elements.push(match[1]);
    }

    // Method definitions
    const methodMatches = codeContent.matchAll(/(?:async\s+)?(\w+)\s*\([^)]*\)\s*[:{]/g);
    for (const match of methodMatches) {
      if (!['if', 'for', 'while', 'switch', 'catch', 'function'].includes(match[1])) {
        elements.push(match[1]);
      }
    }

    return [...new Set(elements)];
  }

  private extractTestCases(testContent: string): string[] {
    const testCases: string[] = [];

    // it() or test() blocks
    const matches = testContent.matchAll(/(?:it|test)\s*\(\s*['"`]([^'"`]+)['"`]/g);
    for (const match of matches) {
      testCases.push(match[1]);
    }

    // describe() blocks
    const describeMatches = testContent.matchAll(/describe\s*\(\s*['"`]([^'"`]+)['"`]/g);
    for (const match of describeMatches) {
      testCases.push(match[1]);
    }

    return testCases;
  }

  private semanticMatch(text1: string, text2: string): boolean {
    const keywords1 = this.extractKeywords(text1);
    const keywords2 = this.extractKeywords(text2);

    const matches = keywords1.filter((k1) =>
      keywords2.some((k2) => k1.includes(k2) || k2.includes(k1))
    );

    return matches.length >= Math.min(keywords1.length, keywords2.length) * 0.3;
  }

  private extractKeywords(text: string): string[] {
    // Remove common words, keep meaningful terms
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'to', 'of',
      'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through',
      'that', 'which', 'who', 'whom', 'this', 'these', 'those', 'it', 'its',
      'and', 'but', 'or', 'nor', 'so', 'yet', 'both', 'either', 'neither',
    ]);

    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word));
  }

  private extractInterfaces(contractContent: string): Array<{ name: string; methods: string[] }> {
    const interfaces: Array<{ name: string; methods: string[] }> = [];

    // TypeScript interface pattern
    const interfaceRegex = /interface\s+(\w+)\s*\{([^}]+)\}/g;
    let match;

    while ((match = interfaceRegex.exec(contractContent)) !== null) {
      const name = match[1];
      const body = match[2];

      // Extract method signatures
      const methods = body
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.includes('(') && line.includes(':'));

      interfaces.push({ name, methods });
    }

    return interfaces;
  }

  private extractImplementations(codeContent: string): Array<{ name: string; methods: string[] }> {
    const implementations: Array<{ name: string; methods: string[] }> = [];

    // Class pattern
    const classRegex = /class\s+(\w+)(?:\s+implements\s+\w+)?\s*\{([^}]+(?:\{[^}]*\}[^}]*)*)\}/g;
    let match;

    while ((match = classRegex.exec(codeContent)) !== null) {
      const name = match[1];
      const body = match[2];

      // Extract method names
      const methodRegex = /(?:async\s+)?(\w+)\s*\([^)]*\)/g;
      const methods: string[] = [];
      let methodMatch;

      while ((methodMatch = methodRegex.exec(body)) !== null) {
        if (!['constructor', 'if', 'for', 'while'].includes(methodMatch[1])) {
          methods.push(methodMatch[1]);
        }
      }

      implementations.push({ name, methods });
    }

    return implementations;
  }

  private compareSignatures(expected: string[], actual: string[]): boolean {
    // Simple check: do method names match?
    const expectedNames = expected.map((sig) => sig.split('(')[0].trim());
    const actualNames = actual.map((sig) => sig.split('(')[0].trim());

    return expectedNames.every((name) => actualNames.includes(name));
  }

  private checkNamingConsistency(
    newCode: string,
    existingCode: string
  ): { consistent: boolean; reason: string; suggestion?: string } {
    // Check camelCase vs snake_case
    const newHasSnake = /[a-z]_[a-z]/.test(newCode);
    const existingHasSnake = /[a-z]_[a-z]/.test(existingCode);
    const newHasCamel = /[a-z][A-Z]/.test(newCode);
    const existingHasCamel = /[a-z][A-Z]/.test(existingCode);

    if (newHasSnake !== existingHasSnake || newHasCamel !== existingHasCamel) {
      return {
        consistent: false,
        reason: 'Naming convention mismatch',
        suggestion: existingHasCamel ? 'Use camelCase naming' : 'Use snake_case naming',
      };
    }

    return { consistent: true, reason: 'Naming conventions match' };
  }

  private checkImportStyle(
    newCode: string,
    existingCode: string
  ): { consistent: boolean; reason: string; suggestion?: string } {
    // Check import vs require
    const newUsesImport = /^import\s/m.test(newCode);
    const newUsesRequire = /require\s*\(/.test(newCode);
    const existingUsesImport = /^import\s/m.test(existingCode);
    const existingUsesRequire = /require\s*\(/.test(existingCode);

    if (newUsesImport !== existingUsesImport || newUsesRequire !== existingUsesRequire) {
      return {
        consistent: false,
        reason: 'Import style mismatch',
        suggestion: existingUsesImport ? 'Use ES6 import syntax' : 'Use CommonJS require',
      };
    }

    return { consistent: true, reason: 'Import styles match' };
  }

  private checkErrorHandlingStyle(
    newCode: string,
    existingCode: string
  ): { consistent: boolean; reason: string; suggestion?: string } {
    // Check try-catch patterns
    const newHasTryCatch = /try\s*\{/.test(newCode);
    const existingHasTryCatch = /try\s*\{/.test(existingCode);

    // If existing code uses try-catch extensively but new code doesn't
    const existingTryCatchCount = (existingCode.match(/try\s*\{/g) || []).length;
    const newTryCatchCount = (newCode.match(/try\s*\{/g) || []).length;

    // Rough heuristic: if existing has many try-catches, new should have some
    if (existingTryCatchCount > 3 && newTryCatchCount === 0) {
      return {
        consistent: false,
        reason: 'Missing error handling',
        suggestion: 'Add try-catch blocks for error handling',
      };
    }

    return { consistent: true, reason: 'Error handling patterns match' };
  }

  private checkAsyncPatterns(
    newCode: string,
    existingCode: string
  ): { consistent: boolean; reason: string; suggestion?: string } {
    // Check async/await vs .then()
    const newUsesAwait = /await\s/.test(newCode);
    const newUsesThen = /\.then\s*\(/.test(newCode);
    const existingUsesAwait = /await\s/.test(existingCode);
    const existingUsesThen = /\.then\s*\(/.test(existingCode);

    // Prefer async/await if that's the existing pattern
    if (existingUsesAwait && !existingUsesThen && newUsesThen && !newUsesAwait) {
      return {
        consistent: false,
        reason: 'Async pattern mismatch',
        suggestion: 'Use async/await instead of .then()',
      };
    }

    return { consistent: true, reason: 'Async patterns match' };
  }

  private parseRuntimeResults(resultContent: string): {
    passed: number;
    failed: number;
    total: number;
    errors: string[];
  } {
    const errors: string[] = [];

    // Parse common test output formats
    // Jest/Vitest format: "Tests: X passed, Y failed, Z total"
    const jestMatch = resultContent.match(/Tests:\s*(\d+)\s*passed.*?(\d+)\s*failed.*?(\d+)\s*total/i);
    if (jestMatch) {
      return {
        passed: parseInt(jestMatch[1]),
        failed: parseInt(jestMatch[2]),
        total: parseInt(jestMatch[3]),
        errors: this.extractErrorMessages(resultContent),
      };
    }

    // Simple pass/fail count
    const passCount = (resultContent.match(/✓|PASS|passed/gi) || []).length;
    const failCount = (resultContent.match(/✗|FAIL|failed/gi) || []).length;

    return {
      passed: passCount,
      failed: failCount,
      total: passCount + failCount,
      errors: this.extractErrorMessages(resultContent),
    };
  }

  private extractErrorMessages(output: string): string[] {
    const errors: string[] = [];

    // Extract lines that look like errors
    const lines = output.split('\n');
    for (const line of lines) {
      if (line.match(/error|fail|exception|assert/i) && line.trim().length > 10) {
        errors.push(line.trim());
      }
    }

    return errors.slice(0, 10); // Limit to first 10 errors
  }

  private computeDimensions(
    crossRefs: CrossReference[]
  ): VerificationStatus['dimensions'] {
    const dimensions: VerificationStatus['dimensions'] = {
      specAlignment: 'pending',
      testCoverage: 'pending',
      contractConformance: 'pending',
      codeConsistency: 'pending',
      runtimeBehavior: 'pending',
    };

    // Map relationship types to dimensions
    const relationshipToDimension: Record<CrossReferenceType, keyof typeof dimensions> = {
      implements: 'specAlignment',
      tests: 'testCoverage',
      covers: 'testCoverage',
      conforms: 'contractConformance',
      consistent: 'codeConsistency',
      validates: 'runtimeBehavior',
      resolves: 'specAlignment',
    };

    // Aggregate results by dimension
    const dimResults: Record<string, VerificationResult[]> = {};

    for (const ref of crossRefs) {
      const dim = relationshipToDimension[ref.relationship];
      if (!dimResults[dim]) {
        dimResults[dim] = [];
      }
      dimResults[dim].push(ref.result);
    }

    // Compute final result for each dimension
    for (const [dim, results] of Object.entries(dimResults)) {
      if (results.every((r) => r === 'pass')) {
        dimensions[dim as keyof typeof dimensions] = 'pass';
      } else if (results.every((r) => r === 'fail')) {
        dimensions[dim as keyof typeof dimensions] = 'fail';
      } else if (results.some((r) => r === 'fail')) {
        dimensions[dim as keyof typeof dimensions] = 'partial';
      } else {
        dimensions[dim as keyof typeof dimensions] = 'partial';
      }
    }

    return dimensions;
  }

  private computeOverallResult(
    dimensions: VerificationStatus['dimensions']
  ): VerificationResult {
    const results = Object.values(dimensions);

    if (results.every((r) => r === 'pass')) {
      return 'pass';
    }
    if (results.some((r) => r === 'fail')) {
      return 'fail';
    }
    if (results.every((r) => r === 'pending')) {
      return 'pending';
    }
    return 'partial';
  }

  private computeConfidence(crossRefs: CrossReference[]): number {
    if (crossRefs.length === 0) return 0;

    const totalConfidence = crossRefs.reduce((sum, ref) => sum + ref.confidence, 0);
    return totalConfidence / crossRefs.length;
  }
}
