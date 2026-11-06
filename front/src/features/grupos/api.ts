import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { components } from '@/lib/api.generated';

export type Grupo = components['schemas']['Grupo'];
export type ConfiguracaoDeGrupos = components['schemas']['ConfiguracaoDeGrupos'];
export type IntegranteDeGrupo = components['schemas']['IntegranteDeGrupo'];

export const GRUPOS_KEY = ['grupos'] as const;

export function useGrupos(turmaId: string) {
  return useQuery({
    queryKey: [...GRUPOS_KEY, turmaId, 'lista'],
    queryFn: async () => (await api.GET('/turmas/{turmaId}/grupos', { params: { path: { turmaId } } })).data ?? [],
  });
}

export function useConfiguracaoDeGrupos(turmaId: string) {
  return useQuery({
    queryKey: [...GRUPOS_KEY, turmaId, 'configuracao'],
    queryFn: async () => (await api.GET('/turmas/{turmaId}/grupos/configuracao', { params: { path: { turmaId } } })).data!,
  });
}

export function useAlunosDaTurma(turmaId: string, habilitado: boolean) {
  return useQuery({
    queryKey: [...GRUPOS_KEY, turmaId, 'alunos'],
    queryFn: async () => (await api.GET('/turmas/{turmaId}/alunos', { params: { path: { turmaId } } })).data ?? [],
    enabled: habilitado,
  });
}

function useMutacao<V>(turmaId: string, fn: (valores: V) => Promise<unknown>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...GRUPOS_KEY, turmaId] }),
  });
}

export const useSolicitarGrupo = (turmaId: string) =>
  useMutacao(turmaId, async (corpo: { nome: string; integrantesIds: string[] }) =>
    (await api.POST('/turmas/{turmaId}/grupos', { params: { path: { turmaId } }, body: corpo })).data!,
  );

export const useDecidirGrupo = (turmaId: string) =>
  useMutacao(turmaId, async ({ grupoId, aprovado }: { grupoId: string; aprovado: boolean }) =>
    (await api.POST('/grupos/{grupoId}/aprovacao', { params: { path: { grupoId } }, body: { aprovado } })).data!,
  );

export const useEntrarNoGrupo = (turmaId: string) =>
  useMutacao(turmaId, async (grupoId: string) =>
    (await api.POST('/grupos/{grupoId}/integrantes', { params: { path: { grupoId } } })).data!,
  );

export const useSairDoGrupo = (turmaId: string) =>
  useMutacao(turmaId, async (grupoId: string) => {
    await api.DELETE('/grupos/{grupoId}/integrantes', { params: { path: { grupoId } } });
  });

export const useSalvarConfiguracao = (turmaId: string) =>
  useMutacao(turmaId, async (corpo: ConfiguracaoDeGrupos) =>
    (await api.PUT('/turmas/{turmaId}/grupos/configuracao', { params: { path: { turmaId } }, body: corpo })).data!,
  );

export function textoDasRegras({ minimoIntegrantes, maximoIntegrantes, maximoGrupos }: ConfiguracaoDeGrupos): string {
  const tamanho = minimoIntegrantes === maximoIntegrantes ? `${minimoIntegrantes} integrantes` : `${minimoIntegrantes} a ${maximoIntegrantes} integrantes`;
  return `Grupos de ${tamanho} · ${maximoGrupos == null ? 'sem limite de grupos' : `até ${maximoGrupos} ${maximoGrupos === 1 ? 'grupo' : 'grupos'} na turma`}`;
}
