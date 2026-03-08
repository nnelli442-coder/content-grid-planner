
-- Table for manual monthly Meta account-level KPIs
CREATE TABLE public.meta_metricas_cuenta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  mes integer NOT NULL,
  anio integer NOT NULL,
  seguidores_totales integer DEFAULT 0,
  seguidores_nuevos integer DEFAULT 0,
  alcance_cuenta integer DEFAULT 0,
  impresiones_cuenta integer DEFAULT 0,
  visitas_perfil integer DEFAULT 0,
  clics_sitio_web integer DEFAULT 0,
  engagement_cuenta integer DEFAULT 0,
  er_cuenta numeric DEFAULT 0,
  inversion_total numeric DEFAULT 0,
  notas text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, mes, anio)
);

ALTER TABLE public.meta_metricas_cuenta ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view own meta_metricas_cuenta" ON public.meta_metricas_cuenta FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meta_metricas_cuenta" ON public.meta_metricas_cuenta FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meta_metricas_cuenta" ON public.meta_metricas_cuenta FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all meta_metricas_cuenta" ON public.meta_metricas_cuenta FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can insert all meta_metricas_cuenta" ON public.meta_metricas_cuenta FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can update all meta_metricas_cuenta" ON public.meta_metricas_cuenta FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Supervisor can view all meta_metricas_cuenta" ON public.meta_metricas_cuenta FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'supervisor'::app_role));

-- updated_at trigger
CREATE TRIGGER update_meta_metricas_cuenta_updated_at BEFORE UPDATE ON public.meta_metricas_cuenta FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
