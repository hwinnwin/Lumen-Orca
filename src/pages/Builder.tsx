import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import {
  Loader2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Rocket,
  DollarSign,
  AlertTriangle,
  Eye,
  Square,
  Clock,
  Ban,
  Plus,
  Send,
  Terminal,
  PanelLeftClose,
  PanelLeftOpen,
  Layers,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BuildStatus = 'queued' | 'pending' | 'specifying' | 'generating' | 'deploying' | 'live' | 'failed' | 'cancelled';

interface BuildStep {
  id: string;
  build_id: string;
  agent: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  output?: Record<string, unknown>;
  tokens_used?: number;
  cost?: number;
  started_at?: string;
  completed_at?: string;
  updated_at: string;
}

interface Build {
  id: string;
  user_id: string;
  prompt: string;
  status: BuildStatus;
  spec?: Record<string, unknown>;
  preview_url?: string;
  preview_url_expires_at?: string;
  preview_html?: string;
  error?: { message: string; retryable?: boolean; stage?: string };
  llm_cost?: number;
  position_in_queue?: number;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Constants & helpers
// ---------------------------------------------------------------------------

const MAX_PROMPT_LENGTH = 5000;

const PIPELINE_STAGES: { key: BuildStatus; label: string }[] = [
  { key: 'queued', label: 'Queued' },
  { key: 'pending', label: 'Init' },
  { key: 'specifying', label: 'Spec' },
  { key: 'generating', label: 'Codegen' },
  { key: 'deploying', label: 'Deploy' },
  { key: 'live', label: 'Live' },
];

const ACTIVE_STATUSES: BuildStatus[] = ['queued', 'pending', 'specifying', 'generating', 'deploying'];

function stageIndex(status: BuildStatus): number {
  const idx = PIPELINE_STAGES.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

function isTerminal(status: BuildStatus): boolean {
  return status === 'live' || status === 'failed' || status === 'cancelled';
}

function mapBuildResponse(data: any): Build {
  return {
    id: data.buildId ?? data.id,
    user_id: data.userId ?? data.user_id ?? '',
    prompt: data.prompt ?? '',
    status: data.status ?? 'pending',
    spec: data.spec,
    preview_url: data.previewUrl ?? data.preview_url,
    preview_html: data.previewHtml ?? data.preview_html,
    error: data.error,
    llm_cost: data.llmCost ?? data.llm_cost,
    position_in_queue: data.position ?? data.position_in_queue,
    created_at: data.created_at ?? new Date().toISOString(),
    updated_at: data.updated_at ?? new Date().toISOString(),
  };
}

function statusIcon(status: BuildStatus) {
  switch (status) {
    case 'queued': return <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />;
    case 'pending':
    case 'specifying':
    case 'generating':
    case 'deploying':
      return <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />;
    case 'live': return <Check className="w-3.5 h-3.5 text-green-500" />;
    case 'failed': return <X className="w-3.5 h-3.5 text-red-500" />;
    case 'cancelled': return <Ban className="w-3.5 h-3.5 text-zinc-400" />;
  }
}

function statusBadgeVariant(status: BuildStatus): 'default' | 'destructive' | 'outline' | 'secondary' {
  switch (status) {
    case 'live': return 'default';
    case 'failed': return 'destructive';
    case 'cancelled': return 'outline';
    default: return 'secondary';
  }
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Builder = () => {
  const { session } = useAuth();
  const { toast } = useToast();

  // Prompt
  const [prompt, setPrompt] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Builds
  const [activeBuilds, setActiveBuilds] = useState<Build[]>([]);
  const [history, setHistory] = useState<Build[]>([]);
  const [selectedBuildId, setSelectedBuildId] = useState<string | null>(null);
  const [steps, setSteps] = useState<BuildStep[]>([]);

  // Cancel
  const [cancellingIds, setCancellingIds] = useState<Set<string>>(new Set());

  // UI
  const [specOpen, setSpecOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Refs
  const channelsRef = useRef<Map<string, ReturnType<typeof supabase.channel>>>(new Map());
  const stepsChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Derived
  const selectedBuild = activeBuilds.find((b) => b.id === selectedBuildId)
    ?? history.find((b) => b.id === selectedBuildId)
    ?? null;

  const allBuilds = [
    ...activeBuilds,
    ...history.filter((h) => !activeBuilds.some((a) => a.id === h.id)),
  ];

  // ------------------------------------------------------------------
  // Data fetching
  // ------------------------------------------------------------------

  const fetchHistory = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from('builds' as any)
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    if (data) setHistory(data as unknown as Build[]);
  }, [session]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const loadActiveBuilds = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from('builds' as any)
      .select('*')
      .eq('user_id', session.user.id)
      .in('status', ACTIVE_STATUSES)
      .order('created_at', { ascending: true });
    if (data && data.length > 0) {
      const builds = data as unknown as Build[];
      setActiveBuilds(builds);
      for (const build of builds) subscribeToBuild(build.id);
      setSelectedBuildId((prev) => prev ?? builds[0].id);
    }
  }, [session]);

  useEffect(() => { loadActiveBuilds(); }, [loadActiveBuilds]);

  // ------------------------------------------------------------------
  // Preview HTML
  // ------------------------------------------------------------------

  const fetchPreviewHtml = useCallback(async (buildId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(`${supabaseUrl}/functions/v1/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': anonKey,
          'Authorization': `Bearer ${session?.access_token ?? anonKey}`,
        },
        body: JSON.stringify({ build_id: buildId }),
      });
      if (res.ok) {
        const html = await res.text();
        if (html.startsWith('<!DOCTYPE') || html.startsWith('<html')) {
          setActiveBuilds((prev) => prev.map((b) => b.id === buildId ? { ...b, preview_html: html } : b));
          setHistory((prev) => prev.map((b) => b.id === buildId ? { ...b, preview_html: html } : b));
        }
      }
    } catch { /* silent */ }
  }, []);

  // ------------------------------------------------------------------
  // Realtime
  // ------------------------------------------------------------------

  const subscribeToBuild = useCallback(
    (buildId: string) => {
      if (channelsRef.current.has(buildId)) return;

      const channel = supabase
        .channel(`build-${buildId}`)
        .on('postgres_changes' as any, {
          event: '*', schema: 'public', table: 'builds', filter: `id=eq.${buildId}`,
        }, (payload: any) => {
          const updated = payload.new as Build;

          setActiveBuilds((prev) => {
            const exists = prev.find((b) => b.id === buildId);
            if (!exists) return prev;
            if (isTerminal(updated.status)) return prev.filter((b) => b.id !== buildId);
            return prev.map((b) => b.id === buildId ? { ...updated, preview_html: b.preview_html } : b);
          });

          if (isTerminal(updated.status)) {
            setCancellingIds((prev) => { const next = new Set(prev); next.delete(buildId); return next; });
            const ch = channelsRef.current.get(buildId);
            if (ch) { supabase.removeChannel(ch); channelsRef.current.delete(buildId); }
            fetchHistory();
            if (updated.status === 'live') fetchPreviewHtml(buildId);
          }
        })
        .subscribe();

      channelsRef.current.set(buildId, channel);
    },
    [fetchHistory, fetchPreviewHtml],
  );

  // Steps subscription follows selectedBuildId
  useEffect(() => {
    if (!selectedBuildId) { setSteps([]); return; }

    (async () => {
      const { data } = await supabase
        .from('build_steps' as any)
        .select('*')
        .eq('build_id', selectedBuildId)
        .order('started_at', { ascending: true });
      if (data) setSteps(data as unknown as BuildStep[]);
    })();

    if (stepsChannelRef.current) supabase.removeChannel(stepsChannelRef.current);

    const channel = supabase
      .channel(`steps-${selectedBuildId}`)
      .on('postgres_changes' as any, {
        event: 'INSERT', schema: 'public', table: 'build_steps', filter: `build_id=eq.${selectedBuildId}`,
      }, (payload: any) => { setSteps((prev) => [...prev, payload.new as BuildStep]); })
      .on('postgres_changes' as any, {
        event: 'UPDATE', schema: 'public', table: 'build_steps', filter: `build_id=eq.${selectedBuildId}`,
      }, (payload: any) => {
        setSteps((prev) => prev.map((s) => s.id === (payload.new as BuildStep).id ? (payload.new as BuildStep) : s));
      })
      .subscribe();

    stepsChannelRef.current = channel;
    return () => { supabase.removeChannel(channel); stepsChannelRef.current = null; };
  }, [selectedBuildId]);

  // Cleanup
  useEffect(() => {
    return () => {
      for (const ch of channelsRef.current.values()) supabase.removeChannel(ch);
      channelsRef.current.clear();
      if (stepsChannelRef.current) supabase.removeChannel(stepsChannelRef.current);
    };
  }, []);

  // ------------------------------------------------------------------
  // Actions
  // ------------------------------------------------------------------

  const handleBuild = async () => {
    if (!session) {
      toast({ title: 'Not authenticated', description: 'Please sign in.', variant: 'destructive' });
      return;
    }
    if (!prompt.trim()) return;

    const submittedPrompt = prompt;
    setPrompt('');
    setSubmitting(true);

    const { data, error } = await supabase.functions.invoke('build-app', { body: { prompt: submittedPrompt } });
    setSubmitting(false);

    if (error) {
      toast({ title: 'Build failed', description: error.message, variant: 'destructive' });
      setPrompt(submittedPrompt);
      return;
    }

    const build = mapBuildResponse(data);
    build.prompt = submittedPrompt;
    setActiveBuilds((prev) => [...prev, build]);
    setSelectedBuildId(build.id);
    setSteps([]);
    setSpecOpen(false);
    subscribeToBuild(build.id);

    if (build.status === 'queued') {
      toast({ title: 'Queued', description: `Position #${build.position_in_queue}` });
    }

    textareaRef.current?.focus();
  };

  const handleCancel = async (buildId: string) => {
    setCancellingIds((prev) => new Set(prev).add(buildId));
    const { error } = await supabase.functions.invoke('cancel-build', { body: { build_id: buildId } });
    if (error) {
      toast({ title: 'Cancel failed', description: error.message, variant: 'destructive' });
      setCancellingIds((prev) => { const next = new Set(prev); next.delete(buildId); return next; });
    }
  };

  const handleRetry = async (build: Build) => {
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke('build-app', { body: { prompt: build.prompt } });
    setSubmitting(false);
    if (error) { toast({ title: 'Retry failed', description: error.message, variant: 'destructive' }); return; }
    const newBuild = mapBuildResponse(data);
    newBuild.prompt = build.prompt;
    setActiveBuilds((prev) => [...prev, newBuild]);
    setSelectedBuildId(newBuild.id);
    setSteps([]);
    subscribeToBuild(newBuild.id);
  };

  // ------------------------------------------------------------------
  // Derived values
  // ------------------------------------------------------------------

  const progressPercent = selectedBuild
    ? isTerminal(selectedBuild.status)
      ? selectedBuild.status === 'live' ? 100 : (stageIndex(selectedBuild.status) / PIPELINE_STAGES.length) * 100
      : ((stageIndex(selectedBuild.status) + 1) / PIPELINE_STAGES.length) * 100
    : 0;

  // ------------------------------------------------------------------
  // Render: Sidebar build item
  // ------------------------------------------------------------------

  const renderBuildItem = (build: Build) => {
    const isSelected = build.id === selectedBuildId;
    const isActive = !isTerminal(build.status);
    const isCancelling = cancellingIds.has(build.id);

    return (
      <button
        key={build.id}
        onClick={() => { setSelectedBuildId(build.id); setSpecOpen(false); }}
        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors group ${
          isSelected
            ? 'bg-primary/10 text-primary'
            : 'text-foreground/80 hover:bg-muted'
        }`}
      >
        <div className="flex items-center gap-2">
          {statusIcon(build.status)}
          <span className="truncate flex-1 text-xs font-medium">{build.prompt}</span>
          {isActive && (
            <button
              onClick={(e) => { e.stopPropagation(); handleCancel(build.id); }}
              disabled={isCancelling}
              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            >
              {isCancelling
                ? <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                : <Square className="w-3 h-3 text-muted-foreground hover:text-destructive" />
              }
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 ml-5.5">
          <span className="text-[10px] text-muted-foreground font-mono">{formatTime(build.created_at)}</span>
          {build.status === 'queued' && build.position_in_queue && (
            <span className="text-[10px] text-amber-500 font-mono">#{build.position_in_queue}</span>
          )}
        </div>
      </button>
    );
  };

  // ------------------------------------------------------------------
  // Render: Main content (center panel)
  // ------------------------------------------------------------------

  const renderMainContent = () => {
    if (!selectedBuild) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <Layers className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium mb-1">No build selected</p>
            <p className="text-sm">Type a prompt below to start building.</p>
          </div>
        </div>
      );
    }

    return (
      <ScrollArea className="h-full">
        <div className="p-6 space-y-4">
          {/* Build header */}
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                {statusIcon(selectedBuild.status)}
                <Badge variant={statusBadgeVariant(selectedBuild.status)} className="text-[10px]">
                  {selectedBuild.status.toUpperCase()}
                </Badge>
                {selectedBuild.llm_cost != null && (
                  <span className="text-[10px] text-muted-foreground font-mono flex items-center gap-0.5">
                    <DollarSign className="w-3 h-3" />{selectedBuild.llm_cost.toFixed(4)}
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{selectedBuild.prompt}</p>
            </div>
            <div className="flex gap-2 shrink-0">
              {!isTerminal(selectedBuild.status) && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleCancel(selectedBuild.id)}
                  disabled={cancellingIds.has(selectedBuild.id)}
                  className="gap-1.5 h-8"
                >
                  {cancellingIds.has(selectedBuild.id)
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Square className="w-3.5 h-3.5" />
                  }
                  Cancel
                </Button>
              )}
              {(selectedBuild.status === 'failed' || selectedBuild.status === 'cancelled') && (
                <Button variant="outline" size="sm" onClick={() => handleRetry(selectedBuild)} className="gap-1.5 h-8">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Retry
                </Button>
              )}
            </div>
          </div>

          {/* Pipeline progress */}
          {!isTerminal(selectedBuild.status) && (
            <div className="space-y-3">
              <Progress value={progressPercent} className="h-1.5" />
              <div className="flex items-center justify-between">
                {PIPELINE_STAGES.map((stage) => {
                  const current = stageIndex(selectedBuild.status);
                  const idx = stageIndex(stage.key);
                  const isActiveStage = selectedBuild.status === stage.key;
                  const isDone = idx < current;
                  const isQueued = isActiveStage && stage.key === 'queued';

                  return (
                    <div key={stage.key} className="flex flex-col items-center gap-1">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono border transition-colors ${
                        isDone ? 'border-green-500/50 bg-green-500/10 text-green-600'
                          : isQueued ? 'border-amber-500/50 bg-amber-500/10 text-amber-600'
                          : isActiveStage ? 'border-primary/50 bg-primary/10 text-primary'
                          : 'border-border bg-muted/30 text-muted-foreground/50'
                      }`}>
                        {isDone ? <Check className="w-3 h-3" />
                          : isQueued ? <Clock className="w-3 h-3 animate-pulse" />
                          : isActiveStage ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <span>{idx + 1}</span>}
                      </div>
                      <span className={`text-[10px] ${
                        isActiveStage ? 'font-semibold text-primary'
                          : isDone ? 'text-green-600'
                          : 'text-muted-foreground/50'
                      }`}>
                        {stage.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Queue info */}
          {selectedBuild.status === 'queued' && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-sm">
              <Clock className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
              <span className="text-amber-700 dark:text-amber-400">
                Position #{selectedBuild.position_in_queue ?? '?'} in queue — starts automatically when a slot opens.
              </span>
            </div>
          )}

          {/* Error display */}
          {selectedBuild.status === 'failed' && selectedBuild.error && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-sm">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Build failed</p>
                <p className="text-destructive/80 text-xs mt-0.5">{selectedBuild.error.message}</p>
              </div>
            </div>
          )}

          {/* Cancelled display */}
          {selectedBuild.status === 'cancelled' && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border text-sm">
              <Ban className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">
                {selectedBuild.error?.message || 'Build was cancelled.'}
              </span>
            </div>
          )}

          {/* Build steps log */}
          {steps.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Build Log</h3>
              <div className="space-y-1 font-mono text-xs">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-2 py-1 px-2 rounded hover:bg-muted/50">
                    <span className="shrink-0">
                      {step.status === 'completed' ? <Check className="w-3.5 h-3.5 text-green-500" />
                        : step.status === 'running' ? <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                        : step.status === 'failed' ? <X className="w-3.5 h-3.5 text-destructive" />
                        : <span className="block w-3.5 h-3.5 rounded-full border border-muted-foreground/30" />}
                    </span>
                    <span className="flex-1 text-foreground/80">{step.agent}</span>
                    <span className={`text-[10px] ${
                      step.status === 'completed' ? 'text-green-500'
                        : step.status === 'failed' ? 'text-destructive'
                        : step.status === 'running' ? 'text-primary'
                        : 'text-muted-foreground'
                    }`}>
                      {step.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Spec preview */}
          {selectedBuild.spec && (
            <Collapsible open={specOpen} onOpenChange={setSpecOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors cursor-pointer w-full">
                {specOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                <Eye className="w-3 h-3" />
                Spec
              </CollapsibleTrigger>
              <CollapsibleContent>
                <pre className="mt-2 bg-muted/50 rounded-md p-3 text-[11px] font-mono overflow-auto max-h-80 whitespace-pre-wrap break-words border">
                  {JSON.stringify(selectedBuild.spec, null, 2)}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </ScrollArea>
    );
  };

  // ------------------------------------------------------------------
  // Render: Preview panel (right)
  // ------------------------------------------------------------------

  const renderPreview = () => {
    if (!selectedBuild || selectedBuild.status !== 'live') {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground/50">
          <div className="text-center">
            <Eye className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs">Preview appears here when a build goes live</p>
          </div>
        </div>
      );
    }

    if (!selectedBuild.preview_html) {
      return (
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      );
    }

    return (
      <iframe
        srcDoc={selectedBuild.preview_html}
        title="App Preview"
        className="w-full h-full bg-white"
        sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
      />
    );
  };

  // ------------------------------------------------------------------
  // Render: Main layout
  // ------------------------------------------------------------------

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="h-7 w-7 p-0"
          >
            {sidebarCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </Button>
          <h1 className="text-sm font-semibold">AI App Builder</h1>
          {activeBuilds.length > 0 && (
            <Badge variant="secondary" className="text-[10px] gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              {activeBuilds.length} active
            </Badge>
          )}
        </div>
      </div>

      {/* Body: sidebar + main + preview */}
      <div className="flex-1 min-h-0">
        <ResizablePanelGroup direction="horizontal">
          {/* Sidebar */}
          {!sidebarCollapsed && (
            <>
              <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                <div className="h-full flex flex-col bg-muted/30">
                  {/* Active builds section */}
                  {activeBuilds.length > 0 && (
                    <div className="p-2">
                      <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Active ({activeBuilds.length})
                      </div>
                      <div className="space-y-0.5 mt-1">
                        {activeBuilds.map(renderBuildItem)}
                      </div>
                    </div>
                  )}

                  {activeBuilds.length > 0 && history.length > 0 && <Separator />}

                  {/* History section */}
                  <ScrollArea className="flex-1">
                    <div className="p-2">
                      <div className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Recent
                      </div>
                      <div className="space-y-0.5 mt-1">
                        {history
                          .filter((h) => !activeBuilds.some((a) => a.id === h.id))
                          .map(renderBuildItem)}
                      </div>
                      {history.length === 0 && (
                        <p className="text-xs text-muted-foreground/50 px-2 py-4">No builds yet</p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          )}

          {/* Center: main content */}
          <ResizablePanel defaultSize={sidebarCollapsed ? 55 : 45} minSize={30}>
            <div className="h-full flex flex-col">
              <div className="flex-1 min-h-0">
                {renderMainContent()}
              </div>
            </div>
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* Right: preview */}
          <ResizablePanel defaultSize={35} minSize={20}>
            <div className="h-full border-l flex flex-col">
              <div className="px-3 py-2 border-b flex items-center gap-2">
                <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preview</span>
              </div>
              <div className="flex-1 min-h-0">
                {renderPreview()}
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Bottom: prompt bar (terminal-style) */}
      <div className="border-t bg-background">
        <div className="flex items-end gap-2 p-3">
          <div className="flex items-center gap-1.5 text-muted-foreground shrink-0 pb-2">
            <Terminal className="w-4 h-4" />
          </div>
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              placeholder="Describe an app to build... (⌘+Enter to submit)"
              value={prompt}
              onChange={(e) => { if (e.target.value.length <= MAX_PROMPT_LENGTH) setPrompt(e.target.value); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && prompt.trim() && !submitting) {
                  e.preventDefault();
                  handleBuild();
                }
              }}
              rows={1}
              className="resize-none min-h-[38px] max-h-[120px] pr-20 text-sm font-mono"
              style={{ height: 'auto', overflow: 'hidden' }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 120) + 'px';
              }}
            />
            <div className="absolute right-2 bottom-1.5 flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground font-mono">
                {prompt.length}/{MAX_PROMPT_LENGTH}
              </span>
              <Button
                size="sm"
                onClick={handleBuild}
                disabled={submitting || !prompt.trim()}
                className="h-7 px-3 gap-1.5"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                {activeBuilds.length > 0 ? 'Queue' : 'Build'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Builder;
