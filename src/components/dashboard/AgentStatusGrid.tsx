import { Card } from "@/components/ui/card";
import { Activity, CheckCircle2, AlertTriangle, Clock, XCircle } from "lucide-react";
import { useAgentStates } from "@/hooks/use-orchestrator";
import type { AgentStatus } from "../../../packages/agents/src/types";

const agentMetadata: Record<string, { name: string; description: string }> = {
  A0_orchestrator: { name: "Orchestrator", description: "DAG Coordinator" },
  A1_spec: { name: "Spec Agent", description: "Requirements Parser" },
  A2_architect: { name: "Architect", description: "System Design" },
  A3_codegen_a: { name: "Code Gen A", description: "Primary Builder" },
  A4_codegen_b: { name: "Code Gen B", description: "Dual Verify" },
  A5_adjudicator: { name: "Adjudicator", description: "Diff Analysis" },
  A6_qa_harness: { name: "QA Harness", description: "Test Suite" },
  A7_evidence: { name: "Evidence", description: "Reporter" },
  A8_performance: { name: "Performance", description: "Profiler" },
  A9_security: { name: "Security", description: "Scanner" },
  A10_incident: { name: "Incident", description: "Router" },
};

const stateConfig = {
  active: { icon: Activity, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
  idle: { icon: Clock, color: "text-muted-foreground", bg: "bg-muted/50", border: "border-muted" },
  blocked: { icon: AlertTriangle, color: "text-accent", bg: "bg-accent/10", border: "border-accent/20" },
  error: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" },
};

export const AgentStatusGrid = () => {
  const agentStates = useAgentStates();

  // Filter to show only relevant agents
  const displayedAgents = agentStates.filter(agent => 
    agentMetadata[agent.role]
  ).slice(0, 8); // Show first 8 for grid layout

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {displayedAgents.map((agent) => {
        const metadata = agentMetadata[agent.role];
        const config = stateConfig[agent.state];
        const Icon = config.icon;
        const agentId = agent.role.split('_')[0].toUpperCase();
        const successRate = ((1 - agent.metrics.errorRate) * 100).toFixed(4);
        
        return (
          <Card
            key={agent.role}
            className={`p-4 border ${config.border} ${config.bg} transition-smooth hover:scale-105`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs font-mono text-muted-foreground">{agentId}</div>
                <h3 className="text-sm font-semibold text-foreground mt-1">{metadata.name}</h3>
              </div>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">{metadata.description}</div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Tasks:</span>
                <span className="font-mono text-foreground">{agent.metrics.tasksCompleted}</span>
              </div>
              
              {agent.currentTask && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Current:</span>
                  <span className="font-mono text-primary truncate max-w-[100px]">{agent.currentTask}</span>
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Success:</span>
                <span className="font-mono text-primary">{successRate}%</span>
              </div>

              {agent.metrics.averageLatency > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Avg latency:</span>
                  <span className="font-mono text-muted-foreground">{agent.metrics.averageLatency.toFixed(0)}ms</span>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};
