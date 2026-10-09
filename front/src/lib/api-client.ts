import createClient, { type Middleware } from 'openapi-fetch';
import type { paths } from './api.generated';
import { toApiError } from './api-error';

export const SESSION_EXPIRED_EVENT = 'session-expired';

// Um 401 nestas chamadas é esperado (visitante ou credencial errada), não é sessão expirada.
const SEM_AVISO_DE_SESSAO = ['/me', '/auth/login', '/auth/register'];

const tratarErros: Middleware = {
  async onResponse({ response, schemaPath }) {
    if (response.ok) return undefined;

    const corpo = await response
      .clone()
      .json()
      .catch(() => undefined);

    if (response.status === 401 && !SEM_AVISO_DE_SESSAO.includes(schemaPath)) {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }

    throw toApiError(response.status, corpo);
  },
};

type Opcoes = { baseUrl?: string; fetch?: typeof fetch };

export function createApiClient({ baseUrl, fetch: fetchImpl }: Opcoes = {}) {
  const base = baseUrl ?? (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '/api/v1';
  // Absoluta (resolvida contra a origem da página): o Request do Node, usado nos testes, não aceita URL relativa.
  const baseAbsoluta = new URL(base, window.location.origin).toString().replace(/\/$/, '');
  const client = createClient<paths>({ baseUrl: baseAbsoluta, credentials: 'include', fetch: fetchImpl });
  client.use(tratarErros);
  return client;
}

export const api = createApiClient();
