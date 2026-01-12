# Production Deployment Guide

Deploy Lumen-Orca with P69 Protocol enforcement (99.9999% floor → 100% ceiling).

## Prerequisites

- Supabase project configured
- Environment variables set
- Database migrations applied

## Environment Variables

```env
# Required
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional - LLM Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...
```

## Database Setup

Apply the self-improvement migrations:

```bash
# Using Supabase CLI
supabase db push

# Or apply directly
psql $DATABASE_URL < supabase/migrations/20260112000001_self_improvement_infrastructure.sql
```

## Deployment Steps

### 1. Build the Application

```bash
pnpm install
pnpm build
```

### 2. Deploy to Hosting

**Vercel:**
```bash
vercel deploy --prod
```

**Netlify:**
```bash
netlify deploy --prod
```

### 3. Deploy Edge Functions

```bash
supabase functions deploy llm-proxy
supabase functions deploy execute-code
```

### 4. Enable Self-Improvement

```typescript
import { initializeProductionOrchestrator } from '@/lib/production-orchestrator';

// On app startup
const orchestrator = await initializeProductionOrchestrator();

// The meta-learner will now run continuous analysis
```

## P69 Protocol Configuration

The system enforces:
- **Floor:** 99.9999% reliability (F_total ≤ 10⁻⁶)
- **Ceiling:** 100% reliability (zero failures)

### Quality Gates

| Gate | Threshold | Description |
|------|-----------|-------------|
| success-rate | ≥ 99.9999% | Task completion rate |
| f-total | ≤ 10⁻⁶ | Aggregate failure probability |
| zero-failures | 0 | Target: no failures |

### Monitoring

Monitor P69 compliance via:

```typescript
const status = await orchestrator.getP69Status();

console.log(`Current Reliability: ${(status.currentReliability * 100).toFixed(4)}%`);
console.log(`P69 Compliant: ${status.compliant}`);
console.log(`Gap to 100%: ${(status.gap * 100).toFixed(6)}%`);
```

## Self-Improvement Components

| Component | Purpose |
|-----------|---------|
| A11 Meta-Learner | Continuous optimization |
| Prompt Optimizer | A/B testing prompts |
| Feedback Service | Human-in-the-loop learning |
| Error Recovery | Resilient execution |

### Enable Continuous Learning

The meta-learner runs automatically every 5 minutes. Configure:

```typescript
const metaLearner = getMetaLearner({
  analysisIntervalMs: 300000,    // 5 minutes
  minSamplesForDecision: 30,     // Min samples for A/B test
  explorationRate: 0.2,          // 20% to challenger prompts
  confidenceThreshold: 0.95,     // 95% confidence to promote
});
```

### Collect Human Feedback

```typescript
await orchestrator.submitFeedback(
  executionId,
  agentRole,
  rating,      // 1-5 stars
  comment      // Optional feedback
);
```

## Scaling

### Horizontal Scaling

The orchestrator is stateless - deploy multiple instances behind a load balancer.

### Database Scaling

- Enable connection pooling (PgBouncer)
- Add read replicas for analytics queries
- Partition `agent_execution_history` by date

### LLM Provider Scaling

Configure fallback providers:

```sql
-- Set fallback for high-traffic agents
UPDATE llm_configurations
SET fallback_provider = 'openai', fallback_model = 'gpt-4o'
WHERE agent_role = 'A3_codegen_a';
```

## Monitoring & Alerts

### Key Metrics to Monitor

1. **F_total** - Should stay ≤ 10⁻⁶
2. **Success rate per agent** - Watch for regressions
3. **Latency p95** - Should be < 10s
4. **Cost per execution** - Track LLM spend

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| F_total | > 5×10⁻⁷ | > 10⁻⁶ |
| Agent success rate | < 95% | < 90% |
| Latency p95 | > 8s | > 15s |

### Dashboard

The Meta-Learner Panel (`MetaLearnerPanel.tsx`) shows:
- System health score
- Agent performance snapshots
- Learning insights
- Active experiments

## Backup & Recovery

### Database Backups

```bash
# Daily backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
```

### Evidence Bundles

Evidence is stored in:
- `audit_logs` table
- Supabase Storage (if configured)

## Troubleshooting

### P69 Violation

If reliability drops below 99.9999%:

1. Check `learning_insights` for detected issues
2. Review `failure_analysis` for patterns
3. Check `agent_performance_baselines` for regressions
4. Run manual analysis: `await orchestrator.getInsights()`

### Agent Failures

1. Check `agent_execution_history` for error patterns
2. Review circuit breaker status
3. Verify LLM provider health
4. Check rate limits and quotas

### Performance Issues

1. Check `agent_execution_history.execution_time_ms`
2. Review prompt sizes (may need chunking)
3. Consider switching to faster models
4. Enable parallel execution

## Security Checklist

- [ ] All API keys in environment variables
- [ ] Supabase RLS enabled on all tables
- [ ] Rate limiting configured
- [ ] Audit logging enabled
- [ ] Regular key rotation scheduled

---

**Target: 100% reliability. Accept nothing less.**
