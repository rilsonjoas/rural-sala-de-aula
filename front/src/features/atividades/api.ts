import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { components } from '@/lib/api.generated';
import { paraConsulta, paraConsultaDaTurma, type Filtros } from './filtros';

export type AtividadeInput = components['schemas']['AtividadeInput'];
export type AtividadeDetalhe = components['schemas']['AtividadeDetalhe'];

export const ATIVIDADES_KEY = ['atividades'] as const;

export function useAtividadesDaTurma(turmaId: string, filtros: Filtros) {
  const consulta = paraConsultaDaTurma(filtros);
  return useQuery({
    queryKey: [...ATIVIDADES_KEY, 'turma', turmaId, filtros],
    queryFn: async () =>
      (await api.GET('/turmas/{turmaId}/atividades', { params: { path: { turmaId }, query: consulta } })).data ?? [],
  });
}

export function useMinhasAtividades(filtros: Filtros) {
  return useQuery({
    queryKey: [...ATIVIDADES_KEY, 'minhas', filtros],
    queryFn: async () => (await api.GET('/atividades', { params: { query: paraConsulta(filtros) } })).data ?? [],
  });
}

export function useAtividade(atividadeId: string) {
  return useQuery({
    queryKey: [...ATIVIDADES_KEY, 'detalhe', atividadeId],
    queryFn: async () =>
      (await api.GET('/atividades/{atividadeId}', { params: { path: { atividadeId } } })).data!,
    retry: false,
  });
}

export function useAtualizarAtividade(atividadeId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (corpo: AtividadeInput) =>
      (await api.PUT('/atividades/{atividadeId}', { params: { path: { atividadeId } }, body: corpo })).data!,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ATIVIDADES_KEY }),
  });
}

export function useCriarAtividade(turmaId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (corpo: AtividadeInput) =>
      (await api.POST('/turmas/{turmaId}/atividades', { params: { path: { turmaId } }, body: corpo })).data!,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ATIVIDADES_KEY }),
  });
}
