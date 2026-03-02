/**
 * Evidence Service - Generate and manage evidence bundles
 * Persists bundles to Supabase with local cache fallback.
 */

import { generateBundle, generateHTML } from '../../packages/evidence/src/bundle';
import type { EvidenceBundle } from '../../packages/contracts/src/index';
import { supabase } from '@/integrations/supabase/client';

/** Shape of a row in the public.evidence_bundles table. */
interface EvidenceBundleRow {
  id: string;
  epoch: number;
  status: 'passed' | 'failed';
  f_total: number;
  gates: Array<{ name: string; threshold: number; actual: number; passed: boolean }>;
  artifacts: string[];
  orchestrator_state: Record<string, unknown> | null;
  html_content: string | null;
  user_id: string | null;
  created_at: string;
}

/** Map a Supabase row back to the app-level EvidenceBundle type. */
function rowToBundle(row: EvidenceBundleRow): EvidenceBundle {
  return {
    id: row.id,
    epoch: row.epoch,
    timestamp: row.created_at,
    status: row.status,
    fTotal: row.f_total,
    gates: row.gates,
    artifacts: row.artifacts,
  };
}

/** Map an app-level EvidenceBundle (plus optional extras) to a Supabase row for insert. */
function bundleToRow(
  bundle: EvidenceBundle,
  extras?: {
    orchestratorState?: Record<string, unknown> | null;
    htmlContent?: string | null;
    userId?: string | null;
  },
): Omit<EvidenceBundleRow, 'created_at'> & { created_at?: string } {
  return {
    id: bundle.id,
    epoch: bundle.epoch,
    status: bundle.status,
    f_total: bundle.fTotal,
    gates: bundle.gates,
    artifacts: bundle.artifacts,
    orchestrator_state: extras?.orchestratorState ?? null,
    html_content: extras?.htmlContent ?? null,
    user_id: extras?.userId ?? null,
    created_at: bundle.timestamp,
  };
}

/** How often (ms) we allow a fresh fetch from Supabase. */
const CACHE_TTL_MS = 10_000;

class EvidenceService {
  private static instance: EvidenceService;

  /** Local bundle cache — serves as both fast access and fallback. */
  private bundles: EvidenceBundle[] = [];

  /** Timestamp of the last successful Supabase fetch. */
  private lastFetchedAt = 0;

  /** Whether initial hydration from Supabase has been kicked off. */
  private initialised = false;

  /** In-flight fetch promise so concurrent callers share the same request. */
  private fetchPromise: Promise<void> | null = null;

  private constructor() {
    // Kick off async initialisation (sample bundle + remote fetch).
    this.init();
  }

  static getInstance(): EvidenceService {
    if (!EvidenceService.instance) {
      EvidenceService.instance = new EvidenceService();
    }
    return EvidenceService.instance;
  }

  // ---------------------------------------------------------------------------
  // Initialisation
  // ---------------------------------------------------------------------------

  private async init(): Promise<void> {
    // Try to hydrate from Supabase first.
    await this.fetchFromSupabase();

    // If the remote returned nothing (first ever load, or empty table), seed a
    // sample bundle so the UI always has something to show.
    if (this.bundles.length === 0) {
      await this.addSampleBundle();
    }

    this.initialised = true;
  }

  private async addSampleBundle(): Promise<void> {
    const bundle = generateBundle({
      unitTests: 'unit-tests.json',
      mutationReport: 'mutation-report.html',
      perfMetrics: 'perf-metrics.json',
      sbom: 'sbom.json',
    });

    // Persist to Supabase (best-effort).
    await this.persistBundle(bundle);
  }

  // ---------------------------------------------------------------------------
  // Supabase helpers
  // ---------------------------------------------------------------------------

  /** Fetch all bundles from Supabase, ordered newest-first. */
  private async fetchFromSupabase(): Promise<void> {
    try {
      const { data, error } = await (supabase as any)
        .from('evidence_bundles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[EvidenceService] Supabase fetch failed, using local cache:', error.message);
        return;
      }

      if (data && Array.isArray(data)) {
        this.bundles = (data as EvidenceBundleRow[]).map(rowToBundle);
        this.lastFetchedAt = Date.now();
      }
    } catch (err) {
      console.warn('[EvidenceService] Supabase fetch threw, using local cache:', err);
    }
  }

  /** Insert a single bundle row into Supabase. Returns true on success. */
  private async persistBundle(
    bundle: EvidenceBundle,
    orchestratorState?: Record<string, unknown> | null,
  ): Promise<boolean> {
    try {
      // Attempt to get the current user for user_id.
      let userId: string | null = null;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id ?? null;
      } catch {
        // Ignore — we can store the bundle without a user_id.
      }

      const htmlContent = generateHTML(bundle);

      const row = bundleToRow(bundle, {
        orchestratorState: orchestratorState ?? null,
        htmlContent,
        userId,
      });

      const { error } = await (supabase as any)
        .from('evidence_bundles')
        .insert(row);

      if (error) {
        console.warn('[EvidenceService] Supabase insert failed, bundle stored locally only:', error.message);
        return false;
      }

      return true;
    } catch (err) {
      console.warn('[EvidenceService] Supabase insert threw, bundle stored locally only:', err);
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Return all bundles.
   *
   * If the local cache is stale (older than CACHE_TTL_MS) a background refresh
   * from Supabase is triggered. The current cache contents are returned
   * immediately so the caller never blocks on network I/O.
   */
  getBundles(): EvidenceBundle[] {
    const cacheAge = Date.now() - this.lastFetchedAt;

    if (cacheAge > CACHE_TTL_MS) {
      // Deduplicate concurrent refreshes.
      if (!this.fetchPromise) {
        this.fetchPromise = this.fetchFromSupabase().finally(() => {
          this.fetchPromise = null;
        });
      }
    }

    return [...this.bundles];
  }

  /**
   * Return all bundles, awaiting a fresh Supabase fetch if the cache is stale.
   * Use this variant when you need guaranteed-fresh data (e.g. after a mutation).
   */
  async getBundlesAsync(): Promise<EvidenceBundle[]> {
    const cacheAge = Date.now() - this.lastFetchedAt;

    if (cacheAge > CACHE_TTL_MS) {
      await this.fetchFromSupabase();
    }

    return [...this.bundles];
  }

  getBundle(id: string): EvidenceBundle | undefined {
    return this.bundles.find((b) => b.id === id);
  }

  getBundleHTML(id: string): string | null {
    const bundle = this.getBundle(id);
    if (!bundle) return null;
    return generateHTML(bundle);
  }

  /**
   * Generate a new evidence bundle from the orchestrator state, persist it to
   * Supabase (best-effort), and prepend it to the local cache.
   */
  async generateFromOrchestrator(orchestratorState: {
    tasks: Array<{ id: string; status: string; role: string; outputs?: Record<string, unknown> }>;
    agents: Array<{
      role: string;
      metrics: { tasksCompleted: number; averageLatency: number; errorRate: number };
    }>;
    stats: { total: number; completed: number; failed: number };
  }): Promise<EvidenceBundle> {
    const bundle = generateBundle({
      unitTests: 'unit-tests.json',
      mutationReport: 'mutation-report.html',
      perfMetrics: 'perf-metrics.json',
      sbom: 'sbom.json',
      orchestratorState,
    });

    // Optimistically add to local cache immediately.
    this.bundles.unshift(bundle);

    // Persist to Supabase in the background (best-effort).
    await this.persistBundle(bundle, orchestratorState as unknown as Record<string, unknown>);

    return bundle;
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
