import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MetaMetricasCuenta {
  id: string;
  user_id: string;
  mes: number;
  anio: number;
  seguidores_totales: number;
  seguidores_nuevos: number;
  alcance_cuenta: number;
  impresiones_cuenta: number;
  visitas_perfil: number;
  clics_sitio_web: number;
  engagement_cuenta: number;
  er_cuenta: number;
  inversion_total: number;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export function useMetaMetricasCuenta(mes: number, anio: number) {
  return useQuery({
    queryKey: ['meta_metricas_cuenta', mes, anio],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('meta_metricas_cuenta' as any)
        .select('*')
        .eq('mes', mes)
        .eq('anio', anio)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as MetaMetricasCuenta | null;
    },
  });
}

export function useUpsertMetaMetricasCuenta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<MetaMetricasCuenta, 'id' | 'created_at' | 'updated_at'>) => {
      // Check if record exists
      const { data: existing } = await supabase
        .from('meta_metricas_cuenta' as any)
        .select('id')
        .eq('mes', input.mes)
        .eq('anio', input.anio)
        .eq('user_id', input.user_id)
        .maybeSingle();

      if (existing) {
        const { id, ...rest } = { id: (existing as any).id, ...input };
        const { user_id, mes, anio, ...updates } = rest;
        const { data, error } = await supabase
          .from('meta_metricas_cuenta' as any)
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('meta_metricas_cuenta' as any)
          .insert(input)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['meta_metricas_cuenta'] }),
  });
}
