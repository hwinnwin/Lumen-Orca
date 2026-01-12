/**
 * A8: Performance Analyst Agent
 * Role: Performance testing and optimization recommendations
 * Inputs: Code and runtime metrics
 * Outputs: Performance analysis and optimization suggestions
 */

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
  latency: {
    p50: number;  // ms
    p95: number;  // ms
    p99: number;  // ms
    max: number;  // ms
  };
  throughput: {
    rps: number;           // requests per second
    concurrent: number;    // concurrent users
    peakRps: number;
  };
  memory: {
    heap: number;          // MB
    rss: number;           // MB
    leaks: boolean;
    gcPauses: number;      // avg ms
  };
  bundle: {
    size: number;          // KB
    gzipped: number;       // KB
    chunks: number;
    largestChunk: number;  // KB
  };
  cpu: {
    average: number;       // percentage
    peak: number;
  };
}

export interface WebVitals {
  lcp: number;   // Largest Contentful Paint (ms)
  fid: number;   // First Input Delay (ms)
  cls: number;   // Cumulative Layout Shift (score)
  fcp: number;   // First Contentful Paint (ms)
  ttfb: number;  // Time to First Byte (ms)
  inp: number;   // Interaction to Next Paint (ms)
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

// Performance budgets aligned with P69 goals
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
   * Run comprehensive performance analysis
   */
  async analyze(input: {
    code: string;
    bundlePath?: string;
    endpoint?: string;
  }): Promise<PerformanceReport> {
    const metrics = await this.collectMetrics(input);
    const webVitals = await this.measureWebVitals(input.endpoint);
    const budgetStatus = this.evaluateBudgets(metrics, webVitals);
    const recommendations = this.generateRecommendations(metrics, webVitals, input.code);

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

  private async collectMetrics(input: { code: string }): Promise<PerformanceMetrics> {
    // Stub: Would use actual performance testing tools
    const codeSize = input.code.length;

    return {
      latency: {
        p50: 45 + Math.random() * 30,
        p95: 120 + Math.random() * 80,
        p99: 180 + Math.random() * 100,
        max: 500 + Math.random() * 500,
      },
      throughput: {
        rps: 1000 + Math.random() * 500,
        concurrent: 100,
        peakRps: 1500 + Math.random() * 500,
      },
      memory: {
        heap: 30 + Math.random() * 20,
        rss: 50 + Math.random() * 30,
        leaks: Math.random() > 0.95,
        gcPauses: 5 + Math.random() * 10,
      },
      bundle: {
        size: codeSize / 100,
        gzipped: codeSize / 300,
        chunks: Math.ceil(codeSize / 10000),
        largestChunk: codeSize / 200,
      },
      cpu: {
        average: 20 + Math.random() * 30,
        peak: 60 + Math.random() * 30,
      },
    };
  }

  private async measureWebVitals(endpoint?: string): Promise<WebVitals> {
    // Stub: Would use Lighthouse or web-vitals library
    return {
      lcp: 1500 + Math.random() * 1500,
      fid: 50 + Math.random() * 100,
      cls: Math.random() * 0.15,
      fcp: 800 + Math.random() * 1000,
      ttfb: 200 + Math.random() * 600,
      inp: 100 + Math.random() * 150,
    };
  }

  private evaluateBudgets(metrics: PerformanceMetrics, webVitals: WebVitals): BudgetResult[] {
    const results: BudgetResult[] = [];

    const addBudget = (
      metric: string,
      actual: number,
      config: { budget: number; unit: string; severity: 'critical' | 'warning' | 'info' }
    ) => {
      results.push({
        metric,
        budget: config.budget,
        actual,
        unit: config.unit,
        passed: actual <= config.budget,
        severity: config.severity,
      });
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

  private generateRecommendations(
    metrics: PerformanceMetrics,
    webVitals: WebVitals,
    code: string
  ): Recommendation[] {
    const recommendations: Recommendation[] = [];

    // LCP optimization
    if (webVitals.lcp > 2500) {
      recommendations.push({
        area: 'rendering',
        issue: `LCP is ${webVitals.lcp.toFixed(0)}ms (target: <2500ms)`,
        solution: 'Optimize largest content element loading: preload hero images, use srcset, lazy load below-fold content',
        impact: 'high',
        effort: 'medium',
        codeExample: `<link rel="preload" as="image" href="/hero.webp" />`,
      });
    }

    // Bundle size optimization
    if (metrics.bundle.gzipped > 200) {
      recommendations.push({
        area: 'bundle',
        issue: `Bundle size ${metrics.bundle.gzipped.toFixed(0)}KB exceeds budget`,
        solution: 'Implement code splitting and lazy loading for routes',
        impact: 'high',
        effort: 'medium',
        codeExample: `const Component = lazy(() => import('./Component'));`,
      });
    }

    // Memory leak detection
    if (metrics.memory.leaks) {
      recommendations.push({
        area: 'memory',
        issue: 'Potential memory leak detected',
        solution: 'Review useEffect cleanup functions and event listener removal',
        impact: 'high',
        effort: 'high',
        codeExample: `useEffect(() => {\n  const handler = () => {};\n  window.addEventListener('scroll', handler);\n  return () => window.removeEventListener('scroll', handler);\n}, []);`,
      });
    }

    // CLS optimization
    if (webVitals.cls > 0.1) {
      recommendations.push({
        area: 'rendering',
        issue: `CLS score ${webVitals.cls.toFixed(3)} exceeds threshold`,
        solution: 'Set explicit dimensions on images and ads, avoid inserting content above existing content',
        impact: 'medium',
        effort: 'low',
        codeExample: `<img width="800" height="600" loading="lazy" />`,
      });
    }

    // Network caching
    if (webVitals.ttfb > 800) {
      recommendations.push({
        area: 'network',
        issue: `TTFB is ${webVitals.ttfb.toFixed(0)}ms`,
        solution: 'Implement edge caching, optimize server response time, consider CDN',
        impact: 'high',
        effort: 'medium',
      });
    }

    // Code-level optimizations
    if (code.includes('useEffect') && !code.includes('useMemo')) {
      recommendations.push({
        area: 'code',
        issue: 'Missing memoization for expensive computations',
        solution: 'Use useMemo for expensive calculations and useCallback for callback functions',
        impact: 'medium',
        effort: 'low',
        codeExample: `const memoizedValue = useMemo(() => computeExpensive(a, b), [a, b]);`,
      });
    }

    return recommendations.sort((a, b) => {
      const impactOrder = { high: 0, medium: 1, low: 2 };
      return impactOrder[a.impact] - impactOrder[b.impact];
    });
  }

  /**
   * Run load testing
   */
  async runLoadTest(endpoint: string, config: {
    duration: number;
    rps: number;
    concurrent: number;
  }): Promise<{
    avgLatency: number;
    errorRate: number;
    throughput: number;
  }> {
    // Stub: Would use k6 or artillery
    return {
      avgLatency: 100 + Math.random() * 100,
      errorRate: Math.random() * 0.01,
      throughput: config.rps * (0.9 + Math.random() * 0.1),
    };
  }
}
