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

  it('mostra Turmas e Atividades na navegação', async () => {
    await entrarComo(ALUNA);
    renderApp('/turmas');

    const nav = await screen.findByRole('navigation', { name: 'Navegação principal' });
    expect(within(nav).getByRole('link', { name: 'Turmas' })).toHaveAttribute('href', '/turmas');
    expect(within(nav).getByRole('link', { name: 'Atividades' })).toHaveAttribute('href', '/atividades');
  });

  it('professor vê Turmas e Atividades, como qualquer usuário', async () => {
    await entrarComo(PROFESSOR);
    renderApp('/turmas');

    const nav = await screen.findByRole('navigation', { name: 'Navegação principal' });
    expect(within(nav).getByRole('link', { name: 'Turmas' })).toBeInTheDocument();
    expect(within(nav).getByRole('link', { name: 'Atividades' })).toBeInTheDocument();
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
  it('o botão mostra as iniciais e abre nome, e-mail e Sair', async () => {
    const usuario = userEvent.setup();
    await entrarComo(ALUNA);
    renderApp('/turmas');

    const botao = await screen.findByRole('button', { name: 'Menu da conta' });
    expect(botao).toHaveTextContent('MA');

    await usuario.click(botao);

    expect(await screen.findByText('Maria Clara Albuquerque')).toBeInTheDocument();
    expect(screen.getByText(ALUNA.email)).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Sair' })).toBeInTheDocument();
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

describe('troca de tela', () => {
  it('a cada tela o título do documento muda e o foco vai para o conteúdo', async () => {
    const usuario = userEvent.setup();
    await entrarComo(ALUNA);
    renderApp('/turmas');
    await screen.findByRole('heading', { name: 'Minhas turmas', level: 2 });
    expect(document.title).toBe('Minhas turmas · Rural Sala de Aula');

    await usuario.click((await screen.findAllByRole('link', { name: /Ver turma/ }))[0]);

    expect(await screen.findByRole('heading', { name: /Turma [AB] —/, level: 2 })).toBeInTheDocument();
    expect(document.title).toMatch(/^Turma [AB] — .+ · Rural Sala de Aula$/);
    expect(screen.getByRole('main')).toHaveFocus();
  });

  it('a página não encontrada tem o próprio título', async () => {
    await entrarComo(ALUNA);
    renderApp('/essa-rota-nao-existe');

    await screen.findByRole('heading', { name: 'Página não encontrada', level: 2 });
    expect(document.title).toBe('Página não encontrada · Rural Sala de Aula');
  });
});
