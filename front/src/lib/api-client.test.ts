import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from './api-error';
import { SESSION_EXPIRED_EVENT, createApiClient } from './api-client';

function respostaJson(status: number, corpo: unknown) {
  return new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('createApiClient', () => {
  it('devolve os dados de uma resposta 2xx', async () => {
    const fetch = vi.fn().mockResolvedValue(respostaJson(200, [{ id: '1' }]));
    const api = createApiClient({ fetch });

    const { data } = await api.GET('/turmas');

    expect(data).toEqual([{ id: '1' }]);
  });

  it('lança ApiError com os campos de um 422', async () => {
    const fetch = vi.fn().mockResolvedValue(
      respostaJson(422, { status: 422, message: 'Dados inválidos.', campos: [{ campo: 'nome', mensagem: 'Informe o nome.' }] }),
    );
    const api = createApiClient({ fetch });

    await expect(api.GET('/turmas')).rejects.toMatchObject({
      status: 422,
      campos: [{ campo: 'nome', mensagem: 'Informe o nome.' }],
    });
    await expect(api.GET('/turmas')).rejects.toBeInstanceOf(ApiError);
  });

  it('avisa que a sessão expirou quando uma chamada comum recebe 401', async () => {
    const fetch = vi.fn().mockResolvedValue(respostaJson(401, { status: 401, message: 'Não autenticado.' }));
    const api = createApiClient({ fetch });
    const ouvinte = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, ouvinte);

    await expect(api.GET('/turmas')).rejects.toMatchObject({ status: 401 });

    expect(ouvinte).toHaveBeenCalledTimes(1);
    window.removeEventListener(SESSION_EXPIRED_EVENT, ouvinte);
  });

  it.each([
    ['GET', '/me'],
    ['POST', '/auth/login'],
    ['POST', '/auth/register'],
  ])('não avisa sessão expirada no 401 de %s %s', async (metodo, caminho) => {
    const fetch = vi.fn().mockResolvedValue(respostaJson(401, { status: 401, message: 'Não autenticado.' }));
    const api = createApiClient({ fetch });
    const ouvinte = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, ouvinte);

    const chamada =
      metodo === 'GET'
        ? api.GET('/me')
        : api.POST(caminho as '/auth/login', { body: { email: 'a@b.br', senha: '12345678' } });
    await expect(chamada).rejects.toMatchObject({ status: 401 });

    expect(ouvinte).not.toHaveBeenCalled();
    window.removeEventListener(SESSION_EXPIRED_EVENT, ouvinte);
  });

  it('envia o cookie de sessão (credentials: include)', async () => {
    const fetch = vi.fn().mockResolvedValue(respostaJson(200, []));
    const api = createApiClient({ fetch });

    await api.GET('/turmas');

    const requisicao = fetch.mock.calls[0][0] as Request;
    expect(requisicao.credentials).toBe('include');
  });
});
