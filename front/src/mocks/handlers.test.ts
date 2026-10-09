import { describe, expect, it } from 'vitest';
import { api } from '@/lib/api-client';
import { abrirSessaoDeTeste } from './db';
import { ALUNA, PROFESSOR } from './fixtures';

describe('API simulada: autenticação', () => {
  it('GET /me sem sessão devolve 401', async () => {
    await expect(api.GET('/me')).rejects.toMatchObject({ status: 401 });
  });

  it('login com credencial válida devolve o usuário e abre a sessão', async () => {
    const { data } = await api.POST('/auth/login', { body: { email: ALUNA.email, senha: ALUNA.senha } });

    expect(data).toMatchObject({ nome: ALUNA.nome, papel: 'ALUNO' });
    expect(data).not.toHaveProperty('senha');

    const me = await api.GET('/me');
    expect(me.data?.email).toBe(ALUNA.email);
  });

  it('login ignora maiúsculas no e-mail', async () => {
    const { data } = await api.POST('/auth/login', {
      body: { email: PROFESSOR.email.toUpperCase(), senha: PROFESSOR.senha },
    });

    expect(data?.papel).toBe('PROFESSOR');
  });

  it('login com senha errada devolve 401 e a mensagem do desenho', async () => {
    await expect(api.POST('/auth/login', { body: { email: ALUNA.email, senha: 'errada123' } })).rejects.toMatchObject({
      status: 401,
      message: 'E-mail ou senha incorretos. Confira e tente de novo.',
    });
  });

  it('logout encerra a sessão', async () => {
    await api.POST('/auth/login', { body: { email: ALUNA.email, senha: ALUNA.senha } });
    await api.POST('/auth/logout');

    await expect(api.GET('/me')).rejects.toMatchObject({ status: 401 });
  });

  it('cadastro cria a conta e já inicia a sessão', async () => {
    const { data } = await api.POST('/auth/register', {
      body: { nome: 'Ana Souza', email: 'ana@ufrpe.br', senha: 'senha1234', papel: 'PROFESSOR' },
    });

    expect(data).toMatchObject({ nome: 'Ana Souza', papel: 'PROFESSOR' });
    expect((await api.GET('/me')).data?.email).toBe('ana@ufrpe.br');
  });

  it('cadastro com e-mail repetido (qualquer caixa) devolve 409 com a mensagem do desenho', async () => {
    await expect(
      api.POST('/auth/register', {
        body: { nome: 'Outra', email: ALUNA.email.toUpperCase(), senha: 'senha1234', papel: 'ALUNO' },
      }),
    ).rejects.toMatchObject({
      status: 409,
      message: 'Esse e-mail já está cadastrado. Entre ou use outro e-mail.',
    });
  });

  it('cadastro inválido devolve 422 com os erros por campo', async () => {
    await expect(
      api.POST('/auth/register', { body: { nome: ' ', email: 'sem-arroba', senha: 'curta', papel: 'ALUNO' } }),
    ).rejects.toMatchObject({
      status: 422,
      campos: expect.arrayContaining([
        expect.objectContaining({ campo: 'nome' }),
        expect.objectContaining({ campo: 'email' }),
        expect.objectContaining({ campo: 'senha' }),
      ]),
    });
  });

  it('o estado volta ao inicial a cada teste (a conta criada acima não existe aqui)', async () => {
    await expect(
      api.POST('/auth/login', { body: { email: 'ana@ufrpe.br', senha: 'senha1234' } }),
    ).rejects.toMatchObject({ status: 401 });
  });
});

describe('API simulada: sessão de desenvolvimento', () => {
  it('abrirSessaoDeTeste("professor") deixa o professor logado', async () => {
    abrirSessaoDeTeste('professor');

    expect((await api.GET('/me')).data?.papel).toBe('PROFESSOR');
  });

  it('abrirSessaoDeTeste("aluna") deixa a aluna logada', async () => {
    abrirSessaoDeTeste('aluna');

    expect((await api.GET('/me')).data?.email).toBe(ALUNA.email);
  });

  it('ignora um nome desconhecido sem abrir sessão', async () => {
    abrirSessaoDeTeste('ninguem');

    await expect(api.GET('/me')).rejects.toMatchObject({ status: 401 });
  });
});
