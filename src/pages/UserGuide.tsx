import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, Code, Database, Shield, Zap } from "lucide-react";

const UserGuide = () => {
  return (
    <div className="min-h-screen p-8 gradient-mesh">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">User Guide</h1>
        <p className="text-muted-foreground">
          Complete manual for the Lumen Six-Nines Governance System
        </p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-3xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                What is Lumen?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Lumen is an autonomous build orchestration system designed to achieve <strong>six-nines reliability (99.9999%)</strong> through multi-agent coordination and comprehensive quality gates.
              </p>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                    Core Principles
                  </h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>Precision through automated quality gates</li>
                    <li>Compassion via transparent governance</li>
                    <li>Autonomy with human oversight</li>
                    <li>Complete audit trails for every build</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Database className="h-4 w-4 text-primary" />
                    Key Metrics
                  </h4>
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                    <li>F_total ≤ 10⁻⁶ (six-nines)</li>
                    <li>Test coverage ≥ 95%</li>
                    <li>Mutation score ≥ 0.80</li>
                    <li>Flake rate {"<"} 0.1%</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle>System Architecture</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">A0</Badge>
                  <div>
                    <p className="font-semibold">Orchestrator</p>
                    <p className="text-sm text-muted-foreground">Coordinates DAG execution and agent tasks</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">A1-A2</Badge>
                  <div>
                    <p className="font-semibold">Specification & Planning</p>
                    <p className="text-sm text-muted-foreground">Requirements parsing and architecture design</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">A3-A5</Badge>
                  <div>
                    <p className="font-semibold">Contract Validation & Code Generation</p>
                    <p className="text-sm text-muted-foreground">Dual coding paths with adjudication</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">A6-A7</Badge>
                  <div>
                    <p className="font-semibold">QA & Evidence</p>
                    <p className="text-sm text-muted-foreground">Test execution and audit bundle generation</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="mt-1">A8-A10</Badge>
                  <div>
                    <p className="font-semibold">Performance, Security & Incidents</p>
                    <p className="text-sm text-muted-foreground">Monitoring and issue routing</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Start Tab */}
        <TabsContent value="quickstart" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Getting Started</CardTitle>
              <CardDescription>Essential commands and setup instructions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Code className="h-4 w-4 text-primary" />
                  Installation
                </h4>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
                  <code>{`# Install dependencies
pnpm install

# Run development build
pnpm dev

# Run tests
pnpm test

# Generate evidence bundle
pnpm bundle`}</code>
                </pre>
              </div>

              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Phase II Status:</strong> Autonomous agents (A1-A10) are currently placeholders. Manual development continues until LLM integration is complete.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h4 className="font-semibold">Dashboard Navigation</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li><strong>Dashboard:</strong> Orchestration control center with live DAG visualization</li>
                  <li><strong>Agents:</strong> Monitor A0-A10 status, metrics, and health</li>
                  <li><strong>Contracts:</strong> View JSON schemas and TypeScript type definitions</li>
                  <li><strong>Evidence:</strong> Download audit bundles (HTML/JSON reports, SBOM)</li>
                  <li><strong>Telemetry:</strong> Real-time charts for governance metrics</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Agent Fleet (A0-A10)</CardTitle>
              <CardDescription>Detailed roles and responsibilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { id: 'A0', name: 'Orchestrator', role: 'DAG Execution & Coordination', input: 'Task graph', output: 'Execution state' },
                { id: 'A1', name: 'Spec Architect', role: 'Requirements Parsing', input: 'Natural language', output: 'Formal specifications' },
                { id: 'A2', name: 'Planner', role: 'System Architecture', input: 'Specifications', output: 'Component design' },
                { id: 'A3', name: 'Contract Guardian', role: 'Schema Validation', input: 'Type definitions', output: 'Validated contracts' },
                { id: 'A4', name: 'CodeGen A', role: 'Primary Implementation', input: 'Architecture', output: 'Code solution A' },
                { id: 'A5', name: 'CodeGen B + Adjudicator', role: 'Dual Path Validation', input: 'Architecture', output: 'Merged solution' },
                { id: 'A6', name: 'QA Harness', role: 'Test Execution', input: 'Code + tests', output: 'Test results' },
                { id: 'A7', name: 'Evidence Generator', role: 'Audit Trail Creation', input: 'Build artifacts', output: 'Evidence bundle' },
                { id: 'A8', name: 'Performance Analyzer', role: 'Optimization', input: 'Metrics', output: 'Performance report' },
                { id: 'A9', name: 'Security Scanner', role: 'Vulnerability Detection', input: 'Codebase', output: 'Security audit' },
                { id: 'A10', name: 'Incident Router', role: 'Issue Management', input: 'Failures', output: 'RFC/escalation' },
              ].map((agent) => (
                <div key={agent.id} className="border-l-2 border-primary/30 pl-4 space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{agent.id}</Badge>
                    <span className="font-semibold">{agent.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{agent.role}</p>
                  <div className="text-xs text-muted-foreground flex gap-4">
                    <span>→ {agent.input}</span>
                    <span>← {agent.output}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Governance Tab */}
        <TabsContent value="governance" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Six-Nines Quality Gates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3">
                {[
                  { gate: 'Unit Tests', threshold: '≥ 95% coverage', status: 'active' },
                  { gate: 'Mutation Score', threshold: '≥ 0.80', status: 'active' },
                  { gate: 'Flake Rate', threshold: '< 0.1%', status: 'active' },
                  { gate: 'Contract Validation', threshold: 'Schema approval required', status: 'active' },
                  { gate: 'Evidence Bundle', threshold: 'Mandatory per PR', status: 'active' },
                  { gate: 'F_total Gate', threshold: '≤ 10⁻⁶', status: 'active' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-primary/20">
                    <div>
                      <p className="font-semibold">{item.gate}</p>
                      <p className="text-sm text-muted-foreground">{item.threshold}</p>
                    </div>
                    <Badge variant="outline" className="bg-primary/10">
                      {item.status}
                    </Badge>
                  </div>
                ))}
              </div>

              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  All gates are enforced via GitHub Actions CI. PRs cannot merge without passing all checks and CODEOWNERS approval.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Common Workflows</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h4 className="font-semibold">1. Starting a Build</h4>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-4">
                  <li>Navigate to Dashboard → Orchestration Control</li>
                  <li>Click "Start Execution" button</li>
                  <li>Monitor live DAG visualization as tasks execute</li>
                  <li>View agent status updates in real-time</li>
                  <li>Download evidence bundle upon completion</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">2. Reviewing Evidence Bundles</h4>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-4">
                  <li>Go to Evidence page</li>
                  <li>Select bundle from list (sorted by timestamp)</li>
                  <li>View summary: status, F_total, quality gates</li>
                  <li>Download HTML report or JSON data</li>
                  <li>Check SBOM for dependency audit</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">3. Monitoring Governance Metrics</h4>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-4">
                  <li>Navigate to Telemetry page</li>
                  <li>Review real-time charts: determinism, flake rate, F_total trends</li>
                  <li>Check quality gate status indicators</li>
                  <li>Export metrics data for reporting</li>
                </ol>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">4. Contract Management</h4>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-4">
                  <li>Go to Contracts page</li>
                  <li>View JSON schemas and TypeScript definitions</li>
                  <li>Verify contract changes require CODEOWNERS approval</li>
                  <li>Check contract validation in CI logs</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserGuide;
