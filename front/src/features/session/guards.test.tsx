import { act, cleanup, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { api } from '@/lib/api-client';
import { SESSION_EXPIRED_EVENT } from '@/lib/api-client';
import { ALUNA, PROFESSOR } from '@/mocks/fixtures';
import { renderApp } from '@/test/render';

afterEach(() => cleanup());

async function entrarComo(usuario: { email: string; senha: string }) {
  await api.POST('/auth/login', { body: { email: usuario.email, senha: usuario.senha } });
}

const IDATIVIDADE = '20000000-0000-4000-8000-000000000001';

describe('guardas de rota', () => {
  it('visitante em /turmas vai para /entrar', async () => {
    renderApp('/turmas');

    expect(await screen.findByRole('heading', { name: 'Entrar', level: 2 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Turmas', level: 2 })).not.toBeInTheDocument();
  });

  it('enquanto confere a sessão, mostra o estado de carregando e não a tela errada', async () => {
    renderApp('/turmas');

    expect(screen.getByRole('status', { name: 'Carregando' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Turmas', level: 2 })).not.toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Entrar', level: 2 })).toBeInTheDocument();
  });

  it('visitante que abre o app não vê o aviso de sessão expirada', async () => {
    renderApp('/turmas');

    await screen.findByRole('heading', { name: 'Entrar', level: 2 });
    expect(screen.queryByText('Sua sessão expirou. Entre de novo.')).not.toBeInTheDocument();
  });

  it('logado em /entrar vai para /turmas', async () => {
    await entrarComo(ALUNA);
    renderApp('/entrar');

    expect(await screen.findByRole('heading', { name: 'Turmas', level: 2 })).toBeInTheDocument();
  });

  it('a raiz leva o logado a /turmas', async () => {
    await entrarComo(PROFESSOR);
    renderApp('/');

    expect(await screen.findByRole('heading', { name: 'Turmas', level: 2 })).toBeInTheDocument();
  });

  it('aluno acessa /atividades e /atividades/:id', async () => {
    await entrarComo(ALUNA);
    renderApp('/atividades');
    expect(await screen.findByRole('heading', { name: 'Atividades', level: 2 })).toBeInTheDocument();
    cleanup();

    renderApp(`/atividades/${IDATIVIDADE}`);
    expect(await screen.findByRole('heading', { name: 'Atividade', level: 2 })).toBeInTheDocument();
  });

  it('professor em /atividades (tela do aluno) vai para /turmas', async () => {
    await entrarComo(PROFESSOR);
    renderApp('/atividades');

    expect(await screen.findByRole('heading', { name: 'Turmas', level: 2 })).toBeInTheDocument();
  });

  it('aluno em /atividades/:id/entregas (tela do professor) vai para /turmas', async () => {
    await entrarComo(ALUNA);
    renderApp(`/atividades/${IDATIVIDADE}/entregas`);

    expect(await screen.findByRole('heading', { name: 'Turmas', level: 2 })).toBeInTheDocument();
  });

  it('professor acessa /atividades/:id/entregas', async () => {
    await entrarComo(PROFESSOR);
    renderApp(`/atividades/${IDATIVIDADE}/entregas`);

    expect(await screen.findByRole('heading', { name: 'Entregas da atividade', level: 2 })).toBeInTheDocument();
  });

  it('sessão expirada no meio do uso volta para /entrar com o aviso', async () => {
    await entrarComo(ALUNA);
    renderApp('/turmas');
    await screen.findByRole('heading', { name: 'Turmas', level: 2 });

    act(() => {
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    });

    expect(await screen.findByRole('heading', { name: 'Entrar', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Sua sessão expirou. Entre de novo.')).toBeInTheDocument();
  });
});
