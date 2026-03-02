-- Fix search_path for increment_provider_spend function  
CREATE OR REPLACE FUNCTION public.increment_provider_spend(p_provider text, p_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE budget_settings
  SET current_spend = current_spend + p_amount,
      updated_at = NOW()
  WHERE provider = p_provider;
END;
$$;