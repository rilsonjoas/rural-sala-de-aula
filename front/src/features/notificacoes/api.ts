import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { components } from '@/lib/api.generated';

export type Notificacao = components['schemas']['Notificacao'];
export type Notificacoes = components['schemas']['Notificacoes'];

const CHAVE = ['notificacoes'] as const;

/** Sem WebSocket: o sino consulta a cada 60 s e quando a janela volta ao foco. */
export function useNotificacoes() {
  return useQuery({
    queryKey: CHAVE,
    queryFn: async () => {
      const { data } = await api.GET('/notificacoes');
      return data as Notificacoes;
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useMarcarLida() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.POST('/notificacoes/{notificacaoId}/lida', { params: { path: { notificacaoId: id } } });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE }),
  });
}

export function useMarcarTodasLidas() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.POST('/notificacoes/lidas');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE }),
  });
}
