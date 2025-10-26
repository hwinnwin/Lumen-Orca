import { Card } from "@/components/ui/card";
import { Network, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTasks, useOrchestrator } from "@/hooks/use-orchestrator";
import type { AgentTask } from "../../../packages/agents/src/types";

// Task node positions (x, y) for visualization
const taskPositions: Record<string, { x: number; y: number }> = {
  'task-spec': { x: 100, y: 50 },
  'task-arch': { x: 250, y: 120 },
  'task-codegen-a': { x: 400, y: 80 },
  'task-codegen-b': { x: 400, y: 160 },
  'task-adjudicate': { x: 550, y: 120 },
  'task-qa': { x: 650, y: 120 },
  'task-evidence': { x: 750, y: 120 },
};

const statusColors = {
  pending: 'hsl(var(--muted))',
  running: 'hsl(var(--accent))',
  completed: 'hsl(var(--primary))',
  failed: 'hsl(var(--destructive))',
  blocked: 'hsl(var(--secondary))',
};

export const OrchestrationGraph = () => {
  const tasks = useTasks();
  const { state, isExecuting, start, reset } = useOrchestrator();

  const renderTaskNode = (task: AgentTask) => {
    const pos = taskPositions[task.id] || { x: 100, y: 100 };
    const color = statusColors[task.status];
    const agentId = task.role.split('_')[0].toUpperCase();
    const isAnimating = task.status === 'running';

    return (
      <g key={task.id}>
        <circle
          cx={pos.x}
          cy={pos.y}
          r="22"
          fill={color}
          opacity="0.2"
        />
        <circle
          cx={pos.x}
          cy={pos.y}
          r="16"
          fill={color}
          className={isAnimating ? 'animate-pulse-glow' : ''}
        />
        <text
          x={pos.x}
          y={pos.y + 4}
          textAnchor="middle"
          fill="hsl(var(--background))"
          fontSize="11"
          fontFamily="monospace"
          fontWeight="bold"
        >
          {agentId}
        </text>
      </g>
    );
  };

  const renderDependencyLine = (fromId: string, toId: string, opacity: number = 0.4) => {
    const from = taskPositions[fromId];
    const to = taskPositions[toId];
    
    if (!from || !to) return null;

    return (
      <line
        key={`${fromId}-${toId}`}
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke="hsl(var(--primary))"
        strokeWidth="2"
        opacity={opacity}
      />
    );
  };

  const renderAllConnections = () => {
    const connections: JSX.Element[] = [];
    
    tasks.forEach(task => {
      task.dependencies.forEach(depId => {
        const opacity = task.status === 'completed' ? 0.8 : 
                       task.status === 'running' ? 0.6 : 0.3;
        connections.push(renderDependencyLine(depId, task.id, opacity));
      });
    });

    return connections;
  };

  return (
    <Card className="p-6 border border-primary/20 bg-card/50 backdrop-blur">
      <div className="flex items-center gap-3 mb-6">
        <Network className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Live Task Graph</h2>
        <div className="ml-auto flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={reset}
            disabled={isExecuting}
            className="gap-2"
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={start}
            disabled={isExecuting || state.stats.pending === 0}
            className="gap-2"
          >
            <Play className="w-3 h-3" />
            {isExecuting ? 'Running...' : 'Execute'}
          </Button>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isExecuting ? 'bg-primary animate-pulse-glow' : 'bg-muted'}`} />
            <span className="text-xs font-mono text-muted-foreground">
              {isExecuting ? 'EXECUTING' : 'IDLE'}
            </span>
          </div>
        </div>
      </div>

      <div className="relative h-96 bg-background/50 rounded-lg border border-border p-8">
        <svg className="w-full h-full" viewBox="0 0 850 250">
          {/* Render dependency lines */}
          {renderAllConnections()}

          {/* Render task nodes */}
          {tasks.map(renderTaskNode)}
        </svg>

        <div className="absolute bottom-4 left-4 text-xs text-muted-foreground font-mono space-y-1">
          <div>Tasks: {state.stats.total} total</div>
          <div className="flex gap-4">
            <span className="text-accent">⚡ Running: {state.stats.running}</span>
            <span className="text-primary">✓ Complete: {state.stats.completed}</span>
            <span className="text-muted-foreground">⋯ Pending: {state.stats.pending}</span>
            {state.stats.failed > 0 && <span className="text-destructive">✗ Failed: {state.stats.failed}</span>}
          </div>
        </div>
      </div>
    </Card>
  );
};
