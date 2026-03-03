
-- Create cuentas table for client accounts
CREATE TABLE public.cuentas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cuentas ENABLE ROW LEVEL SECURITY;

-- Only admin can manage cuentas
CREATE POLICY "Admin can view all cuentas"
ON public.cuentas FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can insert cuentas"
ON public.cuentas FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can update cuentas"
ON public.cuentas FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can delete cuentas"
ON public.cuentas FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Users can view cuentas (to select in forms)
CREATE POLICY "Users can view cuentas"
ON public.cuentas FOR SELECT
TO authenticated
USING (true);

-- Add cuenta_id to publicaciones
ALTER TABLE public.publicaciones ADD COLUMN cuenta_id UUID REFERENCES public.cuentas(id) ON DELETE SET NULL;

-- Trigger for updated_at
CREATE TRIGGER update_cuentas_updated_at
BEFORE UPDATE ON public.cuentas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
