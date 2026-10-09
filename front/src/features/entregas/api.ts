import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { components } from '@/lib/api.generated';
import { ATIVIDADES_KEY } from '@/features/atividades/api';
import { TURMAS_KEY } from '@/features/turmas/api';
import { enviarEntrega } from './enviar-entrega';

export type Entrega = components['schemas']['Entrega'];

export const ENTREGAS_KEY = ['entregas'] as const;

export function useEntregas(atividadeId: string) {
  return useQuery({
    queryKey: [...ENTREGAS_KEY, atividadeId],
    queryFn: async () =>
      (await api.GET('/atividades/{atividadeId}/entregas', { params: { path: { atividadeId } } })).data ?? [],
  });
}

export function useAvaliarEntrega() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ entregaId, nota, comentarioPrivado }: { entregaId: string; nota: number; comentarioPrivado?: string }) =>
      (
        await api.PUT('/entregas/{entregaId}/avaliacao', {
          params: { path: { entregaId } },
          body: { nota, ...(comentarioPrivado ? { comentarioPrivado } : {}) },
        })
      ).data!,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ENTREGAS_KEY });
      void queryClient.invalidateQueries({ queryKey: ATIVIDADES_KEY });
    },
  });
}

/** Baixa o arquivo da entrega mantendo o nome original. */
export async function baixarEntrega(entrega: Pick<Entrega, 'id' | 'nomeOriginal'>) {
  const { data } = await api.GET('/entregas/{entregaId}/arquivo', {
    params: { path: { entregaId: entrega.id } },
    parseAs: 'blob',
  });
  const url = URL.createObjectURL(data as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = entrega.nomeOriginal;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function useEnviarEntrega(atividadeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (arquivo: File) => (await enviarEntrega(atividadeId, arquivo)).data!,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ATIVIDADES_KEY });
      void queryClient.invalidateQueries({ queryKey: TURMAS_KEY });
    },
  });
}
