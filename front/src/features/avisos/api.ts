import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { components } from '@/lib/api.generated';

export type Aviso = components['schemas']['Aviso'];
export type Comentario = components['schemas']['Comentario'];

export function useAvisos(turmaId: string) {
  return useQuery({
    queryKey: ['avisos', turmaId],
    queryFn: async () => {
      const { data } = await api.GET('/turmas/{turmaId}/avisos', {
        params: { path: { turmaId } },
      });
      return data ?? [];
    },
    enabled: Boolean(turmaId),
  });
}

export function useCriarAviso(turmaId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (texto: string) => {
      const { data } = await api.POST('/turmas/{turmaId}/avisos', {
        params: { path: { turmaId } },
        body: { texto },
      });
      return data as Aviso;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['avisos', turmaId] });
    },
  });
}

export function useCriarComentario(turmaId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ avisoId, texto }: { avisoId: string; texto: string }) => {
      const { data } = await api.POST('/avisos/{avisoId}/comentarios', {
        params: { path: { avisoId } },
        body: { texto },
      });
      return data as Comentario;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['avisos', turmaId] });
    },
  });
}
