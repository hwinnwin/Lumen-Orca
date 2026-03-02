/**
 * A8: Performance Analyst Agent
 * Role: Performance testing and optimization recommendations
 * Inputs: Code and runtime metrics
 * Outputs: Performance analysis and optimization suggestions
 *
 * Combines static code analysis with LLM-powered optimization
 * recommendations. Evaluates against P69 performance budgets.
 */

import { callLLM, parseJSONResponse } from './llm-client';
import { getAgentPrompt } from './prompts';

export interface PerformanceReport {
  id: string;
  timestamp: string;
  metrics: PerformanceMetrics;
  webVitals: WebVitals;
  budgetStatus: BudgetResult[];
  recommendations: Recommendation[];
  passed: boolean;
}

export interface PerformanceMetrics {
  latency: { p50: number; p95: number; p99: number; max: number };
  throughput: { rps: number; concurrent: number; peakRps: number };
  memory: { heap: number; rss: number; leaks: boolean; gcPauses: number };
  bundle: { size: number; gzipped: number; chunks: number; largestChunk: number };
  cpu: { average: number; peak: number };
}

export interface WebVitals {
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
  inp: number;
}

export interface BudgetResult {
  metric: string;
  budget: number;
  actual: number;
  unit: string;
  passed: boolean;
  severity: 'critical' | 'warning' | 'info';
}

export interface Recommendation {
  area: 'rendering' | 'network' | 'memory' | 'bundle' | 'caching' | 'code';
  issue: string;
  solution: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'low' | 'medium' | 'high';
  codeExample?: string;
}

const PERFORMANCE_BUDGETS = {
  'api_p95_latency': { budget: 200, unit: 'ms', severity: 'critical' as const },
  'lcp': { budget: 2500, unit: 'ms', severity: 'critical' as const },
  'fid': { budget: 100, unit: 'ms', severity: 'critical' as const },
  'cls': { budget: 0.1, unit: 'score', severity: 'warning' as const },
  'bundle_gzipped': { budget: 200, unit: 'KB', severity: 'warning' as const },
  'memory_heap': { budget: 50, unit: 'MB', severity: 'warning' as const },
  'ttfb': { budget: 800, unit: 'ms', severity: 'warning' as const },
};

export class PerformanceAnalyst {
  /**
   * Run performance analysis using static code analysis.
   */
  async analyze(input: { code: string; bundlePath?: string; endpoint?: string }): Promise<PerformanceReport> {
    const metrics = this.analyzeCodeMetrics(input.code);
    const webVitals = this.estimateWebVitals(input.code);
    const budgetStatus = this.evaluateBudgets(metrics, webVitals);
    const recommendations = this.generateLocalRecommendations(metrics, webVitals, input.code);

    return {
      id: `perf-${Date.now()}`,
      timestamp: new Date().toISOString(),
      metrics,
      webVitals,
      budgetStatus,
      recommendations,
      passed: budgetStatus.filter((b) => !b.passed && b.severity === 'critical').length === 0,
    };
  }

  /**
   * Run LLM-powered deep performance analysis with actionable recommendations.
   */
  async analyzeWithLLM(input: {
    code: string;
    bundleStats?: { size: number; gzipped: number; chunks: number };
    runtimeMetrics?: Partial<PerformanceMetrics>;
  }): Promise<PerformanceReport> {
    // First do local analysis
    const localReport = await this.analyze({ code: input.code });

    // Enhance with LLM analysis
    const systemPrompt = getAgentPrompt('A8_performance');

    const codeSnippets = this.extractPerformanceRelevantCode(input.code);

    const userPrompt = `Analyze this code for performance issues and provide optimization recommendations.

=== CODE (performance-relevant sections) ===
${codeSnippets.slice(0, 5000)}

=== CURRENT METRICS ===
- Bundle: ${localReport.metrics.bundle.gzipped.toFixed(0)}KB gzipped (${localReport.metrics.bundle.chunks} chunks)
- Estimated LCP: ${localReport.webVitals.lcp.toFixed(0)}ms
- Estimated FID: ${localReport.webVitals.fid.toFixed(0)}ms
- Estimated CLS: ${localReport.webVitals.cls.toFixed(3)}
${input.runtimeMetrics ? `- Runtime p95 latency: ${input.runtimeMetrics.latency?.p95 || 'unknown'}ms` : ''}

=== PERFORMANCE BUDGETS ===
${localReport.budgetStatus.map((b) => `- ${b.metric}: ${b.actual.toFixed(1)}${b.unit} / ${b.budget}${b.unit} [${b.passed ? 'PASS' : 'FAIL'}]`).join('\n')}

Identify:
1. Performance bottlenecks in the code
2. Unnecessary re-renders or computations
3. Bundle size optimization opportunities
4. Memory leak risks
5. Network optimization opportunities

Return JSON:
{
  "recommendations": [
    {
      "area": "rendering|network|memory|bundle|caching|code",
      "issue": "specific issue found",
      "solution": "how to fix it",
      "impact": "high|medium|low",
      "effort": "low|medium|high",
      "codeExample": "optional code fix"
    }
  ],
  "metrics": {
    "estimatedLCP": 1500,
    "estimatedFID": 50,
    "estimatedCLS": 0.05,
    "bundleReduction": "estimated KB savings"
  }
}`;

    try {
      const response = await callLLM({
        systemPrompt,
        userPrompt,
        agentRole: 'A8_performance',
        maxTokens: 4096,
        temperature: 0.3,
      });

      const parsed = parseJSONResponse<any>(response.result);
      const llmRecs = (parsed.recommendations || []).map((r: any) => ({
        area: r.area || 'code',
        issue: r.issue || '',
        solution: r.solution || '',
        impact: r.impact || 'medium',
        effort: r.effort || 'medium',
        codeExample: r.codeExample,
      }));

      // Merge LLM recommendations with local ones, deduplicating
      const existingIssues = new Set(localReport.recommendations.map((r) => r.issue));
      const newRecs = llmRecs.filter((r: Recommendation) => !existingIssues.has(r.issue));
      localReport.recommendations = [...localReport.recommendations, ...newRecs]
        .sort((a, b) => {
          const impactOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
          return impactOrder[a.impact] - impactOrder[b.impact];
        });
    } catch (error) {
      console.warn('[PerformanceAnalyst] LLM analysis failed, using local analysis:', error);
    }

    return localReport;
  }

  /**
   * Process LLM response from A0 orchestrator.
   */
  processResult(llmOutput: Record<string, unknown>): PerformanceReport {
    const metrics = (llmOutput.metrics as any) || {};
    const webVitals = (llmOutput.webVitals as any) || {};

    const report: PerformanceReport = {
      id: `perf-${Date.now()}`,
      timestamp: new Date().toISOString(),
      metrics: {
        latency: metrics.latency || { p50: 0, p95: 0, p99: 0, max: 0 },
        throughput: metrics.throughput || { rps: 0, concurrent: 0, peakRps: 0 },
        memory: metrics.memory || { heap: 0, rss: 0, leaks: false, gcPauses: 0 },
        bundle: metrics.bundle || { size: 0, gzipped: 0, chunks: 0, largestChunk: 0 },
        cpu: metrics.cpu || { average: 0, peak: 0 },
      },
      webVitals: {
        lcp: webVitals.lcp || 0,
        fid: webVitals.fid || 0,
        cls: webVitals.cls || 0,
        fcp: webVitals.fcp || 0,
        ttfb: webVitals.ttfb || 0,
        inp: webVitals.inp || 0,
      },
      budgetStatus: (llmOutput.budgetStatus as any[]) || [],
      recommendations: ((llmOutput.recommendations as any[]) || []).map((r: any) => ({
        area: r.area || 'code',
        issue: r.issue || '',
        solution: r.solution || '',
        impact: r.impact || 'medium',
        effort: r.effort || 'medium',
        codeExample: r.codeExample,
      })),
      passed: (llmOutput as any).passed ?? true,
    };

    return report;
  }

  private analyzeCodeMetrics(code: string): PerformanceMetrics {
    const lines = code.split('\n');
    const codeSize = code.length;

    // Estimate bundle metrics from code size
    const estimatedBundleKB = codeSize / 1024;
    const estimatedGzipped = estimatedBundleKB * 0.3;

    // Count performance-relevant patterns
    const asyncCount = (code.match(/\basync\b/g) || []).length;
    const useEffectCount = (code.match(/useEffect/g) || []).length;
    const useMemoCount = (code.match(/useMemo|useCallback|React\.memo/g) || []).length;
    const fetchCount = (code.match(/\bfetch\(|axios\.|supabase\./g) || []).length;

    // Estimate latency based on async operations
    const baseLatency = 20 + asyncCount * 5;

    return {
      latency: {
        p50: baseLatency,
        p95: baseLatency * 3,
        p99: baseLatency * 5,
        max: baseLatency * 10,
      },
      throughput: {
        rps: Math.max(100, 1000 - fetchCount * 50),
        concurrent: 100,
        peakRps: Math.max(200, 1500 - fetchCount * 50),
      },
      memory: {
        heap: 20 + lines.length * 0.01,
        rss: 40 + lines.length * 0.02,
        leaks: code.includes('addEventListener') && !code.includes('removeEventListener'),
        gcPauses: 5 + useEffectCount * 2,
      },
      bundle: {
        size: estimatedBundleKB,
        gzipped: estimatedGzipped,
        chunks: Math.max(1, Math.ceil(codeSize / 50000)),
        largestChunk: estimatedBundleKB * 0.6,
      },
      cpu: {
        average: 10 + (lines.length / 100),
        peak: 30 + (lines.length / 50),
      },
    };
  }

  private estimateWebVitals(code: string): WebVitals {
    const hasImages = code.includes('<img') || code.includes('Image');
    const hasLazyLoading = code.includes('lazy(') || code.includes('Suspense');
    const hasPrefetch = code.includes('preload') || code.includes('prefetch');
    const componentCount = (code.match(/(?:function|const)\s+\w+.*(?:=>|{)/g) || []).length;

    return {
      lcp: (hasImages ? 2000 : 1200) + (hasLazyLoading ? -300 : 0) + (hasPrefetch ? -200 : 0),
      fid: 50 + componentCount * 2,
      cls: hasImages && !code.includes('width=') ? 0.12 : 0.03,
      fcp: 800 + (hasLazyLoading ? -200 : 0),
      ttfb: 200 + (code.includes('getServerSideProps') ? 300 : 0),
      inp: 80 + componentCount,
    };
  }

  private evaluateBudgets(metrics: PerformanceMetrics, webVitals: WebVitals): BudgetResult[] {
    const results: BudgetResult[] = [];
    const addBudget = (metric: string, actual: number, config: { budget: number; unit: string; severity: 'critical' | 'warning' | 'info' }) => {
      results.push({ metric, budget: config.budget, actual, unit: config.unit, passed: actual <= config.budget, severity: config.severity });
    };

    addBudget('api_p95_latency', metrics.latency.p95, PERFORMANCE_BUDGETS.api_p95_latency);
    addBudget('lcp', webVitals.lcp, PERFORMANCE_BUDGETS.lcp);
    addBudget('fid', webVitals.fid, PERFORMANCE_BUDGETS.fid);
    addBudget('cls', webVitals.cls, PERFORMANCE_BUDGETS.cls);
    addBudget('bundle_gzipped', metrics.bundle.gzipped, PERFORMANCE_BUDGETS.bundle_gzipped);
    addBudget('memory_heap', metrics.memory.heap, PERFORMANCE_BUDGETS.memory_heap);
    addBudget('ttfb', webVitals.ttfb, PERFORMANCE_BUDGETS.ttfb);

    return results;
  }

  private generateLocalRecommendations(metrics: PerformanceMetrics, webVitals: WebVitals, code: string): Recommendation[] {
    const recommendations: Recommendation[] = [];

    if (webVitals.lcp > 2500) {
      recommendations.push({
        area: 'rendering',
        issue: `LCP is ${webVitals.lcp.toFixed(0)}ms (target: <2500ms)`,
        solution: 'Preload hero images, use srcset, lazy load below-fold content',
        impact: 'high',
        effort: 'medium',
        codeExample: '<link rel="preload" as="image" href="/hero.webp" />',
      });
    }

    if (metrics.bundle.gzipped > 200) {
      recommendations.push({
        area: 'bundle',
        issue: `Bundle ${metrics.bundle.gzipped.toFixed(0)}KB exceeds 200KB budget`,
        solution: 'Implement code splitting and lazy loading for routes',
        impact: 'high',
        effort: 'medium',
        codeExample: "const Component = lazy(() => import('./Component'));",
      });
    }

    if (metrics.memory.leaks) {
      recommendations.push({
        area: 'memory',
        issue: 'Potential memory leak: addEventListener without removeEventListener',
        solution: 'Add cleanup in useEffect return function',
        impact: 'high',
        effort: 'low',
        codeExample: "useEffect(() => {\n  const h = () => {};\n  window.addEventListener('scroll', h);\n  return () => window.removeEventListener('scroll', h);\n}, []);",
      });
    }

    if (webVitals.cls > 0.1) {
      recommendations.push({
        area: 'rendering',
        issue: `CLS score ${webVitals.cls.toFixed(3)} exceeds 0.1 threshold`,
        solution: 'Set explicit dimensions on images and dynamic content',
        impact: 'medium',
        effort: 'low',
        codeExample: '<img width="800" height="600" loading="lazy" />',
      });
    }

    if (webVitals.ttfb > 800) {
      recommendations.push({
        area: 'network',
        issue: `TTFB is ${webVitals.ttfb.toFixed(0)}ms (target: <800ms)`,
        solution: 'Implement edge caching, optimize server response time',
        impact: 'high',
        effort: 'medium',
      });
    }

    if (code.includes('useEffect') && !code.includes('useMemo') && !code.includes('useCallback')) {
      recommendations.push({
        area: 'code',
        issue: 'Missing memoization for potentially expensive computations',
        solution: 'Use useMemo/useCallback to prevent unnecessary recalculations',
        impact: 'medium',
        effort: 'low',
        codeExample: 'const value = useMemo(() => expensiveCalc(a, b), [a, b]);',
      });
    }

    return recommendations.sort((a, b) => {
      const impactOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      return impactOrder[a.impact] - impactOrder[b.impact];
    });
  }

  private extractPerformanceRelevantCode(code: string): string {
    const lines = code.split('\n');
    const relevant: string[] = [];
    const patterns = [/useEffect|useMemo|useCallback|React\.memo|lazy|Suspense/, /fetch\(|axios|supabase/, /addEventListener|setTimeout|setInterval/, /for\s*\(|while\s*\(|\.map\(|\.filter\(|\.reduce\(/, /import\s/, /async|await/];

    for (let i = 0; i < lines.length; i++) {
      if (patterns.some((p) => p.test(lines[i]))) {
        const start = Math.max(0, i - 1);
        const end = Math.min(lines.length, i + 3);
        relevant.push(`// Line ${i + 1}:`);
        relevant.push(...lines.slice(start, end));
        relevant.push('');
      }
    }

    return relevant.length > 0 ? relevant.join('\n') : code.slice(0, 3000);
  }
}
