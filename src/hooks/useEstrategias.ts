import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Estrategia {
  id: string;
  user_id: string;
  mes: number;
  anio: number;
  objetivo_general: string | null;
  objetivos_especificos: string | null;
  segmento_principal: string | null;
  segmento_secundario: string | null;
  dolor_necesidad: string | null;
  mensaje_rector: string | null;
  concepto_creativo: string | null;
  created_at: string;
  updated_at: string;
}

export function useEstrategia(mes: number, anio: number) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['estrategia', mes, anio, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('estrategias')
        .select('*')
        .eq('user_id', user.id)
        .eq('mes', mes)
        .eq('anio', anio)
        .maybeSingle();
      if (error) throw error;
      return data as Estrategia | null;
    },
    enabled: !!user,
  });
}

export function useUpsertEstrategia() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (data: Partial<Estrategia> & { mes: number; anio: number }) => {
      if (!user) throw new Error('No user');
      const { data: existing } = await supabase
        .from('estrategias')
        .select('id')
        .eq('user_id', user.id)
        .eq('mes', data.mes)
        .eq('anio', data.anio)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('estrategias')
          .update({
            objetivo_general: data.objetivo_general,
            objetivos_especificos: data.objetivos_especificos,
            segmento_principal: data.segmento_principal,
            segmento_secundario: data.segmento_secundario,
            dolor_necesidad: data.dolor_necesidad,
            mensaje_rector: data.mensaje_rector,
            concepto_creativo: data.concepto_creativo,
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('estrategias')
          .insert({
            user_id: user.id,
            mes: data.mes,
            anio: data.anio,
            objetivo_general: data.objetivo_general || null,
            objetivos_especificos: data.objetivos_especificos || null,
            segmento_principal: data.segmento_principal || null,
            segmento_secundario: data.segmento_secundario || null,
            dolor_necesidad: data.dolor_necesidad || null,
            mensaje_rector: data.mensaje_rector || null,
            concepto_creativo: data.concepto_creativo || null,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['estrategia'] }),
  });
}
