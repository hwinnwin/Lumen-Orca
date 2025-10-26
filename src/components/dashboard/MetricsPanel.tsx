import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface Metric {
  label: string;
  value: string;
  change: number;
  trend: "up" | "down" | "stable";
  critical?: boolean;
}

const metrics: Metric[] = [
  { label: "F_total", value: "1.2 × 10⁻⁶", change: -0.3, trend: "down", critical: true },
  { label: "Build Success", value: "99.9994%", change: 0.0001, trend: "up" },
  { label: "Flake Rate", value: "0.06%", change: -0.02, trend: "down" },
  { label: "Mutation Score", value: "84.2%", change: 1.5, trend: "up" },
  { label: "Coverage", value: "96.8%", change: 0.0, trend: "stable" },
  { label: "Mean Latency", value: "124ms", change: -8, trend: "down" },
];

export const MetricsPanel = () => {
  return (
    <Card className="p-6 border border-border">
      <h2 className="text-lg font-semibold text-foreground mb-4">System Metrics</h2>
      
      <div className="space-y-4">
        {metrics.map((metric) => {
          const TrendIcon = 
            metric.trend === "up" ? TrendingUp :
            metric.trend === "down" ? TrendingDown : Minus;
          
          const trendColor = 
            metric.trend === "up" ? "text-primary" :
            metric.trend === "down" ? "text-accent" : "text-muted-foreground";

          return (
            <div 
              key={metric.label}
              className={`p-3 rounded-lg border transition-smooth ${
                metric.critical 
                  ? "border-primary/40 bg-primary/5 glow-primary" 
                  : "border-border bg-muted/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">{metric.label}</div>
                  <div className={`text-lg font-mono font-semibold ${
                    metric.critical ? "text-primary" : "text-foreground"
                  }`}>
                    {metric.value}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <TrendIcon className={`w-4 h-4 ${trendColor}`} />
                  <span className={`text-xs font-mono ${trendColor}`}>
                    {metric.change > 0 ? "+" : ""}{metric.change}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground mb-2">Six-Nines Target</div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-secondary transition-smooth"
            style={{ width: "99.9999%" }}
          />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs font-mono text-muted-foreground">0%</span>
          <span className="text-xs font-mono text-primary font-semibold">99.9999%</span>
        </div>
      </div>
    </Card>
  );
};
