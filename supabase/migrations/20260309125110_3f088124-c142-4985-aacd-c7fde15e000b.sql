
CREATE TABLE public.meta_campanas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  inicio_informe date NOT NULL,
  fin_informe date NOT NULL,
  nombre_campana text NOT NULL,
  entrega text,
  resultados integer DEFAULT 0,
  indicador_resultado text,
  costo_por_resultado numeric DEFAULT 0,
  presupuesto_conjunto text,
  tipo_presupuesto text,
  importe_gastado numeric DEFAULT 0,
  impresiones integer DEFAULT 0,
  alcance integer DEFAULT 0,
  finalizacion text,
  configuracion_atribucion text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.meta_campanas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meta_campanas" ON public.meta_campanas FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meta_campanas" ON public.meta_campanas FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meta_campanas" ON public.meta_campanas FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meta_campanas" ON public.meta_campanas FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all meta_campanas" ON public.meta_campanas FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin can manage meta_campanas" ON public.meta_campanas FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Supervisor can view all meta_campanas" ON public.meta_campanas FOR SELECT TO authenticated USING (has_role(auth.uid(), 'supervisor'::app_role));
