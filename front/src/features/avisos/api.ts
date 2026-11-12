import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { components } from '@/lib/api.generated';

export type Aviso = components['schemas']['Aviso'];
export type Comentario = components['schemas']['Comentario'];

const AVISOS_POR_PAGINA = 10;

/** O mural carrega os avisos de dez em dez; o total vem no cabeçalho X-Total-Count. */
export function useAvisos(turmaId: string) {
  return useInfiniteQuery({
    queryKey: ['avisos', turmaId],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data, response } = await api.GET('/turmas/{turmaId}/avisos', {
        params: { path: { turmaId }, query: { limite: AVISOS_POR_PAGINA, deslocamento: pageParam } },
      });
      const itens = data ?? [];
      return { itens, total: Number(response.headers.get('X-Total-Count') ?? itens.length) };
    },
    getNextPageParam: (ultima, todas) => {
      const carregados = todas.reduce((n, pagina) => n + pagina.itens.length, 0);
      return carregados < ultima.total ? carregados : undefined;
    },
    enabled: Boolean(turmaId),
  });
}

export function useCriarAviso(turmaId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (aviso: { texto: string; gruposIds?: string[]; alunosIds?: string[] }) => {
      const { data } = await api.POST('/turmas/{turmaId}/avisos', {
        params: { path: { turmaId } },
        body: aviso,
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
    mutationFn: async ({ avisoId, texto, comentarioPaiId }: { avisoId: string; texto: string; comentarioPaiId?: string }) => {
      const { data } = await api.POST('/avisos/{avisoId}/comentarios', {
        params: { path: { avisoId } },
        body: { texto, comentarioPaiId },
      });
      return data as Comentario;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['avisos', turmaId] });
    },
  });
}
