import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { useMinhasAtividades } from '@/features/atividades/api';
import { FILTROS_VAZIOS } from '@/features/atividades/filtros';
import { calcularGamificacao } from './calcular-gamificacao';
import type { PerfilGamificacao } from './tipos';

export const GAMIFICACAO_KEY = ['gamificacao', 'perfil'] as const;

export function useGamificacao(): {
  perfil: PerfilGamificacao;
  carregando: boolean;
} {
  const { data: atividades = [], isLoading: carregandoAtividades } = useMinhasAtividades(FILTROS_VAZIOS);

  const perfilDerivado = useMemo(() => {
    return calcularGamificacao(atividades);
  }, [atividades]);

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

  return {
    perfil: perfilApi ?? perfilDerivado,
    carregando: carregandoAtividades && carregandoApi,
  };
}
