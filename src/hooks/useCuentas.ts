import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Cuenta {
  id: string;
  nombre: string;
  created_at: string;
  updated_at: string;
}

export function useCuentas() {
  return useQuery({
    queryKey: ['cuentas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cuentas')
        .select('*')
        .order('nombre', { ascending: true });
      if (error) throw error;
      return data as Cuenta[];
    },
  });
}

export function useCreateCuenta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (nombre: string) => {
      const { data, error } = await supabase.from('cuentas').insert({ nombre }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cuentas'] }),
  });
}

export function useUpdateCuenta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, nombre }: { id: string; nombre: string }) => {
      const { data, error } = await supabase.from('cuentas').update({ nombre }).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cuentas'] }),
  });
}

export function useDeleteCuenta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cuentas').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cuentas'] }),
  });
}
