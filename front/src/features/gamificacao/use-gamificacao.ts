import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useMinhasAtividades } from '@/features/atividades/api';
import { FILTROS_VAZIOS } from '@/features/atividades/filtros';
import { useTurmas } from '@/features/turmas/api';
import { calcularGamificacao } from './calcular-gamificacao';
import { calcularDocente } from './calcular-docente';
import type { PerfilGamificacao } from './tipos';

export const GAMIFICACAO_KEY = ['gamificacao', 'perfil'] as const;

export function useGamificacao(): {
  perfil: PerfilGamificacao;
  carregando: boolean;
  ehProfessor: boolean;
  ehEstudante: boolean;
} {
  const { data: turmas = [], isLoading: carregandoTurmas } = useTurmas();
  const { data: atividades = [], isLoading: carregandoAtividades } = useMinhasAtividades(FILTROS_VAZIOS);

  const turmasDocente = useMemo(() => turmas.filter((t) => Boolean(t.codigo)), [turmas]);
  const ehProfessor = turmasDocente.length > 0;
  // ehEstudante: tem turmas sem código ou tem atividades como aluno, ou não é professor (padrão inicial)
  const ehEstudante = turmas.some((t) => !t.codigo) || atividades.length > 0 || !ehProfessor;

  const perfilDerivado = useMemo(() => {
    const base = calcularGamificacao(atividades);
    if (ehProfessor) {
      base.docente = calcularDocente({
        turmasLecionadas: turmasDocente.length,
        atividadesPorTurma: 0,
        tiposDistintos: 0,
        avaliacoesRealizadas: 0,
        feedbacksComComentario: 0,
        respostasNoMural: 0,
        teveAtividadeComTodasAvaliadas: false,
      });
    }
    return base;
  }, [atividades, ehProfessor, turmasDocente.length]);

  // Consulta o endpoint de API se disponível (MSW ou back-end)
  const { data: perfilApi, isLoading: carregandoApi } = useQuery({
    queryKey: GAMIFICACAO_KEY,
    queryFn: async () => {
      const resp = await api.GET('/gamificacao/perfil');
      if (resp.error) throw resp.error;
      return resp.data;
    },
    retry: false,
  });

  const perfilFinal = useMemo(() => {
    if (perfilApi) {
      if (!perfilApi.docente && perfilDerivado.docente) {
        return { ...perfilApi, docente: perfilDerivado.docente };
      }
      return perfilApi;
    }
    return perfilDerivado;
  }, [perfilApi, perfilDerivado]);

  return {
    perfil: perfilFinal,
    carregando: (carregandoAtividades || carregandoTurmas) && carregandoApi,
    ehProfessor,
    ehEstudante,
  };
}
