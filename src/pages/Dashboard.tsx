import { AgentStatusGrid } from "@/components/dashboard/AgentStatusGrid";
import { OrchestrationGraph } from "@/components/dashboard/OrchestrationGraph";
import { MetricsPanel } from "@/components/dashboard/MetricsPanel";

const Dashboard = () => {
  return (
    <div className="min-h-screen p-8 gradient-mesh">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Orchestration Control</h1>
        <p className="text-muted-foreground">
          Multi-agent coordination with six-nines reliability governance
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          <OrchestrationGraph />
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
