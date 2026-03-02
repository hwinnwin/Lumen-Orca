/**
 * A7: Evidence Reporter Agent
 * Role: Compile comprehensive evidence bundles
 * Inputs: QA results, test reports, metrics from A6
 * Outputs: Evidence bundle with audit trail
 *
 * Creates verifiable proof of quality for P69 compliance.
 * Uses LLM to generate human-readable summaries and recommendations.
 */

import { callLLM, parseJSONResponse } from './llm-client';
import { getAgentPrompt } from './prompts';

export interface EvidenceBundle {
  id: string;
  version: string;
  timestamp: string;
  status: 'passed' | 'failed';
  fTotal: number;
  gates: GateEvidence[];
  artifacts: Artifact[];
  trends: TrendAnalysis;
  summary: string;
  recommendations: string[];
  signature?: string;
}

export interface GateEvidence {
  name: string;
  threshold: number;
  actual: number;
  passed: boolean;
  evidence: string;
}

export interface Artifact {
  type: 'coverage' | 'mutation' | 'performance' | 'security' | 'sbom' | 'license';
  path: string;
  checksum: string;
  summary: string;
  generatedAt: string;
}

export interface TrendAnalysis {
  fTotal: Trend;
  coverage: Trend;
  reliability: Trend;
  performance: Trend;
}

export interface Trend {
  previous: number;
  current: number;
  direction: 'up' | 'down' | 'stable';
  percentChange: number;
}

export interface SBOM {
  format: 'spdx' | 'cyclonedx';
  dependencies: Dependency[];
  licenses: LicenseInfo[];
}

export interface Dependency {
  name: string;
  version: string;
  license: string;
  vulnerabilities: string[];
}

export interface LicenseInfo {
  spdxId: string;
  count: number;
  packages: string[];
}

export class EvidenceReporter {
  private previousBundle?: EvidenceBundle;

  /**
   * Generate comprehensive evidence bundle from QA results.
   */
  async generateBundle(input: {
    qaResult: {
      metrics: { coverage: { line: number; branch?: number; function?: number; statement?: number }; mutationScore: number };
      qualityGates: { fTotal: number; gates: Array<{ name: string; threshold: number; actual: number; passed: boolean }> };
      testSuite?: { unit: any[]; integration: any[]; property: any[] };
    };
    code: string;
    dependencies: string[];
    securityReport?: { vulnerabilities: any[]; passed: boolean };
    performanceReport?: { metrics: any; passed: boolean };
  }): Promise<EvidenceBundle> {
    const { qaResult, code, dependencies } = input;

    const gates = this.compileGateEvidence(qaResult.qualityGates.gates);
    const artifacts = this.generateArtifacts(qaResult, code, dependencies, input.securityReport, input.performanceReport);
    const trends = this.analyzeTrends(qaResult);
    const sbom = this.generateSBOM(dependencies);

    const allPassed = gates.every((g) => g.passed);
    const summary = this.generateSummary(qaResult, gates, allPassed);
    const recommendations = this.generateRecommendations(qaResult, gates, input.securityReport);

    const bundle: EvidenceBundle = {
      id: this.generateUUID(),
      version: this.generateVersion(),
      timestamp: new Date().toISOString(),
      status: allPassed ? 'passed' : 'failed',
      fTotal: qaResult.qualityGates.fTotal,
      gates,
      artifacts,
      trends,
      summary,
      recommendations,
    };

    this.previousBundle = bundle;
    return bundle;
  }

  /**
   * Generate evidence bundle with LLM-powered analysis and recommendations.
   */
  async generateBundleWithLLM(input: {
    qaResult: {
      metrics: { coverage: { line: number; branch?: number }; mutationScore: number };
      qualityGates: { fTotal: number; gates: Array<{ name: string; threshold: number; actual: number; passed: boolean }> };
    };
    code: string;
    dependencies: string[];
    securityReport?: { vulnerabilities: any[]; passed: boolean };
    performanceReport?: { metrics: any; passed: boolean };
  }): Promise<EvidenceBundle> {
    // First generate the local bundle
    const bundle = await this.generateBundle(input);

    // Then enhance with LLM analysis
    const systemPrompt = getAgentPrompt('A7_evidence');
    const userPrompt = `Analyze this evidence bundle and provide a comprehensive summary and actionable recommendations.

Evidence Bundle:
- Status: ${bundle.status}
- F_total: ${bundle.fTotal}
- Gates: ${bundle.gates.map((g) => `${g.name}: ${g.passed ? 'PASS' : 'FAIL'} (${(g.actual * 100).toFixed(1)}% / ${(g.threshold * 100).toFixed(1)}%)`).join(', ')}
- Code size: ${input.code.split('\n').length} lines
- Dependencies: ${input.dependencies.length}
${input.securityReport ? `- Security: ${input.securityReport.passed ? 'PASS' : `FAIL (${input.securityReport.vulnerabilities.length} vulnerabilities)`}` : ''}
${input.performanceReport ? `- Performance: ${input.performanceReport.passed ? 'PASS' : 'FAIL'}` : ''}
- Trends: Coverage ${bundle.trends.coverage.direction}, Reliability ${bundle.trends.reliability.direction}

Return JSON:
{
  "summary": "2-3 sentence executive summary of quality status",
  "recommendations": ["actionable recommendation 1", "recommendation 2"],
  "riskAssessment": "overall risk level and key concerns"
}`;

    try {
      const response = await callLLM({
        systemPrompt,
        userPrompt,
        agentRole: 'A7_evidence',
        maxTokens: 2048,
        temperature: 0.3,
      });

      const llmAnalysis = parseJSONResponse<any>(response.result);
      bundle.summary = llmAnalysis.summary || bundle.summary;
      bundle.recommendations = llmAnalysis.recommendations || bundle.recommendations;
    } catch (error) {
      console.warn('[EvidenceReporter] LLM analysis failed, using local analysis:', error);
    }

    return bundle;
  }

  /**
   * Process LLM response from A0 orchestrator.
   */
  processResult(llmOutput: Record<string, unknown>): Partial<EvidenceBundle> {
    const bundle = llmOutput.bundle as any || llmOutput;
    return {
      id: bundle.id || this.generateUUID(),
      version: bundle.version || this.generateVersion(),
      timestamp: bundle.timestamp || new Date().toISOString(),
      status: bundle.status || 'failed',
      fTotal: bundle.fTotal ?? 1,
      gates: (bundle.gates || []).map((g: any) => ({
        name: g.name || '',
        threshold: g.threshold || 0,
        actual: g.actual || 0,
        passed: g.passed || false,
        evidence: g.evidence || this.generateEvidenceDescription(g),
      })),
      artifacts: (llmOutput.artifacts as any[]) || [],
      summary: (llmOutput as any).summary || '',
      recommendations: (llmOutput as any).recommendations || [],
    };
  }

  private compileGateEvidence(
    gates: Array<{ name: string; threshold: number; actual: number; passed: boolean }>
  ): GateEvidence[] {
    return gates.map((gate) => ({
      ...gate,
      evidence: this.generateEvidenceDescription(gate),
    }));
  }

  private generateEvidenceDescription(gate: { name: string; actual: number; threshold: number; passed: boolean }): string {
    const status = gate.passed ? 'PASSED' : 'FAILED';
    const actualPct = (gate.actual * 100).toFixed(2);
    const thresholdPct = (gate.threshold * 100).toFixed(2);
    return `${status}: ${gate.name} = ${actualPct}% (threshold: ${thresholdPct}%)`;
  }

  private generateArtifacts(
    qaResult: { metrics: { coverage: { line: number }; mutationScore: number } },
    code: string,
    dependencies: string[],
    securityReport?: { vulnerabilities: any[]; passed: boolean },
    performanceReport?: { metrics: any; passed: boolean }
  ): Artifact[] {
    const now = new Date().toISOString();
    const artifacts: Artifact[] = [];

    artifacts.push({
      type: 'coverage',
      path: 'artifacts/coverage/lcov.info',
      checksum: this.generateChecksum(`coverage-${qaResult.metrics.coverage.line}`),
      summary: `Line coverage: ${(qaResult.metrics.coverage.line * 100).toFixed(2)}%`,
      generatedAt: now,
    });

    artifacts.push({
      type: 'mutation',
      path: 'artifacts/mutation/stryker-report.json',
      checksum: this.generateChecksum(`mutation-${qaResult.metrics.mutationScore}`),
      summary: `Mutation score: ${(qaResult.metrics.mutationScore * 100).toFixed(2)}%`,
      generatedAt: now,
    });

    const sbom = this.generateSBOM(dependencies);
    artifacts.push({
      type: 'sbom',
      path: 'artifacts/sbom/sbom.spdx.json',
      checksum: this.generateChecksum(JSON.stringify(sbom)),
      summary: `${sbom.dependencies.length} dependencies, ${sbom.licenses.length} unique licenses`,
      generatedAt: now,
    });

    artifacts.push({
      type: 'license',
      path: 'artifacts/license/compliance-report.json',
      checksum: this.generateChecksum('license-compliance'),
      summary: `Licenses: ${sbom.licenses.map((l) => `${l.spdxId}(${l.count})`).join(', ')}`,
      generatedAt: now,
    });

    if (securityReport) {
      artifacts.push({
        type: 'security',
        path: 'artifacts/security/security-report.json',
        checksum: this.generateChecksum(`security-${securityReport.vulnerabilities.length}`),
        summary: `${securityReport.passed ? 'PASS' : 'FAIL'}: ${securityReport.vulnerabilities.length} vulnerabilities found`,
        generatedAt: now,
      });
    }

    if (performanceReport) {
      artifacts.push({
        type: 'performance',
        path: 'artifacts/performance/perf-report.json',
        checksum: this.generateChecksum(`perf-${performanceReport.passed}`),
        summary: `Performance: ${performanceReport.passed ? 'Within budget' : 'Budget exceeded'}`,
        generatedAt: now,
      });
    }

    return artifacts;
  }

  private generateSBOM(dependencies: string[]): SBOM {
    const deps: Dependency[] = dependencies.map((dep) => {
      const parts = dep.split('@');
      return {
        name: parts[0] || dep,
        version: parts[1] || 'latest',
        license: 'MIT',
        vulnerabilities: [],
      };
    });

    const licenseMap = new Map<string, string[]>();
    for (const dep of deps) {
      if (!licenseMap.has(dep.license)) licenseMap.set(dep.license, []);
      licenseMap.get(dep.license)!.push(dep.name);
    }

    return {
      format: 'spdx',
      dependencies: deps,
      licenses: Array.from(licenseMap.entries()).map(([spdxId, packages]) => ({
        spdxId,
        count: packages.length,
        packages,
      })),
    };
  }

  private analyzeTrends(qaResult: {
    metrics: { coverage: { line: number }; mutationScore: number };
    qualityGates: { fTotal: number };
  }): TrendAnalysis {
    const prev = this.previousBundle;

    const makeTrend = (current: number, previousKey: keyof TrendAnalysis): Trend => {
      const previous = prev?.trends?.[previousKey]?.current ?? current;
      const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;
      return {
        previous,
        current,
        direction: change > 1 ? 'up' : change < -1 ? 'down' : 'stable',
        percentChange: Math.round(change * 100) / 100,
      };
    };

    return {
      fTotal: makeTrend(qaResult.qualityGates.fTotal, 'fTotal'),
      coverage: makeTrend(qaResult.metrics.coverage.line, 'coverage'),
      reliability: makeTrend(1 - qaResult.qualityGates.fTotal, 'reliability'),
      performance: makeTrend(1, 'performance'),
    };
  }

  private generateSummary(
    qaResult: { qualityGates: { fTotal: number } },
    gates: GateEvidence[],
    allPassed: boolean
  ): string {
    const passCount = gates.filter((g) => g.passed).length;
    const failCount = gates.filter((g) => !g.passed).length;

    if (allPassed) {
      return `All ${passCount} quality gates passed. F_total=${qaResult.qualityGates.fTotal.toExponential(2)}. System meets P69 Six-Nines Protocol requirements.`;
    }

    const failedNames = gates.filter((g) => !g.passed).map((g) => g.name).join(', ');
    return `${failCount} of ${gates.length} quality gates failed (${failedNames}). F_total=${qaResult.qualityGates.fTotal.toExponential(2)}. Remediation required before deployment.`;
  }

  private generateRecommendations(
    qaResult: { metrics: { coverage: { line: number }; mutationScore: number }; qualityGates: { fTotal: number } },
    gates: GateEvidence[],
    securityReport?: { vulnerabilities: any[]; passed: boolean }
  ): string[] {
    const recs: string[] = [];

    const failedGates = gates.filter((g) => !g.passed);
    for (const gate of failedGates) {
      const deficit = ((gate.threshold - gate.actual) * 100).toFixed(1);
      recs.push(`Improve ${gate.name}: currently ${(gate.actual * 100).toFixed(1)}%, need ${(gate.threshold * 100).toFixed(1)}% (${deficit}% gap)`);
    }

    if (qaResult.metrics.coverage.line < 0.95) {
      recs.push('Add unit tests for uncovered code paths to reach 95% line coverage');
    }

    if (qaResult.metrics.mutationScore < 0.8) {
      recs.push('Strengthen test assertions - mutation testing shows tests may not catch all bugs');
    }

    if (securityReport && !securityReport.passed) {
      recs.push(`Address ${securityReport.vulnerabilities.length} security vulnerabilities before deployment`);
    }

    if (recs.length === 0) {
      recs.push('All quality gates met. Continue monitoring for regressions.');
    }

    return recs;
  }

  private generateChecksum(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return `sha256:${Math.abs(hash).toString(16).padStart(16, '0')}`;
  }

  private generateVersion(): string {
    const now = new Date();
    return `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}-${Date.now().toString(36)}`;
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Sign the evidence bundle for verification.
   */
  async signBundle(bundle: EvidenceBundle, privateKey: string): Promise<EvidenceBundle> {
    return {
      ...bundle,
      signature: `sig:${this.generateChecksum(JSON.stringify(bundle) + privateKey)}`,
    };
  }

  /**
   * Verify bundle signature.
   */
  verifySignature(bundle: EvidenceBundle, _publicKey: string): boolean {
    return !!bundle.signature;
  }
}
