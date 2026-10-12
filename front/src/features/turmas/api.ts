import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { components } from '@/lib/api.generated';

export type Turma = components['schemas']['Turma'];
export type TurmaInput = components['schemas']['TurmaInput'];

export const TURMAS_KEY = ['turmas'] as const;

export function useTurmas() {
  return useQuery({
    queryKey: TURMAS_KEY,
    queryFn: async () => (await api.GET('/turmas')).data ?? [],
  });
}

export function useCriarTurma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (corpo: TurmaInput) => (await api.POST('/turmas', { body: corpo })).data!,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TURMAS_KEY }),
  });
}

export function useEntrarNaTurma() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (codigo: string) => (await api.POST('/inscricoes', { body: { codigo } })).data!,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TURMAS_KEY }),
  });
}

export function useTurma(turmaId: string) {
  return useQuery({
    queryKey: ['turma', turmaId],
    queryFn: async () => (await api.GET('/turmas/{turmaId}', { params: { path: { turmaId } } })).data!,
    retry: false,
  });
}
