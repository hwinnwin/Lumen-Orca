# Incident Response Plan

**Version**: 1.0.0
**Last Updated**: 2025-11-10
**Owner**: Lumen-Orca Team

## 🚨 Quick Reference

### Emergency Contacts
- **Supabase Support**: https://supabase.com/support
- **Lovable Support**: https://lovable.dev/
- **Status Pages**:
  - Supabase: https://status.supabase.com/
  - Lovable: https://lovable.dev/status

### Key Endpoints
- **Health Check**: `https://znkkpibjlifhqvtnghsd.supabase.co/functions/v1/health`
- **Dashboard**: `https://lumenorca.app/`
- **Supabase Dashboard**: `https://supabase.com/dashboard/project/znkkpibjlifhqvtnghsd`

---

## 📋 Incident Severity Classification

### P0 - Critical (Response Time: <5 minutes)
**Impact**: Complete service outage or security breach

**Examples**:
- Homepage unreachable
- Database completely down
- Security breach or data leak
- All LLM providers failing
- Authentication completely broken

**Response SLA**:
- Acknowledge: <5 minutes
- Initial response: <15 minutes
- Resolution target: <1 hour

---

### P1 - High (Response Time: <15 minutes)
**Impact**: Major feature degradation affecting most users

**Examples**:
- Multiple providers down (but fallbacks working)
- High error rate (>5% of requests)
- Slow response times (>5s page load)
- Authentication issues for some users
- Budget system failing

**Response SLA**:
- Acknowledge: <15 minutes
- Initial response: <30 minutes
- Resolution target: <4 hours

---

### P2 - Medium (Response Time: <2 hours)
**Impact**: Minor feature issues affecting some users

**Examples**:
- Single provider degraded
- Moderate error rate (1-5%)
- Non-critical UI feature broken
- Dashboard metrics not updating
- Email notifications delayed

**Response SLA**:
- Acknowledge: <2 hours
- Initial response: <4 hours
- Resolution target: <24 hours

---

### P3 - Low (Response Time: <24 hours)
**Impact**: Cosmetic issues or minor bugs

**Examples**:
- UI styling issues
- Typos in documentation
- Minor performance optimization
- Feature enhancement request

**Response SLA**:
- Acknowledge: <24 hours
- Initial response: <1 week
- Resolution target: Next release

---

## 🔍 Detection & Monitoring

### Automated Monitoring
1. **Health Check Endpoint** (`/functions/v1/health`)
   - Set up external monitoring (UptimeRobot, Pingdom, etc.)
   - Check frequency: Every 5 minutes
   - Alert on: 3 consecutive failures

2. **Provider Health Dashboard**
   - Monitor in Lumen dashboard: `/dashboard`
   - Check for degraded/down providers
   - Monitor budget usage

3. **Supabase Logs**
   - Check Edge Function logs
   - Monitor error rates
   - Review authentication logs

### Manual Checks
- [ ] Homepage loads successfully
- [ ] Authentication flow works
- [ ] LLM proxy responding
- [ ] Database queries executing
- [ ] All providers healthy

---

## 📞 Incident Response Workflow

### 1. Detection
**Trigger**: Alert received or issue reported

**Actions**:
- [ ] Check health endpoint immediately
- [ ] Check Supabase status page
- [ ] Check provider status pages
- [ ] Check recent deployments
- [ ] Check Supabase logs

### 2. Assessment
**Determine Severity** (P0/P1/P2/P3)

**Gather Information**:
- [ ] What is failing?
- [ ] How many users affected?
- [ ] When did it start?
- [ ] Any recent changes?
- [ ] Is data at risk?

### 3. Response

#### For P0 - Critical
```bash
# 1. Check health endpoint
curl https://znkkpibjlifhqvtnghsd.supabase.co/functions/v1/health

# 2. Check Supabase Dashboard
# Open: https://supabase.com/dashboard/project/znkkpibjlifhqvtnghsd

# 3. Check recent deployments
git log -10 --oneline

# 4. If recent deployment caused issue, consider rollback
# (Coordinate with Lovable support)

# 5. Check Edge Function logs in Supabase
# Navigate to: Edge Functions > Logs

# 6. Check database connectivity
# Navigate to: Database > Query Editor
# Run: SELECT 1;
```

#### For P1 - High
```bash
# 1. Identify which component is failing
curl https://znkkpibjlifhqvtnghsd.supabase.co/functions/v1/health | jq

# 2. Check provider health
# Review dashboard at: https://lumenorca.app/dashboard

# 3. Check error logs
# Supabase Dashboard > Edge Functions > llm-proxy > Logs

# 4. Attempt provider failover if needed
# System should auto-failover, but verify in logs

# 5. Check rate limiting
# Review 429 errors in logs
```

#### For P2/P3 - Medium/Low
```bash
# 1. Create GitHub issue
gh issue create --title "Bug: [Description]" --body "[Details]"

# 2. Add to project board
# 3. Schedule for next sprint
# 4. Notify affected users (if applicable)
```

### 4. Communication

#### Internal Communication
- Create incident channel (Slack, Discord, etc.)
- Post status updates every 30 minutes
- Document actions taken

#### External Communication
**For P0/P1 incidents**:
- Post status to status page (if configured)
- Update homepage with banner (if extended outage)
- Email affected users (if applicable)

**Template**:
```
Subject: [Lumen-Orca] Service Incident - [Description]

We are currently experiencing [issue description].

Impact: [What users will experience]
Status: [Investigating/Identified/Monitoring/Resolved]
ETA: [Expected resolution time]

We will provide updates every 30 minutes.

Thank you for your patience.
```

### 5. Resolution
- [ ] Implement fix
- [ ] Test in staging (if available)
- [ ] Deploy to production
- [ ] Verify health endpoint
- [ ] Verify affected functionality
- [ ] Monitor for 30 minutes
- [ ] Update status communications

### 6. Post-Mortem
**Required for P0/P1, optional for P2/P3**

**Create Post-Mortem Document**:
```markdown
# Incident Post-Mortem: [Title]

## Incident Summary
- **Date**: YYYY-MM-DD
- **Duration**: X hours Y minutes
- **Severity**: P0/P1/P2/P3
- **Impact**: [Number of users affected, features impacted]

## Timeline
- HH:MM - Incident detected
- HH:MM - Initial response
- HH:MM - Root cause identified
- HH:MM - Fix deployed
- HH:MM - Incident resolved

## Root Cause
[Detailed explanation of what caused the incident]

## Resolution
[What was done to fix the issue]

## Action Items
- [ ] Prevent recurrence: [Action]
- [ ] Improve detection: [Action]
- [ ] Improve response: [Action]
- [ ] Documentation updates: [Action]

## Lessons Learned
- What went well
- What could be improved
- What we learned
```

---

## 🛠️ Common Incident Scenarios

### Scenario 1: Database Connection Failure

**Symptoms**:
- Health endpoint returns `database.status: 'error'`
- 500 errors on all authenticated routes
- Edge functions timing out

**Response**:
```bash
# 1. Check Supabase status
open https://status.supabase.com/

# 2. Check connection pool
# Supabase Dashboard > Database > Connection Pooling

# 3. Verify RLS policies not blocking service role
# Dashboard > Authentication > Policies

# 4. Check for long-running queries
# Dashboard > Database > Query Performance

# 5. If persistent, contact Supabase support
```

**Prevention**:
- Monitor connection pool usage
- Optimize slow queries
- Implement connection retry logic

---

### Scenario 2: All LLM Providers Down

**Symptoms**:
- Health endpoint returns `providers.status: 'error'`
- LLM proxy returning 500 errors
- `provider_health` table shows all providers down

**Response**:
```bash
# 1. Check provider status pages
# OpenAI: https://status.openai.com/
# Anthropic: https://status.anthropic.com/
# Google: https://status.cloud.google.com/

# 2. Verify API keys are valid
# Check Supabase secrets: Dashboard > Edge Functions > Settings

# 3. Check budget limits
# Query: SELECT * FROM budget_settings;

# 4. Check rate limiting
# Review 429 errors in llm-proxy logs

# 5. If API keys expired, rotate immediately
```

**Prevention**:
- Monitor provider status proactively
- Set up alerts for provider health changes
- Implement provider health dashboard
- Calendar reminders for API key rotation

---

### Scenario 3: Authentication Failures

**Symptoms**:
- Users cannot log in
- 401 errors on authenticated routes
- JWT validation failures

**Response**:
```bash
# 1. Check Supabase Auth status
# Dashboard > Authentication > Users

# 2. Verify JWT secret hasn't changed
# Dashboard > Settings > API

# 3. Check for rate limiting on auth endpoints
# Dashboard > Authentication > Rate Limits

# 4. Test login flow manually
# Try: Email/password and Google OAuth

# 5. Check RLS policies
# Dashboard > Authentication > Policies
```

**Prevention**:
- Monitor auth error rates
- Test auth flows in CI/CD
- Keep backup admin accounts

---

### Scenario 4: Rate Limit Abuse

**Symptoms**:
- High number of 429 errors
- Specific IP making excessive requests
- Budget approaching limits rapidly

**Response**:
```bash
# 1. Identify abusive IPs in logs
# Filter llm-proxy logs for 429 responses

# 2. Check if legitimate traffic spike
# Review llm_usage_logs for patterns

# 3. If abuse, consider IP blocking
# (Implement at Supabase or Cloudflare level)

# 4. Review and adjust rate limits if needed
# Update rate-limit.ts configuration

# 5. Monitor budget impact
# Query: SELECT * FROM budget_settings;
```

**Prevention**:
- Implement stricter rate limits
- Add API key authentication
- Monitor for unusual traffic patterns
- Consider CAPTCHA for public endpoints

---

### Scenario 5: Deployment Failure

**Symptoms**:
- Build fails in CI/CD
- Deployment stuck or failed
- New code not reflecting on site

**Response**:
```bash
# 1. Check GitHub Actions
open https://github.com/hwinnwin/Lumen-Orca/actions

# 2. Review build logs
# Click on failed workflow run

# 3. Check Lovable deployment status
# Lovable Dashboard > Deployments

# 4. If deployment stuck, contact Lovable support

# 5. If critical, consider manual deployment
# (Follow Lovable manual deployment docs)
```

**Prevention**:
- Test builds locally before pushing
- Implement pre-push hooks
- Monitor deployment status
- Keep rollback procedure documented

---

## 📚 Runbooks

### Runbook: Quick Health Check
```bash
#!/bin/bash
# Quick health check script

echo "=== Lumen-Orca Health Check ==="

# 1. Check health endpoint
echo "Checking health endpoint..."
HEALTH=$(curl -s https://znkkpibjlifhqvtnghsd.supabase.co/functions/v1/health)
echo "$HEALTH" | jq '.status'

# 2. Check homepage
echo "Checking homepage..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://lumenorca.app/)
echo "Homepage: $HTTP_CODE"

# 3. Check sitemap
echo "Checking sitemap..."
SITEMAP=$(curl -s -o /dev/null -w "%{http_code}" https://lumenorca.app/sitemap.xml)
echo "Sitemap: $SITEMAP"

# 4. Summary
echo "=== Summary ==="
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ All systems operational"
else
  echo "❌ Service degraded or down"
fi
```

### Runbook: Provider Health Check
```sql
-- Run in Supabase SQL Editor

-- Check provider health
SELECT
  provider,
  status,
  consecutive_failures,
  last_success_at,
  last_failure_at,
  EXTRACT(EPOCH FROM (NOW() - last_success_at))/60 as minutes_since_success
FROM provider_health
ORDER BY status DESC, consecutive_failures DESC;

-- Check recent usage
SELECT
  provider,
  COUNT(*) as requests,
  AVG(latency_ms) as avg_latency,
  SUM(estimated_cost) as total_cost
FROM llm_usage_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY provider;
```

### Runbook: Budget Check
```sql
-- Check budget status

SELECT
  provider,
  monthly_budget,
  current_spend,
  (current_spend / monthly_budget * 100) as percent_used,
  alert_threshold * 100 as alert_at_percent,
  CASE
    WHEN current_spend >= monthly_budget THEN '🔴 BUDGET EXCEEDED'
    WHEN current_spend >= monthly_budget * alert_threshold THEN '🟡 ALERT THRESHOLD'
    ELSE '🟢 OK'
  END as status
FROM budget_settings
ORDER BY percent_used DESC;
```

---

## 🔄 Recovery Procedures

### Database Recovery
```bash
# If database issues persist:

# 1. Check Supabase Dashboard
# 2. Review recent migrations
# 3. Consider rolling back migration if recent
# 4. Contact Supabase support for serious issues
# 5. Restore from backup (Supabase Pro feature)
```

### Edge Function Recovery
```bash
# If edge functions failing:

# 1. Check function logs
# 2. Verify environment variables
# 3. Test function locally (if using Supabase CLI)
# 4. Redeploy function
# 5. Monitor logs after deployment
```

### Frontend Recovery
```bash
# If frontend issues:

# 1. Check browser console for errors
# 2. Verify API endpoints responding
# 3. Clear browser cache
# 4. Test in incognito mode
# 5. Redeploy via Lovable
```

---

## 📋 Checklist: After Every Incident

- [ ] Incident resolved and verified
- [ ] Status communications updated
- [ ] Post-mortem scheduled (P0/P1)
- [ ] Action items created
- [ ] Documentation updated
- [ ] Monitoring improved
- [ ] Prevention measures implemented
- [ ] Team debriefed

---

## 🎓 Training & Preparedness

### Monthly Drills
- Practice incident response workflow
- Review runbooks
- Test recovery procedures
- Update contact information

### Quarterly Reviews
- Review all incidents
- Analyze trends
- Update runbooks
- Improve monitoring

---

*This incident response plan should be reviewed and updated quarterly, or after every major incident.*
