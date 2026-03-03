
-- Tabla de estrategias mensuales
CREATE TABLE public.estrategias (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  mes INTEGER NOT NULL,
  anio INTEGER NOT NULL,
  objetivo_general TEXT,
  objetivos_especificos TEXT,
  segmento_principal TEXT,
  segmento_secundario TEXT,
  dolor_necesidad TEXT,
  mensaje_rector TEXT,
  concepto_creativo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, mes, anio)
);

ALTER TABLE public.estrategias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own estrategias" ON public.estrategias FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own estrategias" ON public.estrategias FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own estrategias" ON public.estrategias FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own estrategias" ON public.estrategias FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admin can view all estrategias" ON public.estrategias FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin can update all estrategias" ON public.estrategias FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_estrategias_updated_at BEFORE UPDATE ON public.estrategias FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Nuevas columnas de planificación en publicaciones
ALTER TABLE public.publicaciones
  ADD COLUMN campana TEXT,
  ADD COLUMN objetivo_post TEXT,
  ADD COLUMN pilar_contenido TEXT,
  ADD COLUMN etapa_funnel TEXT,
  ADD COLUMN hook TEXT,
  ADD COLUMN cta_texto TEXT,
  ADD COLUMN tipo_pauta TEXT DEFAULT 'Orgánico';

-- Columnas de ejecución
ALTER TABLE public.publicaciones
  ADD COLUMN copy_caption TEXT,
  ADD COLUMN referencia_visual TEXT,
  ADD COLUMN hashtags TEXT,
  ADD COLUMN duracion TEXT,
  ADD COLUMN presupuesto NUMERIC,
  ADD COLUMN segmentacion TEXT;

-- Columnas de medición
ALTER TABLE public.publicaciones
  ADD COLUMN alcance INTEGER,
  ADD COLUMN impresiones INTEGER,
  ADD COLUMN engagement INTEGER,
  ADD COLUMN er_porcentaje NUMERIC,
  ADD COLUMN guardados INTEGER,
  ADD COLUMN compartidos INTEGER,
  ADD COLUMN clics INTEGER,
  ADD COLUMN seguidores_nuevos INTEGER,
  ADD COLUMN costo NUMERIC,
  ADD COLUMN costo_por_resultado NUMERIC;
