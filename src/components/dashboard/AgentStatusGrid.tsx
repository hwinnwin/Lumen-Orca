import { Card } from "@/components/ui/card";
import { Activity, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  role: string;
  status: "active" | "idle" | "warning" | "error";
  lastRun: string;
  successRate: number;
}

const agents: Agent[] = [
  { id: "A0", name: "Orchestrator", role: "DAG Coordinator", status: "active", lastRun: "2s ago", successRate: 99.9999 },
  { id: "A1", name: "Spec Agent", role: "Requirements", status: "idle", lastRun: "1m ago", successRate: 99.99 },
  { id: "A2", name: "Architect", role: "System Design", status: "active", lastRun: "5s ago", successRate: 99.98 },
  { id: "A3", name: "Code Gen A", role: "Primary Builder", status: "active", lastRun: "1s ago", successRate: 99.95 },
  { id: "A4", name: "Code Gen B", role: "Dual Verify", status: "active", lastRun: "1s ago", successRate: 99.96 },
  { id: "A5", name: "Adjudicator", role: "Diff Analysis", status: "warning", lastRun: "3s ago", successRate: 99.94 },
  { id: "A6", name: "QA Harness", role: "Test Suite", status: "active", lastRun: "2s ago", successRate: 99.97 },
  { id: "A7", name: "Evidence", role: "Reporter", status: "idle", lastRun: "10s ago", successRate: 99.99 },
];

const statusConfig = {
  active: { icon: Activity, color: "text-primary", bg: "bg-primary/10", border: "border-primary/20" },
  idle: { icon: Clock, color: "text-muted-foreground", bg: "bg-muted/50", border: "border-muted" },
  warning: { icon: AlertTriangle, color: "text-accent", bg: "bg-accent/10", border: "border-accent/20" },
  error: { icon: CheckCircle2, color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20" },
};

export const AgentStatusGrid = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {agents.map((agent) => {
        const config = statusConfig[agent.status];
        const Icon = config.icon;
        
        return (
          <Card
            key={agent.id}
            className={`p-4 border ${config.border} ${config.bg} transition-smooth hover:scale-105`}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs font-mono text-muted-foreground">{agent.id}</div>
                <h3 className="text-sm font-semibold text-foreground mt-1">{agent.name}</h3>
              </div>
              <Icon className={`w-5 h-5 ${config.color}`} />
            </div>
            
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">{agent.role}</div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Last run:</span>
                <span className="font-mono text-foreground">{agent.lastRun}</span>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Success:</span>
                <span className="font-mono text-primary">{agent.successRate}%</span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
