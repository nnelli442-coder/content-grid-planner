import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MetaCampana {
  id: string;
  user_id: string;
  inicio_informe: string;
  fin_informe: string;
  nombre_campana: string;
  entrega: string | null;
  resultados: number;
  indicador_resultado: string | null;
  costo_por_resultado: number;
  presupuesto_conjunto: string | null;
  tipo_presupuesto: string | null;
  importe_gastado: number;
  impresiones: number;
  alcance: number;
  finalizacion: string | null;
  configuracion_atribucion: string | null;
}

export function useMetaCampanas() {
  return useQuery({
    queryKey: ['meta_campanas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meta_campanas' as any)
        .select('*')
        .order('importe_gastado', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as MetaCampana[];
    },
  });
}
