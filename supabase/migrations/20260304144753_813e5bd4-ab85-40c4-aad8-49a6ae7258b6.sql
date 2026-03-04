-- Supervisor can view all publicaciones
CREATE POLICY "Supervisor can view all publicaciones"
ON public.publicaciones
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'supervisor'::app_role));

-- Supervisor can view all estrategias
CREATE POLICY "Supervisor can view all estrategias"
ON public.estrategias
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'supervisor'::app_role));

-- Supervisor can view all cuentas (already has public select, but explicit)
-- Supervisor can view all profiles
CREATE POLICY "Supervisor can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'supervisor'::app_role));
