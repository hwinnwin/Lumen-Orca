import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart3, TrendingUp, Activity, DollarSign, Cpu, Zap,
  AlertTriangle, CheckCircle2, XCircle, Clock, Brain, RefreshCw,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  telemetryService,
  type ProviderHealthStatus,
  type LLMUsageSummary,
  type AgentPerformanceSummary,
  type BuildPipelineStats,
  type BuildStepPerformance,
  type CostBudget,
  type TimeSeriesPoint,
} from "@/lib/telemetry-service";

const CHART_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--chart-2, 160 60% 45%))",
  "hsl(var(--chart-3, 30 80% 55%))",
  "hsl(var(--chart-4, 280 65% 60%))",
  "hsl(var(--chart-5, 340 75% 55%))",
];

const PIE_COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

function formatCost(cost: number): string {
  if (cost < 0.01) return `$${cost.toFixed(4)}`;
  if (cost < 1) return `$${cost.toFixed(3)}`;
  return `$${cost.toFixed(2)}`;
}

function formatLatency(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const Telemetry = () => {
  const [timeRange, setTimeRange] = useState("7");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Data state
  const [providers, setProviders] = useState<ProviderHealthStatus[]>([]);
  const [llmUsage, setLLMUsage] = useState<LLMUsageSummary | null>(null);
  const [agentPerf, setAgentPerf] = useState<AgentPerformanceSummary[]>([]);
  const [buildStats, setBuildStats] = useState<BuildPipelineStats | null>(null);
  const [stepPerf, setStepPerf] = useState<BuildStepPerformance[]>([]);
  const [budgets, setBudgets] = useState<CostBudget[]>([]);
  const [costSeries, setCostSeries] = useState<TimeSeriesPoint[]>([]);
  const [callSeries, setCallSeries] = useState<TimeSeriesPoint[]>([]);

  const loadData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    const days = parseInt(timeRange);

    const [
      providerData,
      usageData,
      perfData,
      buildData,
      stepData,
      budgetData,
      costData,
      callData,
    ] = await Promise.all([
      telemetryService.getProviderHealth(),
      telemetryService.getLLMUsageSummary(days),
      telemetryService.getAgentPerformance(),
      telemetryService.getBuildPipelineStats(),
      telemetryService.getBuildStepPerformance(),
      telemetryService.getCostBudgets(),
      telemetryService.getCostTimeSeries(days),
      telemetryService.getCallVolumeTimeSeries(days),
    ]);

    setProviders(providerData);
    setLLMUsage(usageData);
    setAgentPerf(perfData);
    setBuildStats(buildData);
    setStepPerf(stepData);
    setBudgets(budgetData);
    setCostSeries(costData);
    setCallSeries(callData);

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const providerStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">System Telemetry</h1>
          <p className="text-muted-foreground">Loading metrics...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mb-2" />
              <div className="h-8 bg-muted rounded w-3/4" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">System Telemetry</h1>
          <p className="text-muted-foreground">
            Real-time metrics, performance graphs, and quality indicators
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Last 24h</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 rounded-md border hover:bg-muted transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-1">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">LLM Calls</span>
          </div>
          <div className="text-2xl font-bold">{formatNumber(llmUsage?.totalCalls || 0)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {formatNumber((llmUsage?.totalTokensInput || 0) + (llmUsage?.totalTokensOutput || 0))} tokens
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-1">
            <DollarSign className="h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">Total Cost</span>
          </div>
          <div className="text-2xl font-bold">{formatCost(llmUsage?.totalCost || 0)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Avg {formatCost((llmUsage?.totalCost || 0) / Math.max(1, llmUsage?.totalCalls || 1))}/call
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-1">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-muted-foreground">Avg Latency</span>
          </div>
          <div className="text-2xl font-bold">{formatLatency(llmUsage?.avgLatencyMs || 0)}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Cache hit: {((llmUsage?.cacheHitRate || 0) * 100).toFixed(1)}%
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3 mb-1">
            <BarChart3 className="h-4 w-4 text-purple-500" />
            <span className="text-sm text-muted-foreground">Builds</span>
          </div>
          <div className="text-2xl font-bold">{buildStats?.totalBuilds || 0}</div>
          <div className="text-xs text-muted-foreground mt-1">
            {(buildStats?.successRate || 0).toFixed(0)}% success rate
          </div>
        </Card>
      </div>

      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList className="grid w-full max-w-2xl grid-cols-5">
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
          <TabsTrigger value="builds">Builds</TabsTrigger>
          <TabsTrigger value="volume">Volume</TabsTrigger>
        </TabsList>

        {/* Provider Health Tab */}
        <TabsContent value="providers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Provider Status Cards */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Provider Health
                </CardTitle>
                <CardDescription>Current status of LLM providers</CardDescription>
              </CardHeader>
              <CardContent>
                {providers.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No provider data yet. Run some LLM calls to populate.</p>
                ) : (
                  <div className="space-y-3">
                    {providers.map(p => (
                      <div key={p.provider} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          {providerStatusIcon(p.status)}
                          <div>
                            <div className="font-medium capitalize">{p.provider}</div>
                            <div className="text-xs text-muted-foreground">
                              {formatLatency(p.avgLatencyMs)} avg
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={p.status === 'healthy' ? 'default' : p.status === 'degraded' ? 'secondary' : 'destructive'}>
                            {(p.successRate * 100).toFixed(1)}% uptime
                          </Badge>
                          {p.consecutiveFailures > 0 && (
                            <div className="text-xs text-red-500 mt-1">
                              {p.consecutiveFailures} consecutive failures
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Provider Usage Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Usage by Provider
                </CardTitle>
                <CardDescription>Distribution of LLM calls across providers</CardDescription>
              </CardHeader>
              <CardContent>
                {(llmUsage?.byProvider.length || 0) === 0 ? (
                  <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                    No usage data yet
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <PieChart>
                      <Pie
                        data={llmUsage!.byProvider.map(p => ({
                          name: `${p.provider} (${p.model})`,
                          value: p.calls,
                        }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {llmUsage!.byProvider.map((_, index) => (
                          <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [value, "Calls"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Budget Gauges */}
            {budgets.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Budget Status
                  </CardTitle>
                  <CardDescription>Monthly spend vs budget by provider</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {budgets.map(b => (
                      <div key={b.provider} className="p-3 rounded-lg border space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium capitalize">{b.provider}</span>
                          <Badge variant={b.isOverThreshold ? "destructive" : "default"}>
                            {(b.percentUsed * 100).toFixed(0)}%
                          </Badge>
                        </div>
                        <Progress value={Math.min(100, b.percentUsed * 100)} className="h-2" />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{formatCost(b.currentSpend)} spent</span>
                          <span>{formatCost(b.monthlyBudget)} budget</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Agent Performance Tab */}
        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Agent Success Rates */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Agent Performance
                </CardTitle>
                <CardDescription>Success rates, latency, and quality scores per agent</CardDescription>
              </CardHeader>
              <CardContent>
                {agentPerf.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No agent execution data yet. Run the ORCA pipeline to populate.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Agent</TableHead>
                          <TableHead className="text-right">Runs</TableHead>
                          <TableHead className="text-right">Success</TableHead>
                          <TableHead className="text-right">Avg Latency</TableHead>
                          <TableHead className="text-right">Quality</TableHead>
                          <TableHead className="text-right">Avg Cost</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {agentPerf.map(a => (
                          <TableRow key={a.agentRole}>
                            <TableCell className="font-medium">{a.agentRole}</TableCell>
                            <TableCell className="text-right">{a.executionCount}</TableCell>
                            <TableCell className="text-right">
                              <span className={a.successRate >= 0.95 ? 'text-green-500' : a.successRate >= 0.8 ? 'text-yellow-500' : 'text-red-500'}>
                                {(a.successRate * 100).toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell className="text-right">{formatLatency(a.avgLatencyMs)}</TableCell>
                            <TableCell className="text-right">
                              {a.avgQualityScore > 0 ? `${(a.avgQualityScore * 100).toFixed(0)}%` : '-'}
                            </TableCell>
                            <TableCell className="text-right">{formatCost(a.avgCost)}</TableCell>
                            <TableCell>
                              {a.isRegressed ? (
                                <Badge variant="destructive">{a.regressionSeverity || 'regressed'}</Badge>
                              ) : (
                                <Badge variant="default" className="bg-green-500/10 text-green-600">healthy</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Agent Success Rate Bar Chart */}
            {agentPerf.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Agent Success Rates</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={agentPerf.map(a => ({
                      name: a.agentRole.replace('A', '').replace('_', ' '),
                      successRate: Number((a.successRate * 100).toFixed(1)),
                      baseline: a.baselineSuccessRate ? Number((a.baselineSuccessRate * 100).toFixed(1)) : null,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis domain={[0, 100]} className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="successRate" fill={CHART_COLORS[0]} name="Success Rate %" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="baseline" fill={CHART_COLORS[1]} name="Baseline %" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Usage by Agent */}
            {(llmUsage?.byAgent.length || 0) > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>LLM Usage by Agent</CardTitle>
                  <CardDescription>Call volume, cost, and average token usage per agent</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={llmUsage!.byAgent.map(a => ({
                      name: a.agentRole.replace('A', '').replace('_', ' '),
                      calls: a.calls,
                      cost: Number(a.cost.toFixed(4)),
                      avgTokens: a.avgTokens,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="calls" fill={CHART_COLORS[0]} name="Calls" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="avgTokens" fill={CHART_COLORS[2]} name="Avg Tokens" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Daily Cost Trend
              </CardTitle>
              <CardDescription>LLM spend per day over the selected time range</CardDescription>
            </CardHeader>
            <CardContent>
              {costSeries.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                  No cost data for this period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={costSeries.map(p => ({ date: p.timestamp.slice(5), cost: Number(p.value.toFixed(4)) }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(value: number) => [`$${value.toFixed(4)}`, "Cost"]} />
                    <Line type="monotone" dataKey="cost" stroke={CHART_COLORS[0]} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Cost Breakdown Table */}
          {(llmUsage?.byProvider.length || 0) > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown by Provider</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead className="text-right">Calls</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                      <TableHead className="text-right">Avg Latency</TableHead>
                      <TableHead className="text-right">Cost/Call</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {llmUsage!.byProvider.map((p, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium capitalize">{p.provider}</TableCell>
                        <TableCell className="font-mono text-xs">{p.model}</TableCell>
                        <TableCell className="text-right">{p.calls}</TableCell>
                        <TableCell className="text-right">{formatCost(p.cost)}</TableCell>
                        <TableCell className="text-right">{formatLatency(p.avgLatencyMs)}</TableCell>
                        <TableCell className="text-right">{formatCost(p.cost / Math.max(1, p.calls))}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Builds Tab */}
        <TabsContent value="builds" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-5">
              <div className="text-sm text-muted-foreground mb-1">Total Builds</div>
              <div className="text-2xl font-bold">{buildStats?.totalBuilds || 0}</div>
            </Card>
            <Card className="p-5">
              <div className="text-sm text-muted-foreground mb-1">Success Rate</div>
              <div className="text-2xl font-bold text-green-500">
                {(buildStats?.successRate || 0).toFixed(0)}%
              </div>
            </Card>
            <Card className="p-5">
              <div className="text-sm text-muted-foreground mb-1">Avg Duration</div>
              <div className="text-2xl font-bold">
                {(buildStats?.avgDurationSeconds || 0).toFixed(0)}s
              </div>
            </Card>
            <Card className="p-5">
              <div className="text-sm text-muted-foreground mb-1">Avg Cost/Build</div>
              <div className="text-2xl font-bold">{formatCost(buildStats?.avgCostPerBuild || 0)}</div>
            </Card>
          </div>

          {/* Build Step Performance */}
          {stepPerf.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pipeline Step Performance</CardTitle>
                <CardDescription>Per-agent build step metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Agent</TableHead>
                      <TableHead className="text-right">Runs</TableHead>
                      <TableHead className="text-right">Success</TableHead>
                      <TableHead className="text-right">Failures</TableHead>
                      <TableHead className="text-right">Avg Duration</TableHead>
                      <TableHead className="text-right">Avg Tokens</TableHead>
                      <TableHead className="text-right">Total Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stepPerf.map(s => {
                      const rate = s.totalRuns > 0 ? s.successes / s.totalRuns : 0;
                      return (
                        <TableRow key={s.agent}>
                          <TableCell className="font-medium">{s.agent}</TableCell>
                          <TableCell className="text-right">{s.totalRuns}</TableCell>
                          <TableCell className="text-right text-green-500">{s.successes}</TableCell>
                          <TableCell className="text-right text-red-500">{s.failures}</TableCell>
                          <TableCell className="text-right">{s.avgDurationSeconds.toFixed(1)}s</TableCell>
                          <TableCell className="text-right">{formatNumber(s.avgTokens)}</TableCell>
                          <TableCell className="text-right">{formatCost(s.totalCost)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Volume Tab */}
        <TabsContent value="volume" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Daily Call Volume
              </CardTitle>
              <CardDescription>Number of LLM API calls per day</CardDescription>
            </CardHeader>
            <CardContent>
              {callSeries.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground text-sm">
                  No call data for this period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={callSeries.map(p => ({ date: p.timestamp.slice(5), calls: p.value }))}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip formatter={(value: number) => [value, "Calls"]} />
                    <Bar dataKey="calls" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Token Usage Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-5">
              <div className="text-sm text-muted-foreground mb-1">Input Tokens</div>
              <div className="text-2xl font-bold">{formatNumber(llmUsage?.totalTokensInput || 0)}</div>
            </Card>
            <Card className="p-5">
              <div className="text-sm text-muted-foreground mb-1">Output Tokens</div>
              <div className="text-2xl font-bold">{formatNumber(llmUsage?.totalTokensOutput || 0)}</div>
            </Card>
            <Card className="p-5">
              <div className="text-sm text-muted-foreground mb-1">Total Tokens</div>
              <div className="text-2xl font-bold">
                {formatNumber((llmUsage?.totalTokensInput || 0) + (llmUsage?.totalTokensOutput || 0))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Telemetry;
