import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { components } from '@/lib/api.generated';

export type Comentario = components['schemas']['Comentario'];

export function useComentariosAtividade(atividadeId: string) {
  return useQuery({
    queryKey: ['comentarios-atividade', atividadeId],
    queryFn: async () => {
      const { data } = await api.GET('/atividades/{atividadeId}/comentarios', {
        params: { path: { atividadeId } },
      });
      return data ?? [];
    },
    enabled: Boolean(atividadeId),
  });
}

export function useCriarComentarioAtividade(atividadeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ texto, comentarioPaiId }: { texto: string; comentarioPaiId?: string }) => {
      const { data } = await api.POST('/atividades/{atividadeId}/comentarios', {
        params: { path: { atividadeId } },
        body: { texto, comentarioPaiId },
      });
      return data as Comentario;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['comentarios-atividade', atividadeId] });
    },
  });
}
