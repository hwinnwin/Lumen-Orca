import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import {
  Loader2,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  History,
  Rocket,
  DollarSign,
  AlertTriangle,
  Eye,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type BuildStatus = 'pending' | 'specifying' | 'generating' | 'deploying' | 'live' | 'failed';

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
  error?: { message: string; retryable?: boolean };
  llm_cost?: number;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_PROMPT_LENGTH = 5000;

const PIPELINE_STAGES: { key: BuildStatus; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'specifying', label: 'Specifying' },
  { key: 'generating', label: 'Generating' },
  { key: 'deploying', label: 'Deploying' },
  { key: 'live', label: 'Live' },
];

function stageIndex(status: BuildStatus): number {
  const idx = PIPELINE_STAGES.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

/** Map build-app Edge Function response (camelCase) to Build interface (snake_case) */
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
    created_at: data.created_at ?? new Date().toISOString(),
    updated_at: data.updated_at ?? new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const Builder = () => {
  const { session } = useAuth();
  const { toast } = useToast();

  // Prompt
  const [prompt, setPrompt] = useState('');

  // Current build
  const [building, setBuilding] = useState(false);
  const [currentBuild, setCurrentBuild] = useState<Build | null>(null);
  const [steps, setSteps] = useState<BuildStep[]>([]);

  // Spec preview
  const [specOpen, setSpecOpen] = useState(false);

  // History
  const [history, setHistory] = useState<Build[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Ref to track active subscriptions for cleanup
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ------------------------------------------------------------------
  // Fetch build history
  // ------------------------------------------------------------------

  const fetchHistory = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from('builds' as any)
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setHistory(data as unknown as Build[]);
  }, [session]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // ------------------------------------------------------------------
  // Fetch preview HTML from Edge Function (for history builds)
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
          setCurrentBuild((prev) => prev ? { ...prev, preview_html: html } : prev);
        }
      }
    } catch {
      // Silent fail — user can click "Open" link as fallback
    }
  }, []);

  // ------------------------------------------------------------------
  // Realtime subscriptions
  // ------------------------------------------------------------------

  const subscribeToBuild = useCallback(
    (buildId: string) => {
      // Clean up previous channel
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      const channel = supabase
        .channel(`build-${buildId}`)
        .on(
          'postgres_changes' as any,
          {
            event: '*',
            schema: 'public',
            table: 'builds',
            filter: `id=eq.${buildId}`,
          },
          (payload: any) => {
            const updated = payload.new as Build;
            setCurrentBuild((prev) => ({
              ...updated,
              // Preserve preview_html from the initial build response (not in DB)
              preview_html: prev?.preview_html,
            }));
            if (updated.status === 'live' || updated.status === 'failed') {
              setBuilding(false);
              fetchHistory();
              // If we don't have preview_html yet (e.g. loaded from history), fetch it
              if (updated.status === 'live') {
                fetchPreviewHtml(updated.id);
              }
            }
          },
        )
        .on(
          'postgres_changes' as any,
          {
            event: 'INSERT',
            schema: 'public',
            table: 'build_steps',
            filter: `build_id=eq.${buildId}`,
          },
          (payload: any) => {
            setSteps((prev) => [...prev, payload.new as BuildStep]);
          },
        )
        .on(
          'postgres_changes' as any,
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'build_steps',
            filter: `build_id=eq.${buildId}`,
          },
          (payload: any) => {
            setSteps((prev) =>
              prev.map((s) => (s.id === (payload.new as BuildStep).id ? (payload.new as BuildStep) : s)),
            );
          },
        )
        .subscribe();

      channelRef.current = channel;
    },
    [fetchHistory],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // ------------------------------------------------------------------
  // Start build
  // ------------------------------------------------------------------

  const handleBuild = async () => {
    if (!session) {
      toast({ title: 'Not authenticated', description: 'Please sign in before building an app.', variant: 'destructive' });
      return;
    }
    if (!prompt.trim()) {
      toast({ title: 'Prompt required', description: 'Enter a description of the app you want to build.' });
      return;
    }

    setBuilding(true);
    setSteps([]);
    setCurrentBuild(null);
    setSpecOpen(false);

    const { data, error } = await supabase.functions.invoke('build-app', {
      body: { prompt },
    });

    if (error) {
      toast({ title: 'Build failed to start', description: error.message, variant: 'destructive' });
      setBuilding(false);
      return;
    }

    const build = mapBuildResponse(data);
    setCurrentBuild(build);
    subscribeToBuild(build.id);
  };

  // ------------------------------------------------------------------
  // Retry
  // ------------------------------------------------------------------

  const handleRetry = async () => {
    if (!currentBuild) return;
    setBuilding(true);
    setSteps([]);
    setCurrentBuild(null);

    const { data, error } = await supabase.functions.invoke('build-app', {
      body: { prompt: currentBuild.prompt },
    });

    if (error) {
      toast({ title: 'Retry failed', description: error.message, variant: 'destructive' });
      setBuilding(false);
      return;
    }

    const build = mapBuildResponse(data);
    setCurrentBuild(build);
    subscribeToBuild(build.id);
  };

  // ------------------------------------------------------------------
  // Refresh preview URL
  // ------------------------------------------------------------------

  const handleRefreshUrl = async () => {
    if (!currentBuild) return;
    const { data, error } = await supabase.functions.invoke('refresh-preview-url', {
      body: { build_id: currentBuild.id },
    });
    if (error) {
      toast({ title: 'Could not refresh URL', description: error.message, variant: 'destructive' });
      return;
    }
    setCurrentBuild((prev) =>
      prev ? { ...prev, preview_url: (data as any).preview_url, preview_url_expires_at: (data as any).expires_at } : prev,
    );
  };

  // ------------------------------------------------------------------
  // Load a history build
  // ------------------------------------------------------------------

  const loadBuild = async (build: Build) => {
    setCurrentBuild(build);
    setPrompt(build.prompt);
    setBuilding(build.status !== 'live' && build.status !== 'failed');
    setSpecOpen(false);

    // Fetch steps for this build
    const { data } = await supabase
      .from('build_steps' as any)
      .select('*')
      .eq('build_id', build.id)
      .order('started_at', { ascending: true });
    if (data) setSteps(data as unknown as BuildStep[]);

    // Subscribe if still in progress
    if (build.status !== 'live' && build.status !== 'failed') {
      subscribeToBuild(build.id);
    }

    // Fetch preview HTML for completed builds
    if (build.status === 'live') {
      fetchPreviewHtml(build.id);
    }
  };

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------

  const progressPercent = currentBuild
    ? currentBuild.status === 'failed'
      ? stageIndex(currentBuild.status) * 25
      : ((stageIndex(currentBuild.status) + 1) / PIPELINE_STAGES.length) * 100
    : 0;

  const isPreviewExpired =
    currentBuild?.preview_url_expires_at && new Date(currentBuild.preview_url_expires_at) < new Date();

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------

  return (
    <div className="min-h-screen p-8 gradient-mesh">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">AI App Builder</h1>
        <p className="text-muted-foreground">Describe your app and let the agents build it for you.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Prompt + Pipeline + Steps */}
        <div className="lg:col-span-2 space-y-6">
          {/* Prompt Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Prompt</CardTitle>
              <CardDescription>Describe the application you want to build.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Textarea
                  placeholder="e.g. A task management app with drag-and-drop Kanban boards, user auth, and real-time collaboration..."
                  value={prompt}
                  onChange={(e) => {
                    if (e.target.value.length <= MAX_PROMPT_LENGTH) setPrompt(e.target.value);
                  }}
                  rows={5}
                  disabled={building}
                  className="resize-y"
                />
                <span className="absolute bottom-2 right-3 text-xs text-muted-foreground">
                  {prompt.length}/{MAX_PROMPT_LENGTH}
                </span>
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-3">
              <Button onClick={handleBuild} disabled={building || !prompt.trim()} className="gap-2">
                {building ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
                {building ? 'Building...' : 'Build App'}
              </Button>
            </CardFooter>
          </Card>

          {/* Pipeline Stepper */}
          {currentBuild && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pipeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Progress value={progressPercent} className="h-2" />

                <div className="flex items-center justify-between text-sm">
                  {PIPELINE_STAGES.map((stage) => {
                    const current = stageIndex(currentBuild.status);
                    const idx = stageIndex(stage.key);
                    const isActive = currentBuild.status === stage.key;
                    const isDone = idx < current || currentBuild.status === 'live';
                    const isError = currentBuild.status === 'failed' && idx === current;

                    return (
                      <div key={stage.key} className="flex flex-col items-center gap-1">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors ${
                            isError
                              ? 'border-destructive bg-destructive/10 text-destructive'
                              : isDone
                                ? 'border-green-500 bg-green-500/10 text-green-600'
                                : isActive
                                  ? 'border-primary bg-primary/10 text-primary'
                                  : 'border-muted bg-muted/30 text-muted-foreground'
                          }`}
                        >
                          {isError ? (
                            <X className="w-4 h-4" />
                          ) : isDone ? (
                            <Check className="w-4 h-4" />
                          ) : isActive ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <span
                          className={`text-xs ${
                            isActive ? 'font-semibold text-primary' : isDone ? 'text-green-600' : 'text-muted-foreground'
                          }`}
                        >
                          {stage.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step Log */}
          {steps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Build Steps</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {steps.map((step) => (
                    <li key={step.id} className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5">
                        {step.status === 'completed' ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : step.status === 'running' ? (
                          <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        ) : step.status === 'failed' ? (
                          <X className="w-4 h-4 text-destructive" />
                        ) : (
                          <span className="block w-4 h-4 rounded-full border-2 border-muted" />
                        )}
                      </span>
                      <div className="flex-1">
                        <span className="font-medium">{step.agent}</span>
                      </div>
                      <Badge
                        variant={
                          step.status === 'completed'
                            ? 'default'
                            : step.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                        }
                        className="text-[10px] px-1.5"
                      >
                        {step.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Expandable Spec Preview */}
          {currentBuild?.spec && (
            <Collapsible open={specOpen} onOpenChange={setSpecOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Spec Preview
                      </CardTitle>
                      {specOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent>
                    <pre className="bg-muted/50 rounded-md p-4 text-xs overflow-auto max-h-96 whitespace-pre-wrap break-words">
                      {JSON.stringify(currentBuild.spec, null, 2)}
                    </pre>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Error Display */}
          {currentBuild?.status === 'failed' && currentBuild.error && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-lg text-destructive flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Build Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-destructive mb-4">{currentBuild.error.message}</p>
                {currentBuild.error.retryable && (
                  <Button variant="outline" onClick={handleRetry} className="gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Retry Build
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right column: Preview + History + Cost */}
        <div className="space-y-6">
          {/* Preview */}
          {currentBuild?.status === 'live' && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Preview</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {currentBuild.preview_html ? (
                  <>
                    <div className="hidden md:block">
                      <iframe
                        srcDoc={currentBuild.preview_html}
                        title="App Preview"
                        className="w-full h-[500px] rounded-md border bg-white"
                        sandbox="allow-scripts allow-forms allow-popups allow-same-origin"
                      />
                    </div>
                    <div className="md:hidden">
                      <p className="text-sm text-muted-foreground">
                        Preview is only available on desktop. Please use a wider screen to view the app.
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading preview...
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* LLM Cost */}
          {currentBuild?.llm_cost != null && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  LLM Cost
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">${currentBuild.llm_cost.toFixed(4)}</p>
                <p className="text-xs text-muted-foreground mt-1">Total cost for this build</p>
              </CardContent>
            </Card>
          )}

          {/* Build History */}
          <Collapsible open={historyOpen} onOpenChange={setHistoryOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <History className="w-4 h-4" />
                      Build History
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {history.length}
                      </Badge>
                      {historyOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  {history.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No builds yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {history.map((build) => (
                        <li key={build.id}>
                          <button
                            onClick={() => loadBuild(build)}
                            className="w-full text-left p-3 rounded-md border hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <Badge
                                variant={
                                  build.status === 'live'
                                    ? 'default'
                                    : build.status === 'failed'
                                      ? 'destructive'
                                      : 'secondary'
                                }
                                className="text-[10px]"
                              >
                                {build.status}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(build.created_at).toLocaleDateString(undefined, {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <p className="text-sm truncate">{build.prompt}</p>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      </div>
    </div>
  );
};

export default Builder;
