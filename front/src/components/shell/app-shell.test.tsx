import { cleanup, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { api } from '@/lib/api-client';
import { ALUNA, PROFESSOR } from '@/mocks/fixtures';
import { renderApp } from '@/test/render';

afterEach(() => cleanup());

async function entrarComo(usuario: { email: string; senha: string }) {
  await api.POST('/auth/login', { body: { email: usuario.email, senha: usuario.senha } });
}

describe('shell', () => {
  it('mostra a marca como link para Turmas', async () => {
    await entrarComo(ALUNA);
    renderApp('/turmas');

    const marca = await screen.findByRole('link', { name: 'Rural Sala de Aula' });
    expect(marca).toHaveAttribute('href', '/turmas');
    expect(screen.getByRole('heading', { name: 'Rural Sala de Aula', level: 1 })).toBeInTheDocument();
  });

  it('aluno vê Turmas e Atividades na navegação', async () => {
    await entrarComo(ALUNA);
    renderApp('/turmas');

    const nav = await screen.findByRole('navigation', { name: 'Navegação principal' });
    expect(within(nav).getByRole('link', { name: 'Turmas' })).toHaveAttribute('href', '/turmas');
    expect(within(nav).getByRole('link', { name: 'Atividades' })).toHaveAttribute('href', '/atividades');
  });

  it('professor vê só Turmas', async () => {
    await entrarComo(PROFESSOR);
    renderApp('/turmas');

    const nav = await screen.findByRole('navigation', { name: 'Navegação principal' });
    expect(within(nav).getByRole('link', { name: 'Turmas' })).toBeInTheDocument();
    expect(within(nav).queryByRole('link', { name: 'Atividades' })).not.toBeInTheDocument();
  });

  it('marca o link da página atual com aria-current', async () => {
    await entrarComo(ALUNA);
    renderApp('/atividades');

    const nav = await screen.findByRole('navigation', { name: 'Navegação principal' });
    expect(within(nav).getByRole('link', { name: 'Atividades' })).toHaveAttribute('aria-current', 'page');
    expect(within(nav).getByRole('link', { name: 'Turmas' })).not.toHaveAttribute('aria-current');
  });

  it('tem o link para pular ao conteúdo', async () => {
    await entrarComo(ALUNA);
    renderApp('/turmas');

    expect(await screen.findByRole('link', { name: 'Pular para o conteúdo' })).toHaveAttribute('href', '#conteudo');
    expect(screen.getByRole('main')).toHaveAttribute('id', 'conteudo');
  });
});

describe('menu da conta', () => {
  it('o botão mostra as iniciais e abre nome, papel e Sair', async () => {
    const usuario = userEvent.setup();
    await entrarComo(ALUNA);
    renderApp('/turmas');

    const botao = await screen.findByRole('button', { name: 'Menu da conta' });
    expect(botao).toHaveTextContent('MA');

    await usuario.click(botao);

    expect(await screen.findByText('Maria Clara Albuquerque')).toBeInTheDocument();
    expect(screen.getByText('Aluno')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Sair' })).toBeInTheDocument();
  });

  it('mostra o papel Professor para o professor', async () => {
    const usuario = userEvent.setup();
    await entrarComo(PROFESSOR);
    renderApp('/turmas');

    await usuario.click(await screen.findByRole('button', { name: 'Menu da conta' }));

    expect(await screen.findByText('Professor')).toBeInTheDocument();
  });

  it('Sair encerra a sessão e volta para /entrar', async () => {
    const usuario = userEvent.setup();
    await entrarComo(ALUNA);
    renderApp('/turmas');

    await usuario.click(await screen.findByRole('button', { name: 'Menu da conta' }));
    await usuario.click(await screen.findByRole('menuitem', { name: 'Sair' }));

    expect(await screen.findByRole('heading', { name: 'Entrar', level: 2 })).toBeInTheDocument();
    await expect(api.GET('/me')).rejects.toMatchObject({ status: 401 });
  });
});

describe('página não encontrada', () => {
  it('logado vê a mensagem e o botão para voltar a Turmas', async () => {
    await entrarComo(ALUNA);
    renderApp('/essa-rota-nao-existe');

    expect(await screen.findByRole('heading', { name: 'Página não encontrada', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar para Turmas' })).toHaveAttribute('href', '/turmas');
  });

  it('visitante cai em /entrar', async () => {
    renderApp('/essa-rota-nao-existe');

    expect(await screen.findByRole('heading', { name: 'Entrar', level: 2 })).toBeInTheDocument();
  });
});
