import { Card } from "@/components/ui/card";
import { Network } from "lucide-react";

export const OrchestrationGraph = () => {
  return (
    <Card className="p-6 border border-primary/20 bg-card/50 backdrop-blur">
      <div className="flex items-center gap-3 mb-6">
        <Network className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Live Task Graph</h2>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse-glow" />
          <span className="text-xs font-mono text-primary">EXECUTING</span>
        </div>
      </div>

      {/* Simplified DAG visualization */}
      <div className="relative h-96 bg-background/50 rounded-lg border border-border p-8">
        <svg className="w-full h-full" viewBox="0 0 800 400">
          {/* Connection lines */}
          <line x1="100" y1="50" x2="200" y2="120" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.4" />
          <line x1="100" y1="50" x2="200" y2="200" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.4" />
          <line x1="200" y1="120" x2="400" y2="120" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.6" />
          <line x1="200" y1="200" x2="400" y2="200" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.6" />
          <line x1="400" y1="120" x2="600" y2="160" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.8" />
          <line x1="400" y1="200" x2="600" y2="160" stroke="hsl(var(--primary))" strokeWidth="2" opacity="0.8" />
          <line x1="600" y1="160" x2="700" y2="160" stroke="hsl(var(--primary))" strokeWidth="2" opacity="1" />

          {/* Nodes */}
          <g>
            <circle cx="100" cy="50" r="20" fill="hsl(var(--primary))" opacity="0.2" />
            <circle cx="100" cy="50" r="15" fill="hsl(var(--primary))" className="animate-pulse-glow" />
            <text x="100" y="55" textAnchor="middle" fill="hsl(var(--primary-foreground))" fontSize="10" fontFamily="monospace">A0</text>
          </g>

          <g>
            <circle cx="200" cy="120" r="18" fill="hsl(var(--secondary))" opacity="0.2" />
            <circle cx="200" cy="120" r="13" fill="hsl(var(--secondary))" />
            <text x="200" y="125" textAnchor="middle" fill="hsl(var(--background))" fontSize="10" fontFamily="monospace">A1</text>
          </g>

          <g>
            <circle cx="200" cy="200" r="18" fill="hsl(var(--secondary))" opacity="0.2" />
            <circle cx="200" cy="200" r="13" fill="hsl(var(--secondary))" />
            <text x="200" y="205" textAnchor="middle" fill="hsl(var(--background))" fontSize="10" fontFamily="monospace">A2</text>
          </g>

          <g>
            <circle cx="400" cy="120" r="18" fill="hsl(var(--accent))" opacity="0.2" />
            <circle cx="400" cy="120" r="13" fill="hsl(var(--accent))" className="animate-pulse-glow" />
            <text x="400" y="125" textAnchor="middle" fill="hsl(var(--background))" fontSize="10" fontFamily="monospace">A3</text>
          </g>

          <g>
            <circle cx="400" cy="200" r="18" fill="hsl(var(--accent))" opacity="0.2" />
            <circle cx="400" cy="200" r="13" fill="hsl(var(--accent))" className="animate-pulse-glow" />
            <text x="400" y="205" textAnchor="middle" fill="hsl(var(--background))" fontSize="10" fontFamily="monospace">A4</text>
          </g>

          <g>
            <circle cx="600" cy="160" r="18" fill="hsl(var(--primary))" opacity="0.2" />
            <circle cx="600" cy="160" r="13" fill="hsl(var(--primary))" />
            <text x="600" y="165" textAnchor="middle" fill="hsl(var(--background))" fontSize="10" fontFamily="monospace">A5</text>
          </g>

          <g>
            <circle cx="700" cy="160" r="20" fill="hsl(var(--primary))" opacity="0.2" />
            <circle cx="700" cy="160" r="15" fill="hsl(var(--primary))" />
            <text x="700" y="165" textAnchor="middle" fill="hsl(var(--primary-foreground))" fontSize="10" fontFamily="monospace">A7</text>
          </g>
        </svg>

        <div className="absolute bottom-4 left-4 text-xs text-muted-foreground font-mono">
          Current Epoch: 1,247 | Tasks: 8 active, 142 complete
        </div>
      </div>
    </Card>
  );
};
