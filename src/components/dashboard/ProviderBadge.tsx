import { Badge } from "@/components/ui/badge";
import { Sparkles, Brain, Zap, Search } from "lucide-react";

type Provider = 'lovable-ai' | 'openai' | 'anthropic' | 'google';

interface ProviderBadgeProps {
  provider: Provider;
  model?: string;
  latency?: number;
}

const PROVIDER_CONFIG: Record<Provider, { icon: any; label: string; color: string }> = {
  'lovable-ai': { icon: Sparkles, label: 'Lovable', color: 'hsl(var(--primary))' },
  'openai': { icon: Brain, label: 'OpenAI', color: 'hsl(var(--accent))' },
  'anthropic': { icon: Zap, label: 'Anthropic', color: 'hsl(var(--warning))' },
  'google': { icon: Search, label: 'Google', color: 'hsl(var(--chart-1))' },
};

export const ProviderBadge = ({ provider, model, latency }: ProviderBadgeProps) => {
  const config = PROVIDER_CONFIG[provider];
  const Icon = config.icon;
  
  return (
    <Badge variant="outline" className="gap-1.5" style={{ borderColor: config.color }}>
      <Icon className="h-3 w-3" style={{ color: config.color }} />
      <span className="text-xs">{config.label}</span>
      {model && <span className="text-xs text-muted-foreground">· {model}</span>}
      {latency && <span className="text-xs text-muted-foreground">· {latency}ms</span>}
    </Badge>
  );
};
