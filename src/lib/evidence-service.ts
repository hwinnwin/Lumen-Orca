/**
 * Evidence Service - Generate and manage evidence bundles
 */

import { generateBundle, generateHTML } from '../../packages/evidence/src/bundle';
import type { EvidenceBundle } from '../../packages/contracts/src/index';

class EvidenceService {
  private bundles: EvidenceBundle[] = [];
  private static instance: EvidenceService;

  private constructor() {
    // Initialize with sample bundle
    this.addSampleBundle();
  }

  static getInstance(): EvidenceService {
    if (!EvidenceService.instance) {
      EvidenceService.instance = new EvidenceService();
    }
    return EvidenceService.instance;
  }

  private addSampleBundle(): void {
    const bundle = generateBundle({
      unitTests: 'unit-tests.json',
      mutationReport: 'mutation-report.html',
      perfMetrics: 'perf-metrics.json',
      sbom: 'sbom.json',
    });
    this.bundles.push(bundle);
  }

  generateFromOrchestrator(orchestratorState: {
    tasks: Array<{ id: string; status: string; role: string; outputs?: Record<string, unknown> }>;
    agents: Array<{ role: string; metrics: { tasksCompleted: number; averageLatency: number; errorRate: number } }>;
    stats: { total: number; completed: number; failed: number };
  }): EvidenceBundle {
    const bundle = generateBundle({
      unitTests: 'unit-tests.json',
      mutationReport: 'mutation-report.html',
      perfMetrics: 'perf-metrics.json',
      sbom: 'sbom.json',
      orchestratorState,
    });

    this.bundles.unshift(bundle); // Add to front
    return bundle;
  }

  getBundles(): EvidenceBundle[] {
    return [...this.bundles];
  }

  getBundle(id: string): EvidenceBundle | undefined {
    return this.bundles.find(b => b.id === id);
  }

  getBundleHTML(id: string): string | null {
    const bundle = this.getBundle(id);
    if (!bundle) return null;
    return generateHTML(bundle);
  }

  downloadBundle(id: string): void {
    const html = this.getBundleHTML(id);
    if (!html) return;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

export const evidenceService = EvidenceService.getInstance();
