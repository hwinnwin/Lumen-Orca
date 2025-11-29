import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Play, FileCode, AlertCircle, Terminal, Upload, X, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { orchestratorService } from "@/lib/orchestrator-service";
import { supabase } from "@/integrations/supabase/client";
import type { AgentRole, AgentTask } from "../../packages/agents/src/types";

const exampleManifest = `# Lumen Orca Master Prompt - Example Workflow
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

interface UploadedFile {
  name: string;
  content: string;
  type: string;
  size: number;
}

const Prompt = () => {
  const [manifest, setManifest] = useState(exampleManifest);
  const [isParsing, setIsParsing] = useState(false);
  const [autoExecute, setAutoExecute] = useState(false);
  const [outputs, setOutputs] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newFiles: UploadedFile[] = [];

    for (const file of Array.from(files)) {
      try {
        const content = await file.text();
        
        newFiles.push({
          name: file.name,
          content,
          type: file.type || 'text/plain',
          size: file.size,
        });

        // If it's a markdown file, offer to use it as the manifest
        if (file.name.endsWith('.md') || file.name.endsWith('.yaml') || file.name.endsWith('.yml')) {
          toast({
            title: "File uploaded",
            description: `${file.name} - Click "Use as Manifest" to load it`,
          });
        }
      } catch (error) {
        toast({
          title: "Upload failed",
          description: `Could not read ${file.name}`,
          variant: "destructive",
        });
      }
    }

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const useFileAsManifest = (file: UploadedFile) => {
    setManifest(file.content);
    toast({
      title: "Manifest loaded",
      description: `Using ${file.name} as workflow manifest`,
    });
  };

  const isYamlFormat = (text: string): boolean => {
    return text.includes('name:') && text.includes('tasks:') && text.includes('- id:');
  };

  const parseNaturalLanguage = async (text: string): Promise<ParsedManifest | null> => {
    try {
      const systemPrompt = `You are a workflow parser. Convert natural language descriptions into structured workflow manifests.
Extract: workflow name, description, and tasks with agent roles (A1_spec, A2_architect, A3_codegen_a, A4_codegen_b, A5_adjudicator, A6_qa_harness, A7_evidence, etc.).
Respond with valid JSON only: {"name": "...", "description": "...", "tasks": [{"id": "...", "agent": "...", "description": "...", "depends_on": [...]}]}`;

      const { data, error } = await supabase.functions.invoke('llm-proxy', {
        body: {
          agentRole: 'A0_orchestrator',
          prompt: text,
          systemPrompt,
        },
      });

      if (error) throw error;
      if (!data || !data.result) {
        throw new Error('No result from LLM proxy');
      }

      const parsed = JSON.parse(data.result as string);
      return parsed as ParsedManifest;
    } catch (error) {
      console.error('Natural language parsing error:', error);
      return null;
    }
  };

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
      let parsed: ParsedManifest | null = null;
      
      // Detect format and parse accordingly
      if (isYamlFormat(manifest)) {
        setOutputs(prev => [...prev, `📄 Parsing YAML format...`]);
        parsed = parseManifest(manifest);
      } else {
        setOutputs(prev => [...prev, `🤖 Parsing natural language with AI...`]);
        parsed = await parseNaturalLanguage(manifest);
      }
      
      if (!parsed || !parsed.name || !parsed.tasks || parsed.tasks.length === 0) {
        const errorMsg = "Could not parse workflow manifest. Check YAML syntax or refine natural language description.";
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
      
      if (uploadedFiles.length > 0) {
        setOutputs(prev => [...prev, `📎 Attached files: ${uploadedFiles.length}`]);
        uploadedFiles.forEach(file => {
          setOutputs(prev => [...prev, `  • ${file.name} (${(file.size / 1024).toFixed(2)} KB)`]);
        });
      }

      // Reset orchestrator
      orchestratorService.reset();
      setOutputs(prev => [...prev, `🔄 Orchestrator reset`]);

      // Convert parsed tasks to AgentTask format with attached files
      const tasks: AgentTask[] = parsed.tasks.map(task => ({
        id: task.id,
        role: task.agent as AgentRole,
        inputs: { 
          description: task.description,
          attachedFiles: uploadedFiles.map(f => ({ name: f.name, content: f.content }))
        },
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
          {uploadedFiles.length > 0 && (
            <Card className="p-6 border border-border bg-background/50">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Uploaded Files</h2>
                <span className="text-sm text-muted-foreground">({uploadedFiles.length})</span>
              </div>
              
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <FileText className="w-4 h-4 text-primary" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {(file.name.endsWith('.md') || file.name.endsWith('.yaml') || file.name.endsWith('.yml')) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => useFileAsManifest(file)}
                          className="text-xs"
                        >
                          Use as Manifest
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeFile(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="p-6 border border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileCode className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">Workflow Manifest</h2>
              </div>
              
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Upload Files
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept=".md,.yaml,.yml,.txt,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                
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
            </div>

            <Textarea
              value={manifest}
              onChange={(e) => setManifest(e.target.value)}
              className="font-mono text-sm min-h-[500px] bg-background/50"
              placeholder="Enter YAML manifest or describe workflow in natural language..."
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
