# Lumen Multi-Provider LLM System

## Overview

The Lumen orchestration system supports dynamic routing between multiple LLM providers with automatic fallback, cost tracking, and budget management.

## Architecture

```
┌─────────────────┐
│ Agent (A0-A10)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  LLM Proxy      │ ◄── supabase/functions/llm-proxy/
│  Edge Function  │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌──────────┐
│Primary │ │ Fallback │
│Provider│ │ Provider │
└────────┘ └──────────┘
```

## Supported Providers

### 1. Lovable AI (Default)
- **Models**: `google/gemini-2.5-pro`, `google/gemini-2.5-flash`, `google/gemini-2.5-flash-lite`
- **API Key**: Pre-configured (no user setup required)
- **Cost**: Usage-based, free tier available
- **Use Case**: Default for all agents unless overridden

### 2. OpenAI
- **Models**: `gpt-4o`, `gpt-4o-mini`
- **API Key**: User-provided via Secrets Manager
- **Cost**: Per-token pricing
- **Use Case**: High-quality reasoning tasks

### 3. Anthropic
- **Models**: `claude-3-5-sonnet-20241022`, `claude-3-5-haiku-20241022`
- **API Key**: User-provided via Secrets Manager
- **Cost**: Per-token pricing
- **Use Case**: Extended context and nuanced understanding

### 4. Google AI
- **Models**: `gemini-1.5-pro`, `gemini-1.5-flash`
- **API Key**: User-provided via Secrets Manager
- **Cost**: Per-token pricing
- **Use Case**: Multimodal tasks with vision support

## Configuration

### Global Configuration

Set a default provider for all agents:

```sql
INSERT INTO llm_configurations (
  agent_role,      -- NULL = global
  provider,
  model,
  temperature,
  max_tokens,
  fallback_provider,
  fallback_model,
  is_active
) VALUES (
  NULL,
  'lovable-ai',
  'google/gemini-2.5-flash',
  0.7,
  4096,
  'openai',
  'gpt-4o-mini',
  true
);
```

### Per-Agent Override

Configure specific agents:

```sql
INSERT INTO llm_configurations (
  agent_role,
  provider,
  model,
  is_active
) VALUES (
  'A1_spec',
  'anthropic',
  'claude-3-5-sonnet-20241022',
  true
);
```

## Budget Management

### Setting Budgets

```sql
INSERT INTO budget_settings (
  provider,
  monthly_budget,
  alert_threshold,
  alerts_enabled
) VALUES (
  'openai',
  100.00,
  0.80,  -- Alert at 80%
  true
);
```

### Monitoring Spend

```sql
SELECT 
  provider,
  current_spend,
  monthly_budget,
  (current_spend / monthly_budget) * 100 AS usage_percent
FROM budget_settings;
```

## Fallback Logic

The system automatically falls back when:

1. Primary provider returns an error
2. Rate limits are exceeded
3. Provider is marked as "down" in health checks

Fallback flow:
```
Primary Provider
  ↓ (on error)
Fallback Provider (if configured)
  ↓ (on error)
Error returned to agent
```

## Usage Tracking

All LLM calls are logged:

```sql
SELECT 
  agent_role,
  provider,
  model,
  tokens_input,
  tokens_output,
  estimated_cost,
  latency_ms,
  created_at
FROM llm_usage_logs
ORDER BY created_at DESC
LIMIT 100;
```

## API Key Setup

### Via UI (Recommended)

1. Navigate to `/settings`
2. Scroll to "API Key Management"
3. Enter API keys for desired providers
4. Keys are stored securely in Supabase Secrets

### Via CLI (Advanced)

```bash
# Add OpenAI key
supabase secrets set OPENAI_API_KEY=sk-...

# Add Anthropic key
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# Add Google AI key
supabase secrets set GOOGLE_AI_API_KEY=...
```

## Cost Estimation

Costs are estimated using provider pricing:

| Provider   | Input (per 1M tokens) | Output (per 1M tokens) |
|------------|-----------------------|------------------------|
| Lovable AI | $0.01                 | $0.03                  |
| OpenAI     | $0.15 - $5.00         | $0.60 - $15.00         |
| Anthropic  | $3.00 - $15.00        | $15.00 - $75.00        |
| Google     | $0.125 - $1.25        | $0.375 - $5.00         |

*Prices vary by model. Check provider documentation for exact rates.*

## Provider Health Monitoring

The system tracks provider health:

```sql
SELECT 
  provider,
  status,  -- 'healthy', 'degraded', 'down'
  consecutive_failures,
  last_success_at,
  last_failure_at
FROM provider_health;
```

## Environment Variables

Add to `.env`:

```env
# Optional: Control metric exposure
LUMEN_METRICS_EXPOSE=none  # none | admin | all

# Optional: Show raw numeric metrics
NEXT_PUBLIC_SHOW_NUMERIC=false
```

## Best Practices

1. **Start with Lovable AI**: No setup required, free tier available
2. **Set budgets**: Always configure monthly budgets to prevent overspend
3. **Enable fallbacks**: Configure fallback providers for critical agents
4. **Monitor costs**: Check usage logs weekly
5. **Use per-agent configs**: Optimize provider selection per agent role

## Troubleshooting

### Provider Calls Failing

1. Check API key is set correctly
2. Verify provider health status
3. Check budget hasn't been exceeded
4. Review edge function logs

### High Costs

1. Review `llm_usage_logs` for high-volume agents
2. Consider switching to cheaper models
3. Reduce `max_tokens` in configuration
4. Enable aggressive caching

### Slow Response Times

1. Check provider health and avg latency
2. Consider using faster models (e.g., `gpt-4o-mini`, `gemini-2.5-flash`)
3. Review `latency_ms` in usage logs

## References

- [Lovable AI Documentation](https://docs.lovable.dev/features/ai)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Anthropic API Docs](https://docs.anthropic.com)
- [Google AI Docs](https://ai.google.dev/docs)
