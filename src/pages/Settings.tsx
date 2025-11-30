import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Settings as SettingsIcon, Zap, Database, DollarSign, Key, CheckCircle2, AlertCircle, Info } from 'lucide-react';

const PROVIDERS = ['lovable-ai', 'openai', 'anthropic', 'google'] as const;

const MODELS: Record<string, string[]> = {
  'lovable-ai': [
    'google/gemini-2.5-flash',
    'google/gemini-2.5-pro',
    'google/gemini-2.5-flash-lite',
    'openai/gpt-5',
    'openai/gpt-5-mini',
    'openai/gpt-5-nano'
  ],
  'openai': [
    'gpt-5-2025-08-07',
    'gpt-5-mini-2025-08-07',
    'gpt-5-nano-2025-08-07',
    'gpt-4.1-2025-04-14'
  ],
  'anthropic': [
    'claude-sonnet-4-5',
    'claude-opus-4-1-20250805',
    'claude-3-5-haiku-20241022'
  ],
  'google': [
    'gemini-2.0-flash-exp',
    'gemini-1.5-pro',
    'gemini-1.5-flash'
  ],
};

const AGENT_ROLES = [
  'A1_spec',
  'A2_architect',
  'A3_codegen_a',
  'A4_codegen_b',
  'A5_adjudicator',
  'A6_qa_harness',
  'A7_evidence',
  'A8_performance',
  'A9_security',
  'A10_incident'
] as const;

const AGENT_NAMES: Record<string, string> = {
  'A1_spec': 'Spec Architect',
  'A2_architect': 'System Architect',
  'A3_codegen_a': 'Code Generator A',
  'A4_codegen_b': 'Code Generator B',
  'A5_adjudicator': 'Adjudicator',
  'A6_qa_harness': 'QA Harness',
  'A7_evidence': 'Evidence Reporter',
  'A8_performance': 'Performance Analyst',
  'A9_security': 'Security Auditor',
  'A10_incident': 'Incident Responder',
};

export default function Settings() {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    await Promise.all([loadConfigurations(), loadBudgets()]);
    setLoading(false);
  }

  async function loadConfigurations() {
    const { data, error } = await supabase
      .from('llm_configurations')
      .select('*')
      .order('agent_role', { ascending: true, nullsFirst: false });
    
    if (error) {
      toast({ title: 'Error loading configurations', variant: 'destructive' });
      console.error(error);
    } else {
      setConfigs(data || []);
    }
  }

  async function loadBudgets() {
    const { data, error } = await supabase.from('budget_settings').select('*');
    
    if (error) {
      toast({ title: 'Error loading budgets', variant: 'destructive' });
      console.error(error);
    } else {
      setBudgets(data || []);
    }
  }

  async function updateConfig(id: string, updates: any) {
    const { error } = await supabase
      .from('llm_configurations')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) {
      toast({ title: 'Failed to update configuration', variant: 'destructive' });
      console.error(error);
    } else {
      toast({ title: 'Configuration updated' });
      loadConfigurations();
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-center">
          <SettingsIcon className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  const globalConfig = configs.find(c => c.agent_role === null);

  // Determine which API keys are configured based on available providers
  const apiKeyStatus = {
    'lovable-ai': { configured: true, name: 'Lovable AI', description: 'Pre-configured gateway' },
    'openai': { configured: configs.some(c => c.provider === 'openai'), name: 'OpenAI', description: 'GPT models' },
    'anthropic': { configured: configs.some(c => c.provider === 'anthropic'), name: 'Anthropic', description: 'Claude models' },
    'google': { configured: configs.some(c => c.provider === 'google'), name: 'Google AI', description: 'Gemini models' },
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <SettingsIcon className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">LLM Provider Settings</h1>
            <p className="text-muted-foreground">Manage AI models, API keys, and budget monitoring</p>
          </div>
        </div>

        <Tabs defaultValue="providers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-6">

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Configure default and per-agent LLM providers. Lovable AI provides access to multiple models without requiring your own API keys.
              </AlertDescription>
            </Alert>

            {/* Global Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Global Default Provider
                </CardTitle>
                <CardDescription>
                  Set the default LLM provider for all agents (can be overridden per agent)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {globalConfig && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Provider</Label>
                      <Select
                        value={globalConfig.provider}
                        onValueChange={(val) => updateConfig(globalConfig.id, { provider: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROVIDERS.map(p => (
                            <SelectItem key={p} value={p}>{p}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Model</Label>
                      <Select
                        value={globalConfig.model}
                        onValueChange={(val) => updateConfig(globalConfig.id, { model: val })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MODELS[globalConfig.provider]?.map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Per-Agent Configurations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Per-Agent Configurations
                </CardTitle>
                <CardDescription>
                  Override provider and model settings for individual agents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {AGENT_ROLES.map(role => {
                  const agentConfig = configs.find(c => c.agent_role === role);
                  if (!agentConfig) return null;

                  return (
                    <div key={role} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="font-semibold">{AGENT_NAMES[role]}</h3>
                          <p className="text-sm text-muted-foreground font-mono">{role}</p>
                        </div>
                        <Switch
                          checked={agentConfig.is_active}
                          onCheckedChange={(val) => updateConfig(agentConfig.id, { is_active: val })}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Provider</Label>
                          <Select
                            value={agentConfig.provider}
                            onValueChange={(val) => updateConfig(agentConfig.id, { provider: val })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PROVIDERS.map(p => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Model</Label>
                          <Select
                            value={agentConfig.model}
                            onValueChange={(val) => updateConfig(agentConfig.id, { model: val })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {MODELS[agentConfig.provider]?.map(m => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api-keys" className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                API keys are securely stored and managed through the backend. Configure provider API keys to enable additional models beyond Lovable AI.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  API Key Status
                </CardTitle>
                <CardDescription>
                  View which LLM providers are configured and ready to use
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(apiKeyStatus).map(([provider, status]) => (
                  <div key={provider} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {status.configured ? (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-semibold">{status.name}</p>
                        <p className="text-sm text-muted-foreground">{status.description}</p>
                      </div>
                    </div>
                    <Badge variant={status.configured ? "default" : "outline"}>
                      {status.configured ? "Configured" : "Not Configured"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Adding New API Keys</CardTitle>
                <CardDescription>
                  API keys must be configured through the backend secrets manager. Contact your administrator to add new provider API keys.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <p>Required secrets for each provider:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><span className="font-mono">LOVABLE_API_KEY</span> - Pre-configured by Lumen Orca</li>
                  <li><span className="font-mono">OPENAI_API_KEY</span> - For OpenAI GPT models</li>
                  <li><span className="font-mono">ANTHROPIC_API_KEY</span> - For Claude models</li>
                  <li><span className="font-mono">GOOGLE_AI_API_KEY</span> - For Gemini models</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budgets" className="space-y-6">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Monitor monthly spending per provider. Set budgets to prevent unexpected costs from LLM API usage.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Budget & Cost Monitoring
                </CardTitle>
                <CardDescription>
                  Track monthly spending and set budget alerts per provider
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {budgets.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No budget settings configured yet. Budgets will appear here once LLM usage begins.
                  </p>
                ) : (
                  budgets.map(budget => {
                    const spendPercent = (budget.current_spend / budget.monthly_budget) * 100;
                    const isWarning = spendPercent >= 80;
                    const isDanger = spendPercent >= 95;

                    return (
                      <div key={budget.provider} className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="font-mono font-semibold">{budget.provider}</span>
                            {isWarning && (
                              <Badge variant={isDanger ? "destructive" : "secondary"} className="ml-2">
                                {isDanger ? "⚠️ Critical" : "⚠️ Warning"}
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            ${budget.current_spend.toFixed(2)} / ${budget.monthly_budget.toFixed(2)}
                          </span>
                        </div>
                        <Progress
                          value={Math.min(spendPercent, 100)}
                          className="h-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{spendPercent.toFixed(1)}% used</span>
                          <span>Resets: {new Date(budget.reset_date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
