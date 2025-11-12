import { Card } from "@/components/ui/card";
import { Activity, Clock, Cpu, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useOrchestrator } from "@/hooks/use-orchestrator";

interface ExecutionMetric {
  timestamp: string;
  taskId: string;
  agentRole: string;
  executionTimeMs: number;
  success: boolean;
  memoryUsedMb?: number;
}

export const ExecutionMonitor = () => {
  const { state } = useOrchestrator();
  const [executionHistory, setExecutionHistory] = useState<ExecutionMetric[]>([]);
  const [activeExecutions, setActiveExecutions] = useState(0);

  useEffect(() => {
    // Track running tasks
    const runningCount = state.tasks.filter(t => t.status === 'running').length;
    setActiveExecutions(runningCount);
  }, [state.tasks]);

  // Calculate metrics
  const totalExecutions = executionHistory.length;
  const successfulExecutions = executionHistory.filter(e => e.success).length;
  const failedExecutions = executionHistory.filter(e => !e.success).length;
  const avgExecutionTime = totalExecutions > 0
    ? executionHistory.reduce((sum, e) => sum + e.executionTimeMs, 0) / totalExecutions
    : 0;
  const successRate = totalExecutions > 0
    ? (successfulExecutions / totalExecutions) * 100
    : 100;

  return (
    <Card className="p-6 border border-primary/20 bg-card/50 backdrop-blur">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Execution Monitor</h2>
        <div className="ml-auto">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-semibold ${
            activeExecutions > 0
              ? 'bg-accent/20 text-accent border border-accent/40 animate-pulse-glow'
              : 'bg-muted text-muted-foreground border border-border'
          }`}>
            {activeExecutions > 0 ? (
              <>
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                {activeExecutions} Active
              </>
            ) : (
              <>
                <div className="w-2 h-2 bg-muted-foreground rounded-full" />
                Idle
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-lg border border-border bg-background/50">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">Success</span>
          </div>
          <div className="text-2xl font-mono font-bold text-primary">
            {successfulExecutions}
          </div>
        </div>

        <div className="p-4 rounded-lg border border-border bg-background/50">
          <div className="flex items-center gap-2 mb-2">
            <XCircle className="w-4 h-4 text-destructive" />
            <span className="text-xs text-muted-foreground">Failed</span>
          </div>
          <div className="text-2xl font-mono font-bold text-destructive">
            {failedExecutions}
          </div>
        </div>

        <div className="p-4 rounded-lg border border-border bg-background/50">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-accent" />
            <span className="text-xs text-muted-foreground">Avg Time</span>
          </div>
          <div className="text-2xl font-mono font-bold text-foreground">
            {Math.round(avgExecutionTime)}
            <span className="text-sm text-muted-foreground ml-1">ms</span>
          </div>
        </div>

        <div className="p-4 rounded-lg border border-border bg-background/50">
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-4 h-4 text-secondary" />
            <span className="text-xs text-muted-foreground">Success Rate</span>
          </div>
          <div className="text-2xl font-mono font-bold text-foreground">
            {successRate.toFixed(1)}
            <span className="text-sm text-muted-foreground ml-1">%</span>
          </div>
        </div>
      </div>

      {/* Live Execution Feed */}
      <div className="space-y-2">
        <div className="text-xs text-muted-foreground font-semibold mb-2">
          Recent Executions
        </div>
        <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
          {state.tasks.filter(t => t.status !== 'pending').reverse().slice(0, 10).map(task => (
            <div
              key={task.id}
              className={`p-3 rounded-lg border transition-smooth ${
                task.status === 'running'
                  ? 'border-accent/40 bg-accent/10 animate-pulse-subtle'
                  : task.status === 'completed'
                  ? 'border-primary/20 bg-primary/5'
                  : task.status === 'failed'
                  ? 'border-destructive/20 bg-destructive/5'
                  : 'border-border bg-muted/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {task.status === 'running' && (
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                  )}
                  {task.status === 'completed' && (
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                  )}
                  {task.status === 'failed' && (
                    <XCircle className="w-4 h-4 text-destructive" />
                  )}
                  {task.status === 'blocked' && (
                    <AlertCircle className="w-4 h-4 text-secondary" />
                  )}
                  <div>
                    <div className="text-sm font-mono font-semibold text-foreground">
                      {task.role}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {task.id}
                    </div>
                  </div>
                </div>
                <div className="text-xs font-mono text-muted-foreground">
                  {task.status === 'running' ? '⚡ Running...' : task.status}
                </div>
              </div>
            </div>
          ))}
          {state.tasks.filter(t => t.status !== 'pending').length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">
              No executions yet. Click Execute to start.
            </div>
          )}
        </div>
      </div>

      {/* Resource Usage Indicator */}
      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-muted-foreground">Resource Utilization</span>
          <span className="font-mono text-foreground">
            {activeExecutions} / 10 slots
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-smooth ${
              activeExecutions > 0
                ? 'bg-gradient-to-r from-accent to-primary'
                : 'bg-muted-foreground/20'
            }`}
            style={{ width: `${(activeExecutions / 10) * 100}%` }}
          />
        </div>
      </div>
    </Card>
  );
};
