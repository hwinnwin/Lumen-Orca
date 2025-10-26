import { Card } from "@/components/ui/card";
import { FileText, Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EvidenceBundle {
  id: string;
  timestamp: string;
  epoch: number;
  status: "passed" | "failed";
  artifacts: string[];
}

const bundles: EvidenceBundle[] = [
  {
    id: "bundle-1247",
    timestamp: "2025-10-26T14:23:45Z",
    epoch: 1247,
    status: "passed",
    artifacts: ["unit-tests.json", "mutation-report.html", "perf-metrics.json", "sbom.json"]
  },
  {
    id: "bundle-1246",
    timestamp: "2025-10-26T14:18:12Z",
    epoch: 1246,
    status: "passed",
    artifacts: ["unit-tests.json", "mutation-report.html", "perf-metrics.json", "sbom.json"]
  },
];

const Evidence = () => {
  return (
    <div className="min-h-screen p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Evidence Bundles</h1>
        <p className="text-muted-foreground">
          Audit trails and test artifacts for reproducibility verification
        </p>
      </div>

      <div className="space-y-4">
        {bundles.map((bundle) => (
          <Card key={bundle.id} className="p-6 border border-border">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-mono text-sm text-foreground">{bundle.id}</h3>
                  <p className="text-xs text-muted-foreground">Epoch {bundle.epoch}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span className="text-xs font-mono text-primary">{bundle.status.toUpperCase()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {bundle.artifacts.map((artifact) => (
                <div 
                  key={artifact}
                  className="text-xs font-mono text-muted-foreground p-2 bg-muted/20 rounded border border-border"
                >
                  {artifact}
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <span className="text-xs font-mono text-muted-foreground">{bundle.timestamp}</span>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="w-3 h-3" />
                Download Bundle
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Evidence;
