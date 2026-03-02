-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow all for llm_usage_logs" ON public.llm_usage_logs;

-- Create admin-only access policies for llm_usage_logs
CREATE POLICY "Admins can view llm usage logs"
ON public.llm_usage_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert llm usage logs"
ON public.llm_usage_logs
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update llm usage logs"
ON public.llm_usage_logs
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete llm usage logs"
ON public.llm_usage_logs
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));