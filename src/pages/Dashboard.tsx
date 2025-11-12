import { AgentStatusGrid } from "@/components/dashboard/AgentStatusGrid";
import { OrchestrationGraph } from "@/components/dashboard/OrchestrationGraph";
import { MetricsPanel } from "@/components/dashboard/MetricsPanel";
import { ExecutionMonitor } from "@/components/dashboard/ExecutionMonitor";
import { Button } from "@/components/ui/button";
import { Play, RotateCcw, FlaskConical } from "lucide-react";
import { useOrchestrator } from "@/hooks/use-orchestrator";
import { toast } from "sonner";

const Dashboard = () => {
  const { state, isExecuting, start, reset } = useOrchestrator();

  const handleExecute = async () => {
    try {
      toast.info("Starting orchestrator execution...");
      await start();
      toast.success("Orchestrator execution completed!");
    } catch (error: any) {
      console.error("Execution error:", error);
      toast.error(`Execution failed: ${error.message}`);
    }
  };

  const handleReset = () => {
    reset();
    toast.info("Orchestrator reset. Ready for new execution.");
  };

  return (
    <div className="min-h-screen p-8 gradient-mesh">
      {/* Header with Test Controls */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary mb-2">Orchestration Control</h1>
            <p className="text-muted-foreground">
              Multi-agent coordination with six-nines reliability governance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={handleReset}
              disabled={isExecuting}
              className="gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Workflow
            </Button>
            <Button
              variant="default"
              size="lg"
              onClick={handleExecute}
              disabled={isExecuting || state.stats.pending === 0}
              className="gap-2 glow-primary"
            >
              <FlaskConical className="w-4 h-4" />
              {isExecuting ? 'Testing Execution...' : 'Test Execution Engine'}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          <OrchestrationGraph />
          <ExecutionMonitor />
          <AgentStatusGrid />
        </div>
        
        <div className="lg:col-span-1">
          <MetricsPanel />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
