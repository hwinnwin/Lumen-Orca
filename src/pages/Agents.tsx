import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Box, Code2, GitCompare, TestTube, FileCheck, AlertCircle, Radio, Bot, Trash2, Loader2 } from "lucide-react";
import { AddAgentDialog } from "@/components/agents/AddAgentDialog";
import { agentRegistry } from "@/lib/agent-registry";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as LucideIcons from "lucide-react";

interface AgentMetrics {
  tasksCompleted: number;
  successRate: number;
  avgLatency: number;
  errorRate: number;
}

interface AgentDetail {
  id: string;
  name: string;
  role: string;
  description: string;
  icon: any;
  agentRole: string; // matches agent_role in DB
}

const agentDetails: AgentDetail[] = [
  {
    id: "A0", name: "Orchestrator", role: "DAG Coordinator",
    description: "Manages task graph execution, dependencies, and agent coordination",
    icon: Radio, agentRole: "orchestrator",
  },
  {
    id: "A1", name: "Spec Agent", role: "Requirements Analyzer",
    description: "Parses and validates requirements, creates formal specifications",
    icon: FileCheck, agentRole: "spec_writer",
  },
  {
    id: "A2", name: "Architect", role: "System Designer",
    description: "Generates architecture diagrams and component schemas",
    icon: Box, agentRole: "architect",
  },
  {
    id: "A3", name: "Code Gen A", role: "Primary Builder",
    description: "First implementation path with full test coverage",
    icon: Code2, agentRole: "code_gen_a",
  },
  {
    id: "A4", name: "Code Gen B", role: "Dual Verification",
    description: "Independent implementation for differential validation",
    icon: Code2, agentRole: "code_gen_b",
  },
  {
    id: "A5", name: "Adjudicator", role: "Diff Analyzer",
    description: "Compares dual implementations, resolves conflicts",
    icon: GitCompare, agentRole: "adjudicator",
  },
  {
    id: "A6", name: "QA Harness", role: "Test Suite Manager",
    description: "Executes mutation, property, and fuzz tests",
    icon: TestTube, agentRole: "qa_tester",
  },
  {
    id: "A7", name: "Evidence Reporter", role: "Bundle Generator",
    description: "Compiles HTML/JSON evidence artifacts for auditing",
    icon: Activity, agentRole: "evidence_compiler",
  },
];

function formatLatency(ms: number): string {
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

const Agents = () => {
  const [customAgents, setCustomAgents] = useState(agentRegistry.getAllAgents());
  const [metrics, setMetrics] = useState<Record<string, AgentMetrics>>({});
  const [loading, setLoading] = useState(true);
  const limits = agentRegistry.getSystemLimits();

  const fetchMetrics = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('agent_execution_history')
        .select('agent_role, success, execution_time_ms')
        .order('created_at', { ascending: false })
        .limit(5000);

      if (error) throw error;

      if (data && data.length > 0) {
        const grouped: Record<string, { total: number; success: number; totalLatency: number }> = {};

        for (const row of data) {
          const role = row.agent_role;
          if (!grouped[role]) {
            grouped[role] = { total: 0, success: 0, totalLatency: 0 };
          }
          grouped[role].total++;
          if (row.success) grouped[role].success++;
          grouped[role].totalLatency += row.execution_time_ms || 0;
        }

        const result: Record<string, AgentMetrics> = {};
        for (const [role, stats] of Object.entries(grouped)) {
          result[role] = {
            tasksCompleted: stats.total,
            successRate: stats.total > 0 ? stats.success / stats.total : 0,
            avgLatency: stats.total > 0 ? stats.totalLatency / stats.total : 0,
            errorRate: stats.total > 0 ? (stats.total - stats.success) / stats.total : 0,
          };
        }
        setMetrics(result);
      }
    } catch (err) {
      console.warn('Failed to fetch agent metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const loadCustomAgents = () => {
    setCustomAgents(agentRegistry.getAllAgents());
  };

  const handleDeleteAgent = (agentId: string) => {
    try {
      agentRegistry.deleteAgent(agentId);
      loadCustomAgents();
      toast.success("Agent deleted successfully");
    } catch (error) {
      toast.error("Failed to delete agent");
    }
  };

  const getIconComponent = (iconName: string) => {
    const Icon = (LucideIcons as any)[iconName] || Bot;
    return Icon;
  };

  const getAgentMetrics = (agentRole: string): AgentMetrics => {
    return metrics[agentRole] || { tasksCompleted: 0, successRate: 0, avgLatency: 0, errorRate: 0 };
  };

  const getAgentStatus = (m: AgentMetrics): "active" | "idle" | "warning" => {
    if (m.tasksCompleted === 0) return "idle";
    if (m.errorRate > 0.05) return "warning";
    return "active";
  };

  const totalAgents = agentDetails.length + customAgents.length;

  return (
    <div className="min-h-screen p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Agent Fleet</h1>
          <p className="text-muted-foreground mb-2">
            {totalAgents} agents available ({customAgents.length} custom)
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            System limit: {limits.currentAgents}/{limits.maxAgents} total agents |
            Max {limits.maxConcurrentPerAgent} concurrent tasks per agent
          </p>
        </div>
        <AddAgentDialog onAgentAdded={loadCustomAgents} />
      </div>

      {loading && (
        <div className="flex items-center gap-2 mb-6 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading agent metrics...</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Built-in Agents */}
        {agentDetails.map((agent) => {
          const Icon = agent.icon;
          const m = getAgentMetrics(agent.agentRole);
          const status = getAgentStatus(m);

          return (
            <Card
              key={agent.id}
              className="p-6 border border-border hover:border-primary/40 transition-smooth"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{agent.id}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-primary/10 text-primary">
                      BUILT-IN
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                      status === "active" ? "bg-primary/10 text-primary" :
                      status === "warning" ? "bg-accent/10 text-accent" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {status.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{agent.name}</h3>
                  <p className="text-sm text-secondary font-medium">{agent.role}</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">{agent.description}</p>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Success Rate</div>
                  <div className="text-sm font-mono text-foreground">
                    {m.tasksCompleted > 0 ? `${(m.successRate * 100).toFixed(1)}%` : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Tasks</div>
                  <div className="text-sm font-mono text-foreground">
                    {m.tasksCompleted > 0 ? m.tasksCompleted.toLocaleString() : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Avg Latency</div>
                  <div className="text-sm font-mono text-foreground">
                    {m.tasksCompleted > 0 ? formatLatency(m.avgLatency) : "—"}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Error Rate</div>
                  <div className="text-sm font-mono text-primary">
                    {m.tasksCompleted > 0 ? `${(m.errorRate * 100).toFixed(2)}%` : "—"}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}

        {/* Custom Agents */}
        {customAgents.map((agent) => {
          const Icon = getIconComponent(agent.icon || "Bot");

          return (
            <Card
              key={agent.id}
              className="p-6 border border-accent/40 hover:border-accent/60 transition-smooth bg-accent/5"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <Icon className="w-6 h-6 text-accent" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-mono text-muted-foreground">{agent.id}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-accent/10 text-accent">
                      CUSTOM
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{agent.name}</h3>
                  <p className="text-sm text-secondary font-medium">{agent.role}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteAgent(agent.id)}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-sm text-muted-foreground mb-4">{agent.description}</p>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Max Concurrent</div>
                  <div className="text-sm font-mono text-foreground">{agent.maxConcurrentTasks || 3}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Status</div>
                  <div className="text-sm font-mono text-muted-foreground">Ready</div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Agents;
