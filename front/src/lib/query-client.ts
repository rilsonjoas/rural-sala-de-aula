import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './api-error';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (tentativas, erro) => !(erro instanceof ApiError && erro.status < 500) && tentativas < 1,
        refetchOnWindowFocus: false,
        staleTime: 30_000,
      },
    },
  });
}

export const queryClient = createQueryClient();
