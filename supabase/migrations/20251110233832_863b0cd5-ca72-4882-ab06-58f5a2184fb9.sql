-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow all for llm_configurations" ON public.llm_configurations;

-- Create admin-only access policies for llm_configurations
CREATE POLICY "Admins can view llm configurations"
ON public.llm_configurations
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert llm configurations"
ON public.llm_configurations
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update llm configurations"
ON public.llm_configurations
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete llm configurations"
ON public.llm_configurations
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));