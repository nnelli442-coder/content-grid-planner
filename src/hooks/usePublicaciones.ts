import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Publicacion = Tables<'publicaciones'>;
export type PublicacionInsert = TablesInsert<'publicaciones'>;
export type PublicacionUpdate = TablesUpdate<'publicaciones'>;

export const REDES_SOCIALES = ['Instagram', 'Facebook', 'TikTok', 'Twitter/X', 'LinkedIn', 'YouTube', 'Pinterest'] as const;
export const TIPOS_CONTENIDO = ['Post', 'Reel', 'Story', 'Carrusel', 'Video', 'Live', 'Blog', 'Newsletter'] as const;
export const ESTADOS = ['Borrador', 'En revisión', 'Aprobado', 'Publicado', 'Rechazado'] as const;
export const COLORES_PREDEFINIDOS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#6366F1', '#14B8A6',
] as const;

export function usePublicaciones(month: number, year: number) {
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = new Date(year, month + 1, 0);
  const endDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

  return useQuery({
    queryKey: ['publicaciones', month, year],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('publicaciones')
        .select('*')
        .gte('fecha', startDate)
        .lte('fecha', endDateStr)
        .order('fecha', { ascending: true });
      if (error) throw error;
      return data as Publicacion[];
    },
  });
}

export function useCreatePublicacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pub: PublicacionInsert) => {
      const { data, error } = await supabase.from('publicaciones').insert(pub).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['publicaciones'] }),
  });
}

export function useUpdatePublicacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: PublicacionUpdate & { id: string }) => {
      const { data, error } = await supabase.from('publicaciones').update(updates).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['publicaciones'] }),
  });
}

export function useDeletePublicacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('publicaciones').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['publicaciones'] }),
  });
}

export function useDuplicatePublicacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (pub: Publicacion) => {
      const { id, created_at, updated_at, ...rest } = pub;
      const { data, error } = await supabase.from('publicaciones').insert({ ...rest, titulo: `${rest.titulo} (copia)` }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['publicaciones'] }),
  });
}

export function useMovePublicacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, fecha }: { id: string; fecha: string }) => {
      const { error } = await supabase.from('publicaciones').update({ fecha }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['publicaciones'] }),
  });
}
