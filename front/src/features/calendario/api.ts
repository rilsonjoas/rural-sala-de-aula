import { useQueries } from '@tanstack/react-query';
import { ATIVIDADES_KEY, useMinhasAtividades } from '@/features/atividades/api';
import { FILTROS_VAZIOS, paraConsultaDaTurma, type Atividade } from '@/features/atividades/filtros';
import { useTurmas } from '@/features/turmas/api';
import { api } from '@/lib/api-client';

/**
 * Atividades do calendário: as do aluno (nas turmas em que estuda) e as das turmas que o usuário leciona
 * (só quem leciona recebe o código da turma). A mesma pessoa pode ser as duas coisas; o resultado não repete atividades.
 */
export function useAtividadesDoCalendario() {
  const minhas = useMinhasAtividades(FILTROS_VAZIOS);
  const turmas = useTurmas();
  const lecionadas = (turmas.data ?? []).filter((t) => t.codigo != null);
  const dasTurmas = useQueries({
    queries: lecionadas.map((t) => ({
      queryKey: [...ATIVIDADES_KEY, 'turma', t.id, FILTROS_VAZIOS],
      queryFn: async () =>
        (await api.GET('/turmas/{turmaId}/atividades', { params: { path: { turmaId: t.id }, query: paraConsultaDaTurma(FILTROS_VAZIOS) } }))
          .data ?? [],
    })),
  });

  const consultas = [minhas, turmas, ...dasTurmas];
  const porId = new Map<string, Atividade>();
  for (const a of [...(minhas.data ?? []), ...dasTurmas.flatMap((q) => q.data ?? [])]) porId.set(a.id, a);

  return {
    data: [...porId.values()],
    isPending: consultas.some((q) => q.isPending),
    isError: consultas.some((q) => q.isError),
    isSuccess: consultas.every((q) => q.isSuccess),
    refetch: () => Promise.all(consultas.map((q) => q.refetch())),
  };
}
