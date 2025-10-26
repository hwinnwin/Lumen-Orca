import { Card } from "@/components/ui/card";
import { Activity, Box, Code2, GitCompare, TestTube, FileCheck, AlertCircle, Radio } from "lucide-react";

interface AgentDetail {
  id: string;
  name: string;
  role: string;
  description: string;
  icon: any;
  status: "active" | "idle" | "warning";
  metrics: {
    uptime: string;
    tasksCompleted: number;
    avgLatency: string;
    errorRate: string;
  };
}

const agentDetails: AgentDetail[] = [
  {
    id: "A0",
    name: "Orchestrator",
    role: "DAG Coordinator",
    description: "Manages task graph execution, dependencies, and agent coordination",
    icon: Radio,
    status: "active",
    metrics: { uptime: "99.99%", tasksCompleted: 12847, avgLatency: "12ms", errorRate: "0.001%" }
  },
  {
    id: "A1",
    name: "Spec Agent",
    role: "Requirements Analyzer",
    description: "Parses and validates requirements, creates formal specifications",
    icon: FileCheck,
    status: "idle",
    metrics: { uptime: "99.95%", tasksCompleted: 3421, avgLatency: "145ms", errorRate: "0.01%" }
  },
  {
    id: "A2",
    name: "Architect",
    role: "System Designer",
    description: "Generates architecture diagrams and component schemas",
    icon: Box,
    status: "active",
    metrics: { uptime: "99.97%", tasksCompleted: 5632, avgLatency: "234ms", errorRate: "0.005%" }
  },
  {
    id: "A3",
    name: "Code Gen A",
    role: "Primary Builder",
    description: "First implementation path with full test coverage",
    icon: Code2,
    status: "active",
    metrics: { uptime: "99.96%", tasksCompleted: 8945, avgLatency: "567ms", errorRate: "0.008%" }
  },
  {
    id: "A4",
    name: "Code Gen B",
    role: "Dual Verification",
    description: "Independent implementation for differential validation",
    icon: Code2,
    status: "active",
    metrics: { uptime: "99.94%", tasksCompleted: 8902, avgLatency: "589ms", errorRate: "0.012%" }
  },
  {
    id: "A5",
    name: "Adjudicator",
    role: "Diff Analyzer",
    description: "Compares dual implementations, resolves conflicts",
    icon: GitCompare,
    status: "warning",
    metrics: { uptime: "99.93%", tasksCompleted: 7821, avgLatency: "198ms", errorRate: "0.06%" }
  },
  {
    id: "A6",
    name: "QA Harness",
    role: "Test Suite Manager",
    description: "Executes mutation, property, and fuzz tests",
    icon: TestTube,
    status: "active",
    metrics: { uptime: "99.98%", tasksCompleted: 15234, avgLatency: "1.2s", errorRate: "0.002%" }
  },
  {
    id: "A7",
    name: "Evidence Reporter",
    role: "Bundle Generator",
    description: "Compiles HTML/JSON evidence artifacts for auditing",
    icon: Activity,
    status: "idle",
    metrics: { uptime: "99.99%", tasksCompleted: 4532, avgLatency: "345ms", errorRate: "0.001%" }
  },
];

const Agents = () => {
  return (
    <div className="min-h-screen p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Agent Fleet</h1>
        <p className="text-muted-foreground">
          A0-A10 autonomous agents orchestrating the build pipeline
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {agentDetails.map((agent) => {
          const Icon = agent.icon;
          
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
                    <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                      agent.status === "active" ? "bg-primary/10 text-primary" :
                      agent.status === "warning" ? "bg-accent/10 text-accent" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {agent.status.toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{agent.name}</h3>
                  <p className="text-sm text-secondary font-medium">{agent.role}</p>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mb-4">{agent.description}</p>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Uptime</div>
                  <div className="text-sm font-mono text-foreground">{agent.metrics.uptime}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Tasks</div>
                  <div className="text-sm font-mono text-foreground">{agent.metrics.tasksCompleted.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Avg Latency</div>
                  <div className="text-sm font-mono text-foreground">{agent.metrics.avgLatency}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Error Rate</div>
                  <div className="text-sm font-mono text-primary">{agent.metrics.errorRate}</div>
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
