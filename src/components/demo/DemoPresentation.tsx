import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, X, Play, Pause } from "lucide-react";
import { Link } from "react-router-dom";

interface DemoPresentationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const slides = [
  {
    title: "Welcome to Lumen Orca",
    subtitle: "Six-Nines Governance System",
    content: (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <h2 className="text-4xl font-bold text-primary">Lumen Orca Six-Nines</h2>
          <p className="text-xl text-muted-foreground">
            99.9999% Reliability Through Automated Multi-Agent Orchestration
          </p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3 mt-8">
          <Card className="glass-card">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">11</div>
              <p className="text-sm text-muted-foreground">Specialized Agents</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">6</div>
              <p className="text-sm text-muted-foreground">Quality Gates</p>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="pt-6 text-center">
              <div className="text-3xl font-bold text-primary mb-2">99.9999%</div>
              <p className="text-sm text-muted-foreground">Target Reliability</p>
            </CardContent>
          </Card>
        </div>

        <div className="bg-primary/10 p-4 rounded-lg mt-6">
          <p className="text-center font-semibold">
            "We're not just catching bugs — we're preventing them through mathematical rigor"
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "The Challenge",
    subtitle: "Build Reliability",
    content: (
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-2xl font-bold">Traditional CI/CD Struggles</h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <Badge variant="destructive" className="mt-1">Problem</Badge>
              <div>
                <p className="font-semibold">Flaky Tests</p>
                <p className="text-sm text-muted-foreground">
                  Inconsistent test results undermine confidence in builds
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Badge variant="destructive" className="mt-1">Problem</Badge>
              <div>
                <p className="font-semibold">Inconsistent Builds</p>
                <p className="text-sm text-muted-foreground">
                  Non-deterministic environments lead to "works on my machine" issues
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <Badge variant="destructive" className="mt-1">Problem</Badge>
              <div>
                <p className="font-semibold">Poor Audit Trails</p>
                <p className="text-sm text-muted-foreground">
                  Limited visibility into what changed and why
                </p>
              </div>
            </li>
          </ul>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-center text-lg">
            Most systems achieve <span className="font-bold text-destructive">three-nines (99.9%)</span> at best
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "The Lumen Orca Solution",
    subtitle: "Six-Nines Governance",
    content: (
      <div className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-primary">How We Achieve 99.9999%</h3>
          
          <div className="grid gap-4">
            <Card className="glass-card border-primary/30">
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-2">Autonomous Multi-Agent Coordination</h4>
                <p className="text-sm text-muted-foreground">
                  11 specialized agents work together like a professional orchestra, each with specific responsibilities
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-primary/30">
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-2">Mutation Testing</h4>
                <p className="text-sm text-muted-foreground">
                  Ensures tests actually catch bugs, not just pass green (≥80% mutation score)
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-primary/30">
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-2">Property-Based Validation</h4>
                <p className="text-sm text-muted-foreground">
                  Validates system invariants across thousands of generated test cases
                </p>
              </CardContent>
            </Card>

            <Card className="glass-card border-primary/30">
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-2">Mandatory Evidence Trails</h4>
                <p className="text-sm text-muted-foreground">
                  Every build produces a complete, signed audit bundle — nothing is hidden
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="bg-primary/10 p-4 rounded-lg">
          <p className="text-center font-semibold">
            F_total ≤ 10⁻⁶ enforced through automated quality gates
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Live Orchestration",
    subtitle: "See It In Action",
    content: (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold mb-2">Watch the Agents Collaborate</h3>
          <p className="text-muted-foreground">
            Navigate to the Dashboard to see live orchestration
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="font-semibold mb-2">What You'll See:</p>
            <ul className="list-disc list-inside text-sm space-y-2 text-muted-foreground">
              <li>Real-time DAG visualization of task dependencies</li>
              <li>Agent status grid showing active, idle, and blocked states</li>
              <li>Live metrics including F_total calculation</li>
              <li>Quality gate status updates</li>
            </ul>
          </div>

          <Link to="/">
            <Button className="w-full" size="lg">
              Go to Dashboard →
            </Button>
          </Link>
        </div>

        <div className="bg-primary/10 p-4 rounded-lg">
          <p className="text-sm font-semibold mb-2">Demo Tip:</p>
          <p className="text-sm text-muted-foreground">
            "Notice how dependencies resolve automatically — A2 can't start until A1 completes. The DAG ensures tasks execute in correct order, no manual coordination needed."
          </p>
        </div>
      </div>
    ),
  },
  {
    title: "Quality Gates",
    subtitle: "Six Layers of Protection",
    content: (
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-center">Six Quality Gates</h3>
        
        <div className="grid gap-3">
          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Unit Tests</p>
                  <p className="text-sm text-muted-foreground">Vitest coverage</p>
                </div>
                <Badge>≥ 95%</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Mutation Score</p>
                  <p className="text-sm text-muted-foreground">Stryker analysis</p>
                </div>
                <Badge>≥ 0.80</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Property Tests</p>
                  <p className="text-sm text-muted-foreground">fast-check validation</p>
                </div>
                <Badge>Pass</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Flake Rate</p>
                  <p className="text-sm text-muted-foreground">Hermetic builds</p>
                </div>
                <Badge>{"<"} 0.1%</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Contract Validation</p>
                  <p className="text-sm text-muted-foreground">Schema enforcement</p>
                </div>
                <Badge>Required</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-primary/30">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">F_total Gate</p>
                  <p className="text-sm text-muted-foreground">Aggregate failure rate</p>
                </div>
                <Badge className="bg-primary">≤ 10⁻⁶</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Link to="/telemetry">
          <Button variant="outline" className="w-full">
            View Telemetry →
          </Button>
        </Link>
      </div>
    ),
  },
  {
    title: "Evidence Bundles",
    subtitle: "Complete Audit Trail",
    content: (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-2">Transparent & Auditable</h3>
          <p className="text-muted-foreground">
            Every PR gets a complete, signed evidence bundle
          </p>
        </div>

        <div className="space-y-4">
          <Card className="glass-card">
            <CardContent className="pt-6">
              <h4 className="font-semibold mb-2">What's Included:</h4>
              <ul className="list-disc list-inside text-sm space-y-2 text-muted-foreground">
                <li>Complete test results (unit, mutation, property)</li>
                <li>SBOM (Software Bill of Materials)</li>
                <li>Quality metrics and gate status</li>
                <li>Build artifacts and logs</li>
                <li>Agent execution traces</li>
                <li>Cryptographic signatures</li>
              </ul>
            </CardContent>
          </Card>

          <div className="bg-primary/10 p-4 rounded-lg">
            <p className="text-sm font-semibold mb-1">Key Benefit:</p>
            <p className="text-sm text-muted-foreground">
              Complete reproducibility and compliance — know exactly what went into every build
            </p>
          </div>

          <Link to="/evidence">
            <Button className="w-full">
              View Evidence →
            </Button>
          </Link>
        </div>
      </div>
    ),
  },
  {
    title: "Current Status",
    subtitle: "Production Ready",
    content: (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="glass-card border-primary/30">
            <CardContent className="pt-6">
              <Badge className="mb-4">Phase I</Badge>
              <h4 className="font-semibold text-lg mb-2">Certified ✓</h4>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li>Governance infrastructure operational</li>
                <li>Quality gates enforced</li>
                <li>Evidence generation active</li>
                <li>CI/CD pipeline integrated</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardContent className="pt-6">
              <Badge variant="secondary" className="mb-4">Phase II</Badge>
              <h4 className="font-semibold text-lg mb-2">Roadmap</h4>
              <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
                <li>Full agent autonomy (A1-A10)</li>
                <li>LLM integration</li>
                <li>Self-healing workflows</li>
                <li>Advanced collaboration</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="bg-primary/10 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Adoption Path</h4>
          <p className="text-sm text-muted-foreground">
            Start with the governance layer (six-nines metrics, evidence bundles). 
            Gradually enable agent automation as confidence builds. The system proves 
            six-nines reliability is achievable even before full autonomy.
          </p>
        </div>

        <Link to="/agents">
          <Button variant="outline" className="w-full">
            Explore Agent Fleet →
          </Button>
        </Link>
      </div>
    ),
  },
];

export function DemoPresentation({ open, onOpenChange }: DemoPresentationProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      setCurrentSlide(0);
    }
  };

  const prevSlide = () => {
    setCurrentSlide(currentSlide > 0 ? currentSlide - 1 : slides.length - 1);
  };

  const toggleAutoPlay = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">{slides[currentSlide].title}</h2>
            <p className="text-sm text-muted-foreground">{slides[currentSlide].subtitle}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="animate-fade-in">
            {slides[currentSlide].content}
          </div>
        </div>

        {/* Footer Controls */}
        <div className="border-t p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={prevSlide}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={nextSlide}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleAutoPlay}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {currentSlide + 1} / {slides.length}
              </span>
              <div className="flex gap-1">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentSlide(index)}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      index === currentSlide ? "bg-primary" : "bg-muted"
                    }`}
                  />
                ))}
              </div>
            </div>

            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Exit Demo
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
