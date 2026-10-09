import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { api } from '@/lib/api-client';
import { ApiError } from '@/lib/api-error';
import type { components } from '@/lib/api.generated';

export type Usuario = components['schemas']['Usuario'];

export const ME_QUERY_KEY = ['me'] as const;

async function buscarUsuario(): Promise<Usuario | null> {
  try {
    const { data } = await api.GET('/me');
    return data ?? null;
  } catch (erro) {
    // 401 em /me só quer dizer "ninguém logado".
    if (erro instanceof ApiError && erro.status === 401) return null;
    throw erro;
  }
}

export function useSession() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ME_QUERY_KEY, queryFn: buscarUsuario, retry: false, staleTime: Infinity });

  const limparSessao = useCallback(() => {
    queryClient.setQueryData(ME_QUERY_KEY, null);
    queryClient.removeQueries({ predicate: (consulta) => consulta.queryKey[0] !== ME_QUERY_KEY[0] });
  }, [queryClient]);

  const logout = useCallback(async () => {
    try {
      await api.POST('/auth/logout');
    } finally {
      limparSessao();
    }
  }, [limparSessao]);

  return {
    usuario: query.data ?? undefined,
    isLoading: query.isPending,
    isError: query.isError,
    recarregar: () => void query.refetch(),
    limparSessao,
    logout,
  };
}
