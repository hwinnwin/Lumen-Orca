import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { GradeBadge } from "./GradeBadge";
import { ProviderBadge } from "./ProviderBadge";
import { applyGrades } from "@/lib/grading";
import { AlertCircle } from "lucide-react";

const MetricRow = ({ label, value }: { label: string; value: string | React.ReactNode }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-muted-foreground">{label}</span>
    <div className="text-sm font-medium">{value}</div>
  </div>
);

export const MetricsPanelGraded = () => {
  const mockRawMetrics = {
    coverage: 96.5,
    mutation: 0.89,
    determinism: 99.994,
    flake: 0.08,
    reliability: 8.1e-7,
  };

  const mockBudget = {
    provider: 'lovable-ai' as const,
    model: 'gemini-2.5-flash',
    currentSpend: 12.45,
    monthlyBudget: 100.00,
    latency: 234,
  };

  const grades = applyGrades(mockRawMetrics);
  const budgetPercent = (mockBudget.currentSpend / mockBudget.monthlyBudget) * 100;
  const isNearLimit = budgetPercent >= 80;

  return (
    <Card className="glass-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Quality Metrics</CardTitle>
          <GradeBadge grade={grades.overall} metric="Overall System Grade" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <MetricRow 
            label="Coverage" 
            value={<GradeBadge grade={grades.coverage} showDescription={false} />} 
          />
          <MetricRow 
            label="Mutation" 
            value={<GradeBadge grade={grades.mutation} showDescription={false} />} 
          />
          <MetricRow 
            label="Determinism" 
            value={<GradeBadge grade={grades.determinism} showDescription={false} />} 
          />
          <MetricRow 
            label="Flake" 
            value={<GradeBadge grade={grades.flake} showDescription={false} />} 
          />
          <MetricRow 
            label="Reliability" 
            value={<GradeBadge grade={grades.reliability} showDescription={false} />} 
          />
        </div>

        <div className="pt-4 mt-4 space-y-3 border-t border-border/50">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">LLM Provider</span>
            <ProviderBadge 
              provider={mockBudget.provider} 
              model={mockBudget.model}
              latency={mockBudget.latency}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Budget Usage</span>
              <div className="flex items-center gap-2">
                {isNearLimit && <AlertCircle className="h-4 w-4 text-warning" />}
                <span className="font-mono">${mockBudget.currentSpend.toFixed(2)} / ${mockBudget.monthlyBudget.toFixed(2)}</span>
              </div>
            </div>
            <Progress value={budgetPercent} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
