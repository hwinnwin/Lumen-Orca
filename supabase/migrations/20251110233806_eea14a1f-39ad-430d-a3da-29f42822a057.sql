-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Allow all for budget_settings" ON public.budget_settings;

-- Create admin-only access policies for budget_settings
CREATE POLICY "Admins can view budget settings"
ON public.budget_settings
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert budget settings"
ON public.budget_settings
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update budget settings"
ON public.budget_settings
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete budget settings"
ON public.budget_settings
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));