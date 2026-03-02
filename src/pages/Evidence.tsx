import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { FileText, Download, CheckCircle2, AlertTriangle, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { evidenceService } from "@/lib/evidence-service";
import type { EvidenceBundle } from "../../packages/contracts/src/index";

const Evidence = () => {
  const [bundles, setBundles] = useState<EvidenceBundle[]>([]);
  const [selectedBundle, setSelectedBundle] = useState<string | null>(null);
  const [previewHTML, setPreviewHTML] = useState<string>("");

  useEffect(() => {
    // Load bundles
    setBundles(evidenceService.getBundles());

    // Poll for updates (in case new bundles are generated)
    const interval = setInterval(() => {
      setBundles(evidenceService.getBundles());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleDownload = (bundleId: string) => {
    evidenceService.downloadBundle(bundleId);
  };

  const handlePreview = (bundleId: string) => {
    const html = evidenceService.getBundleHTML(bundleId);
    if (html) {
      setPreviewHTML(html);
      setSelectedBundle(bundleId);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Evidence Bundles</h1>
        <p className="text-muted-foreground">
          Audit trails and test artifacts for reproducibility verification
        </p>
      </div>

      <div className="space-y-4">
        {bundles.length === 0 ? (
          <Card className="p-8 border border-border text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No evidence bundles generated yet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Execute a workflow from the Master Prompt to generate evidence.
            </p>
          </Card>
        ) : (
          bundles.map((bundle) => (
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
                  {bundle.status === 'passed' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span className="text-xs font-mono text-primary">PASSED</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-destructive" />
                      <span className="text-xs font-mono text-destructive">FAILED</span>
                    </>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="text-xs text-muted-foreground mb-2">Quality Gates</div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {bundle.gates.map((gate) => (
                    <div
                      key={gate.name}
                      className={`text-xs p-2 rounded border ${
                        gate.passed
                          ? 'border-primary/20 bg-primary/5 text-primary'
                          : 'border-destructive/20 bg-destructive/5 text-destructive'
                      }`}
                    >
                      <div className="font-mono font-semibold">{gate.name}</div>
                      <div className="opacity-70">
                        {gate.actual.toFixed(3)} {gate.passed ? '✓' : '✗'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <div className="text-xs text-muted-foreground mb-2">F_total</div>
                <div className={`text-lg font-mono font-bold ${
                  bundle.fTotal <= 1e-6 ? 'text-primary' : 'text-destructive'
                }`}>
                  {bundle.fTotal.toExponential(2)}
                  <span className="text-xs ml-2">
                    {bundle.fTotal <= 1e-6 ? '(Six-nines compliance ✓)' : '(Failed ✗)'}
                  </span>
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
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handlePreview(bundle.id)}
                  >
                    <Eye className="w-3 h-3" />
                    Preview
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleDownload(bundle.id)}
                  >
                    <Download className="w-3 h-3" />
                    Download
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!selectedBundle} onOpenChange={() => setSelectedBundle(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="font-mono">{selectedBundle}</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[60vh] border border-border rounded-lg">
            <iframe
              srcDoc={previewHTML}
              className="w-full h-[500px] border-0"
              title="Evidence Bundle Preview"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Evidence;

