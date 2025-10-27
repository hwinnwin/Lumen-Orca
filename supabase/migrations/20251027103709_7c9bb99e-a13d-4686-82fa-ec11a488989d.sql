-- LLM Provider Configurations (Global + Per-Agent)
CREATE TABLE llm_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_role TEXT, -- NULL for global, specific role for per-agent override
  provider TEXT NOT NULL CHECK (provider IN ('lovable-ai', 'openai', 'anthropic', 'google')),
  model TEXT NOT NULL,
  fallback_provider TEXT CHECK (fallback_provider IN ('lovable-ai', 'openai', 'anthropic', 'google')),
  fallback_model TEXT,
  max_tokens INT DEFAULT 4096,
  temperature DECIMAL(3,2) DEFAULT 0.7,
  cache_ttl_seconds INT DEFAULT 3600,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_role, provider)
);

-- Usage Tracking for Cost Monitoring
CREATE TABLE llm_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_role TEXT NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  tokens_input INT NOT NULL,
  tokens_output INT NOT NULL,
  estimated_cost DECIMAL(10,6) NOT NULL,
  latency_ms INT NOT NULL,
  task_id TEXT,
  prompt_hash TEXT,
  cache_hit BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Budget Settings & Alerts
CREATE TABLE budget_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE,
  monthly_budget DECIMAL(10,2) NOT NULL,
  alert_threshold DECIMAL(3,2) DEFAULT 0.80,
  current_spend DECIMAL(10,2) DEFAULT 0.00,
  reset_date DATE NOT NULL,
  alerts_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provider Health Monitoring
CREATE TABLE provider_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL UNIQUE,
  status TEXT CHECK (status IN ('healthy', 'degraded', 'down')) DEFAULT 'healthy',
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  consecutive_failures INT DEFAULT 0,
  avg_latency_ms INT,
  success_rate DECIMAL(5,4),
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies (public access for now, add auth later)
ALTER TABLE llm_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_health ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for llm_configurations" ON llm_configurations FOR ALL USING (true);
CREATE POLICY "Allow all for llm_usage_logs" ON llm_usage_logs FOR ALL USING (true);
CREATE POLICY "Allow all for budget_settings" ON budget_settings FOR ALL USING (true);
CREATE POLICY "Allow all for provider_health" ON provider_health FOR ALL USING (true);

-- Helper function to update budget spend
CREATE OR REPLACE FUNCTION increment_provider_spend(p_provider TEXT, p_amount DECIMAL)
RETURNS VOID AS $$
BEGIN
  UPDATE budget_settings
  SET current_spend = current_spend + p_amount,
      updated_at = NOW()
  WHERE provider = p_provider;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default configurations
INSERT INTO llm_configurations (agent_role, provider, model, fallback_provider, fallback_model) VALUES
  (NULL, 'lovable-ai', 'google/gemini-2.5-flash', 'openai', 'gpt-5-mini'),
  ('A1_spec', 'lovable-ai', 'google/gemini-2.5-flash', NULL, NULL),
  ('A2_architect', 'lovable-ai', 'google/gemini-2.5-pro', 'openai', 'gpt-5'),
  ('A3_codegen_a', 'lovable-ai', 'google/gemini-2.5-pro', 'openai', 'gpt-5'),
  ('A4_codegen_b', 'lovable-ai', 'google/gemini-2.5-pro', 'openai', 'gpt-5'),
  ('A5_adjudicator', 'lovable-ai', 'google/gemini-2.5-pro', 'openai', 'gpt-5'),
  ('A6_qa_harness', 'lovable-ai', 'google/gemini-2.5-flash', NULL, NULL),
  ('A7_evidence', 'lovable-ai', 'google/gemini-2.5-flash-lite', NULL, NULL),
  ('A8_performance', 'lovable-ai', 'google/gemini-2.5-flash', NULL, NULL),
  ('A9_security', 'lovable-ai', 'google/gemini-2.5-pro', NULL, NULL),
  ('A10_incident', 'lovable-ai', 'google/gemini-2.5-flash', NULL, NULL);

INSERT INTO budget_settings (provider, monthly_budget, reset_date) VALUES
  ('lovable-ai', 100.00, DATE_TRUNC('month', NOW() + INTERVAL '1 month')),
  ('openai', 200.00, DATE_TRUNC('month', NOW() + INTERVAL '1 month')),
  ('anthropic', 150.00, DATE_TRUNC('month', NOW() + INTERVAL '1 month')),
  ('google', 100.00, DATE_TRUNC('month', NOW() + INTERVAL '1 month'));

INSERT INTO provider_health (provider) VALUES
  ('lovable-ai'), ('openai'), ('anthropic'), ('google');