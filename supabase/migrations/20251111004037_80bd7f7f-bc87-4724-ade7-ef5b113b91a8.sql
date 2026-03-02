-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow all for provider_health" ON public.provider_health;

-- Create admin-only access policies for provider_health
CREATE POLICY "Admins can view provider health"
ON public.provider_health
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert provider health"
ON public.provider_health
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update provider health"
ON public.provider_health
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete provider health"
ON public.provider_health
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));