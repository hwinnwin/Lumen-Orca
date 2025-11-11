-- Create rate_limit_config table for configurable thresholds
CREATE TABLE IF NOT EXISTS public.rate_limit_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint text NOT NULL UNIQUE,
  max_attempts integer NOT NULL DEFAULT 5,
  window_minutes integer NOT NULL DEFAULT 15,
  block_duration_minutes integer NOT NULL DEFAULT 60,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default rate limit configurations
INSERT INTO public.rate_limit_config (endpoint, max_attempts, window_minutes, block_duration_minutes)
VALUES 
  ('auth_login', 5, 15, 60),
  ('auth_signup', 10, 60, 30),
  ('mfa_verify', 3, 15, 120)
ON CONFLICT (endpoint) DO NOTHING;

-- Create rate_limit_attempts table for tracking attempts
CREATE TABLE IF NOT EXISTS public.rate_limit_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  endpoint text NOT NULL,
  attempts integer NOT NULL DEFAULT 1,
  first_attempt_at timestamptz NOT NULL DEFAULT now(),
  last_attempt_at timestamptz NOT NULL DEFAULT now(),
  blocked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(ip_address, endpoint)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip_endpoint ON public.rate_limit_attempts(ip_address, endpoint);
CREATE INDEX IF NOT EXISTS idx_rate_limit_blocked ON public.rate_limit_attempts(blocked_until) WHERE blocked_until IS NOT NULL;

-- Enable RLS
ALTER TABLE public.rate_limit_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rate_limit_config (admin only)
CREATE POLICY "Admins can view rate limit config"
ON public.rate_limit_config
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update rate limit config"
ON public.rate_limit_config
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for rate_limit_attempts (admin only)
CREATE POLICY "Admins can view rate limit attempts"
ON public.rate_limit_attempts
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage rate limit attempts"
ON public.rate_limit_attempts
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Function to clean up old rate limit attempts
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_attempts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete attempts older than 7 days that are not blocked
  DELETE FROM public.rate_limit_attempts
  WHERE last_attempt_at < NOW() - INTERVAL '7 days'
    AND (blocked_until IS NULL OR blocked_until < NOW());
END;
$$;