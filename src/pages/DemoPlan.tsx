import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Play, Users, FileText, BarChart3, Shield, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { DemoPresentation } from "@/components/demo/DemoPresentation";

const DemoPlan = () => {
  const [showPresentation, setShowPresentation] = useState(false);

  return (
    <div className="min-h-screen p-8 gradient-mesh">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Demo Plan</h1>
          <p className="text-muted-foreground">
            Structured demonstration guide for Lumen Six-Nines Governance System
          </p>
        </div>
        <Button 
          size="lg" 
          onClick={() => setShowPresentation(true)}
          className="gap-2"
        >
          <Play className="h-5 w-5" />
          Start Demo
        </Button>
      </div>

      <DemoPresentation 
        open={showPresentation} 
        onOpenChange={setShowPresentation} 
      />

      <div className="space-y-6">
        {/* Demo Overview */}
        <Card className="glass-card border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              Demo Overview
            </CardTitle>
            <CardDescription>30-minute comprehensive walkthrough</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Duration</span>
                </div>
                <p className="text-sm text-muted-foreground">30 minutes total</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Audience</span>
                </div>
                <p className="text-sm text-muted-foreground">Technical leads, DevOps, QA teams</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="font-semibold">Focus</span>
                </div>
                <p className="text-sm text-muted-foreground">Governance automation & reliability</p>
              </div>
            </div>

            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Demo Goal:</strong> Showcase how Lumen achieves six-nines reliability through automated multi-agent orchestration and comprehensive quality gates.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Act 1: Introduction (5 min) */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline">Act 1</Badge>
                Introduction & Context
              </CardTitle>
              <Badge>5 min</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 mt-1">
                  <span className="text-sm font-semibold text-primary">1</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">The Challenge: Build Reliability</p>
                  <p className="text-sm text-muted-foreground">
                    Traditional CI/CD struggles with flaky tests, inconsistent builds, and poor audit trails. Most systems achieve three-nines (99.9%) at best.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 mt-1">
                  <span className="text-sm font-semibold text-primary">2</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">The Lumen Approach: Six-Nines Governance</p>
                  <p className="text-sm text-muted-foreground">
                    Lumen targets 99.9999% reliability (F_total ≤ 10⁻⁶) through autonomous multi-agent coordination, mutation testing, property-based validation, and mandatory evidence trails.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 mt-1">
                  <span className="text-sm font-semibold text-primary">3</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Key Principle: Precision Meets Compassion</p>
                  <p className="text-sm text-muted-foreground">
                    Automated enforcement with complete transparency. Every decision is documented, every gate is measurable, every failure triggers clear remediation paths.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm font-semibold mb-2">Demo Talking Points:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>"We're not just catching bugs — we're preventing them through mathematical rigor"</li>
                <li>"11 specialized agents work together like a professional orchestra"</li>
                <li>"Every build produces a complete audit bundle — nothing is hidden"</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Act 2: Live Orchestration (10 min) */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline">Act 2</Badge>
                Live Orchestration Demonstration
              </CardTitle>
              <Badge>10 min</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 mt-1">
                  <span className="text-sm font-semibold text-primary">1</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Navigate to Dashboard</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Show the Orchestration Control center with live DAG visualization.
                  </p>
                  <Link to="/">
                    <Button size="sm" variant="outline">
                      Go to Dashboard →
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 mt-1">
                  <span className="text-sm font-semibold text-primary">2</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Start Execution</p>
                  <p className="text-sm text-muted-foreground">
                    Click "Start Execution" and narrate the task flow: A0 orchestrates → A1 parses specs → A2 designs → A3 validates contracts → A4/A5 generate code → A6 runs tests → A7 bundles evidence.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 mt-1">
                  <span className="text-sm font-semibold text-primary">3</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Highlight Agent Status Grid</p>
                  <p className="text-sm text-muted-foreground">
                    Point out real-time agent states (idle/active/blocked), metrics (tasks completed, latency), and how blockers trigger human intervention.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 mt-1">
                  <span className="text-sm font-semibold text-primary">4</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Show Metrics Panel</p>
                  <p className="text-sm text-muted-foreground">
                    Emphasize F_total calculation, build determinism (100%), and quality gate status in real-time.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm font-semibold mb-2">Demo Talking Points:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>"Notice how dependencies resolve automatically — A2 can't start until A1 completes"</li>
                <li>"The DAG ensures tasks execute in correct order, no manual coordination"</li>
                <li>"If any agent blocks, it requests specific expertise from other agents or humans"</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Act 3: Governance Deep Dive (8 min) */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline">Act 3</Badge>
                Governance & Quality Gates
              </CardTitle>
              <Badge>8 min</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 mt-1">
                  <span className="text-sm font-semibold text-primary">1</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Navigate to Telemetry</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Show real-time governance metrics: determinism trends, flake rate history, F_total evolution.
                  </p>
                  <Link to="/telemetry">
                    <Button size="sm" variant="outline">
                      Go to Telemetry →
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 mt-1">
                  <span className="text-sm font-semibold text-primary">2</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Explain Six Quality Gates</p>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                    <li>Unit Tests: ≥ 95% coverage (Vitest)</li>
                    <li>Mutation Score: ≥ 0.80 (Stryker detects weak tests)</li>
                    <li>Property Tests: fast-check validates invariants</li>
                    <li>Flake Rate: {"<"} 0.1% (enforced hermetic builds)</li>
                    <li>Contract Validation: Schema changes require approval</li>
                    <li>F_total Gate: Aggregate failure ≤ 10⁻⁶</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 mt-1">
                  <span className="text-sm font-semibold text-primary">3</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Show Evidence Bundle</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Navigate to Evidence page, download HTML report, show SBOM and test artifacts.
                  </p>
                  <Link to="/evidence">
                    <Button size="sm" variant="outline">
                      Go to Evidence →
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm font-semibold mb-2">Demo Talking Points:</p>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>"Mutation testing ensures tests actually catch bugs, not just pass green"</li>
                <li>"Hermetic CI = frozen lockfiles + reproducible builds = zero flakiness"</li>
                <li>"Every PR gets a signed evidence bundle — full audit trail forever"</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Act 4: Agent Fleet & Contracts (5 min) */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline">Act 4</Badge>
                Agent Fleet & Contract Management
              </CardTitle>
              <Badge>5 min</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 mt-1">
                  <span className="text-sm font-semibold text-primary">1</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Navigate to Agents Page</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Show A0-A10 detailed status, task history, and collaboration patterns.
                  </p>
                  <Link to="/agents">
                    <Button size="sm" variant="outline">
                      Go to Agents →
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 mt-1">
                  <span className="text-sm font-semibold text-primary">2</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Explain Agent Specialization</p>
                  <p className="text-sm text-muted-foreground">
                    A3 (Contract Guardian) validates all schema changes. A4/A5 dual-path code generation prevents single-point-of-failure. A6 (QA) runs full test harness. A7 (Evidence) generates audit artifacts.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="rounded-full bg-primary/10 p-2 mt-1">
                  <span className="text-sm font-semibold text-primary">3</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Navigate to Contracts</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    Show JSON schemas and TypeScript types. Explain CODEOWNERS enforcement.
                  </p>
                  <Link to="/contracts">
                    <Button size="sm" variant="outline">
                      Go to Contracts →
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Act 5: Q&A and Next Steps (2 min) */}
        <Card className="glass-card border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline">Act 5</Badge>
                Q&A & Next Steps
              </CardTitle>
              <Badge>2 min</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-primary mt-1" />
                <div className="flex-1">
                  <p className="font-semibold">Phase I Status: Certified</p>
                  <p className="text-sm text-muted-foreground">
                    Governance infrastructure is production-ready. Evidence generation, quality gates, and CI/CD enforcement are operational.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-primary mt-1" />
                <div className="flex-1">
                  <p className="font-semibold">Phase II Roadmap: Autonomous Agents</p>
                  <p className="text-sm text-muted-foreground">
                    A1-A10 implementations pending LLM integration. See <code>docs/PHASE_II_TRANSITION.md</code> for detailed roadmap.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <BarChart3 className="h-5 w-5 text-primary mt-1" />
                <div className="flex-1">
                  <p className="font-semibold">Adoption Path</p>
                  <p className="text-sm text-muted-foreground">
                    Start with governance layer (six-nines metrics, evidence bundles). Gradually enable agent automation as confidence builds.
                  </p>
                </div>
              </div>
            </div>

            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                <strong>Key Takeaway:</strong> Lumen proves six-nines reliability is achievable through automated governance, transparent audit trails, and multi-agent collaboration — even before full autonomy.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Appendix: Resources */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Demo Resources</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-2">
                <p className="font-semibold text-sm">Documentation</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>README.md (project overview)</li>
                  <li>docs/OPERATIONAL_STATUS.md (current state)</li>
                  <li>docs/PHASE_II_TRANSITION.md (roadmap)</li>
                  <li>docs/blueprints/lumen_master_blueprint.md (full spec)</li>
                </ul>
              </div>

              <div className="space-y-2">
                <p className="font-semibold text-sm">Quick Commands</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li><code>pnpm dev</code> — Start dashboard</li>
                  <li><code>pnpm test</code> — Run full test suite</li>
                  <li><code>pnpm bundle</code> — Generate evidence</li>
                  <li><code>pnpm six-nines</code> — Check F_total</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DemoPlan;
