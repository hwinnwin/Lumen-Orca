-- Builder tables for AI App Builder pipeline
CREATE TABLE IF NOT EXISTS public.builds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'specifying', 'generating', 'deploying', 'live', 'failed')),
  spec jsonb,
  generated_files jsonb,
  preview_url text,
  error jsonb,
  llm_cost numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.build_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id uuid NOT NULL REFERENCES public.builds(id) ON DELETE CASCADE,
  agent text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  input jsonb,
  output jsonb,
  tokens_used integer DEFAULT 0,
  cost numeric DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_builds_user_id ON public.builds(user_id);
CREATE INDEX idx_builds_status ON public.builds(status);
CREATE INDEX idx_builds_active ON public.builds(status) WHERE status NOT IN ('live', 'failed');
CREATE INDEX idx_build_steps_build_id ON public.build_steps(build_id);

-- Auto-update updated_at on every UPDATE
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER builds_updated_at BEFORE UPDATE ON public.builds
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER build_steps_updated_at BEFORE UPDATE ON public.build_steps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE public.builds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.build_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own builds"
  ON public.builds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create builds"
  ON public.builds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to builds"
  ON public.builds FOR ALL
  USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own build steps"
  ON public.build_steps FOR SELECT
  USING (
    build_id IN (SELECT id FROM public.builds WHERE user_id = auth.uid())
  );

CREATE POLICY "Service role full access to build_steps"
  ON public.build_steps FOR ALL
  USING (auth.role() = 'service_role');

-- Enable Realtime for live frontend subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.builds;
ALTER PUBLICATION supabase_realtime ADD TABLE public.build_steps;
