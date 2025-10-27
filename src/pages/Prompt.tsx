import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Play, FileCode, AlertCircle, Terminal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { orchestratorService } from "@/lib/orchestrator-service";
import type { AgentRole, AgentTask } from "../../packages/agents/src/types";

const exampleManifest = `# Lumen Master Prompt - Example Workflow
name: "user-authentication"
description: "Build OAuth authentication system"

tasks:
  - id: parse-spec
    agent: A1_spec
    description: "Parse OAuth spec from RFC 6749"
    
  - id: design-arch
    agent: A2_architect
    depends_on: [parse-spec]
    description: "Design token storage and refresh flow"
    
  - id: implement-a
    agent: A3_codegen_a
    depends_on: [design-arch]
    description: "Implement with Passport.js"
    
  - id: implement-b
    agent: A4_codegen_b
    depends_on: [design-arch]
    description: "Implement with custom JWT library"
    
  - id: adjudicate
    agent: A5_adjudicator
    depends_on: [implement-a, implement-b]
    description: "Compare and merge implementations"
    
  - id: qa-test
    agent: A6_qa_harness
    depends_on: [adjudicate]
    description: "Run auth-specific property tests"
    
  - id: generate-evidence
    agent: A7_evidence
    depends_on: [qa-test]
    description: "Generate evidence bundle"

quality:
  min_coverage: 95
  min_mutation: 0.85
  max_flake: 0.05
`;

interface ParsedTask {
  id: string;
  agent: string;
  depends_on?: string[];
  description: string;
}

interface ParsedManifest {
  name: string;
  description: string;
  tasks: ParsedTask[];
  quality?: {
    min_coverage: number;
    min_mutation: number;
    max_flake: number;
  };
}

const Prompt = () => {
  const [manifest, setManifest] = useState(exampleManifest);
  const [isParsing, setIsParsing] = useState(false);
  const [autoExecute, setAutoExecute] = useState(false);
  const [outputs, setOutputs] = useState<string[]>([]);
  const { toast } = useToast();

  const parseManifest = (yaml: string): ParsedManifest | null => {
    try {
      // Simple YAML parser for demo (replace with proper YAML library in production)
      const lines = yaml.split('\n').filter(line => !line.trim().startsWith('#') && line.trim());
      const manifest: Partial<ParsedManifest> = { tasks: [] };
      
      let currentTask: Partial<ParsedTask> | null = null;
      let inTasks = false;
      
      for (const line of lines) {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('name:')) {
          manifest.name = trimmed.split('name:')[1].trim().replace(/['"]/g, '');
        } else if (trimmed.startsWith('description:')) {
          if (currentTask) {
            currentTask.description = trimmed.split('description:')[1].trim().replace(/['"]/g, '');
          } else {
            manifest.description = trimmed.split('description:')[1].trim().replace(/['"]/g, '');
          }
        } else if (trimmed === 'tasks:') {
          inTasks = true;
        } else if (inTasks && trimmed.startsWith('- id:')) {
          if (currentTask && currentTask.id && currentTask.agent) {
            manifest.tasks!.push(currentTask as ParsedTask);
          }
          currentTask = { id: trimmed.split('id:')[1].trim() };
        } else if (currentTask && trimmed.startsWith('agent:')) {
          currentTask.agent = trimmed.split('agent:')[1].trim();
        } else if (currentTask && trimmed.startsWith('depends_on:')) {
          const deps = trimmed.split('depends_on:')[1].trim();
          currentTask.depends_on = deps
            .replace(/[\[\]]/g, '')
            .split(',')
            .map(d => d.trim());
        }
      }
      
      if (currentTask && currentTask.id && currentTask.agent) {
        manifest.tasks!.push(currentTask as ParsedTask);
      }
      
      return manifest as ParsedManifest;
    } catch (error) {
      console.error('Parse error:', error);
      return null;
    }
  };

  const handleExecute = async () => {
    setIsParsing(true);
    setOutputs([]); // Clear previous outputs

    try {
      const parsed = parseManifest(manifest);
      
      if (!parsed || !parsed.name || !parsed.tasks || parsed.tasks.length === 0) {
        const errorMsg = "Could not parse YAML manifest. Check syntax.";
        setOutputs(prev => [...prev, `❌ ERROR: ${errorMsg}`]);
        toast({
          title: "Invalid manifest",
          description: errorMsg,
          variant: "destructive",
        });
        return;
      }

      setOutputs(prev => [...prev, `📋 Parsed manifest: ${parsed.name}`]);
      setOutputs(prev => [...prev, `📝 Description: ${parsed.description}`]);
      setOutputs(prev => [...prev, `🔢 Total tasks: ${parsed.tasks.length}`]);

      // Reset orchestrator
      orchestratorService.reset();
      setOutputs(prev => [...prev, `🔄 Orchestrator reset`]);

      // Convert parsed tasks to AgentTask format
      const tasks: AgentTask[] = parsed.tasks.map(task => ({
        id: task.id,
        role: task.agent as AgentRole,
        inputs: { description: task.description },
        status: 'pending' as const,
        dependencies: task.depends_on || [],
      }));

      // Add tasks to orchestrator
      tasks.forEach(task => {
        orchestratorService.getOrchestrator().addTask(task);
        setOutputs(prev => [...prev, `➕ Added task: ${task.id} (${task.role})`]);
      });

      toast({
        title: "Workflow loaded",
        description: `${parsed.name}: ${tasks.length} tasks ready for execution`,
      });

      if (autoExecute) {
        setOutputs(prev => [...prev, `▶️ Auto-executing workflow...`]);
        // Start execution
        setTimeout(() => {
          orchestratorService.start().then(() => {
            setOutputs(prev => [...prev, `✅ Workflow execution completed`]);
          }).catch(error => {
            const errorMsg = error.message || "Unknown error";
            setOutputs(prev => [...prev, `❌ Execution failed: ${errorMsg}`]);
            toast({
              title: "Execution failed",
              description: errorMsg,
              variant: "destructive",
            });
          });
        }, 500);
      } else {
        setOutputs(prev => [...prev, `⏸️ Manual mode: Ready for execution. Navigate to Dashboard to start.`]);
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Failed to execute workflow";
      setOutputs(prev => [...prev, `❌ ERROR: ${errorMsg}`]);
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsParsing(false);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Master Prompt</h1>
          <p className="text-muted-foreground">
            Define agent workflows using YAML manifests. Orchestrator coordinates execution.
          </p>
        </div>

        <div className="grid gap-6">
          <Card className="p-6 border border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileCode className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Workflow Manifest</h2>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch 
                  id="auto-execute" 
                  checked={autoExecute}
                  onCheckedChange={setAutoExecute}
                />
                <Label htmlFor="auto-execute" className="text-sm cursor-pointer">
                  Auto-execute
                </Label>
              </div>
            </div>

            <Textarea
              value={manifest}
              onChange={(e) => setManifest(e.target.value)}
              className="font-mono text-sm min-h-[500px] bg-background/50"
              placeholder="Enter YAML manifest..."
            />

            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertCircle className="w-4 h-4" />
                <span>
                  {autoExecute 
                    ? "Auto-execute ON: Workflow will start immediately" 
                    : "Manual mode: Load workflow then start from Dashboard"}
                </span>
              </div>
              <Button
                onClick={handleExecute}
                disabled={isParsing}
                className="gap-2"
              >
                <Play className="w-4 h-4" />
                {isParsing ? "Loading..." : autoExecute ? "Execute Workflow" : "Load Workflow"}
              </Button>
            </div>
          </Card>

          {outputs.length > 0 && (
            <Card className="p-6 border border-secondary/20 bg-background/80">
              <div className="flex items-center gap-3 mb-4">
                <Terminal className="w-5 h-5 text-secondary" />
                <h2 className="text-lg font-semibold text-foreground">Execution Output</h2>
              </div>
              
              <div className="bg-muted/30 rounded-md p-4 max-h-[400px] overflow-y-auto">
                <div className="font-mono text-sm space-y-1">
                  {outputs.map((output, idx) => (
                    <div key={idx} className="text-foreground/80">
                      {output}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          <Card className="p-6 border border-border bg-muted/20">
            <h3 className="text-sm font-semibold text-foreground mb-3">Manifest Schema</h3>
            <div className="space-y-2 text-xs font-mono text-muted-foreground">
              <div><span className="text-primary">name:</span> Workflow identifier</div>
              <div><span className="text-primary">description:</span> Brief explanation</div>
              <div><span className="text-primary">tasks:</span> Array of agent tasks</div>
              <div className="ml-4"><span className="text-secondary">- id:</span> Unique task identifier</div>
              <div className="ml-4"><span className="text-secondary">agent:</span> A0-A10 role</div>
              <div className="ml-4"><span className="text-secondary">depends_on:</span> [task-ids] (optional)</div>
              <div className="ml-4"><span className="text-secondary">description:</span> Task details</div>
              <div><span className="text-primary">quality:</span> Gate thresholds (optional)</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Prompt;
