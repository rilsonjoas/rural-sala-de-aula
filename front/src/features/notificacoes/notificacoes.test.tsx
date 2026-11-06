import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { db } from '@/mocks/db';
import { ALUNA, A_LISTA_1, PROFESSOR, TURMA_A } from '@/mocks/fixtures';
import { server } from '@/mocks/server';
import { entrarComo } from '@/test/auth';
import { renderApp } from '@/test/render';

function semear(usuarioId: string, quantidade: number, extra: Partial<(typeof db.notificacoes)[number]> = {}) {
  for (let i = 0; i < quantidade; i += 1) {
    db.notificacoes.push({
      id: `seed-${usuarioId}-${i}-${db.notificacoes.length}`,
      usuarioId,
      tipo: 'AVISO_NOVO',
      texto: `Novo aviso em Turma A — Algoritmos (${i}).`,
      turmaId: TURMA_A,
      atividadeId: null,
      avisoId: null,
      criadaEm: new Date(Date.now() - i * 60_000).toISOString(),
      lida: false,
      ...extra,
    });
  }
}

async function abrir(usuario: { email: string; senha: string }, caminho = '/turmas') {
  const user = userEvent.setup();
  await entrarComo(usuario);
  renderApp(caminho);
  return user;
}

const sino = () => screen.findByRole('button', { name: /^Notificações/ });

describe('Sino de notificações', () => {
  it('mostra o contador de não lidas e o descreve para leitores de tela', async () => {
    semear(ALUNA.id, 3);
    await abrir(ALUNA);

    const botao = await screen.findByRole('button', { name: 'Notificações, 3 não lidas' });
    expect(within(botao).getByText('3')).toBeInTheDocument();
  });

  it('mostra "9+" quando passa de 9', async () => {
    semear(ALUNA.id, 12);
    await abrir(ALUNA);

    const botao = await screen.findByRole('button', { name: 'Notificações, 12 não lidas' });
    expect(within(botao).getByText('9+')).toBeInTheDocument();
  });

  it('sem notificações não há contador', async () => {
    await abrir(PROFESSOR);

    const botao = await sino();
    expect(botao).toHaveAccessibleName('Notificações');
    expect(botao.textContent).toBe('');
  });

  it('abre a lista vazia com a mensagem do desenho', async () => {
    const user = await abrir(PROFESSOR);
    await user.click(await sino());

    const lista = await screen.findByRole('dialog', { name: 'Notificações' });
    expect(await within(lista).findByText('Nenhuma notificação por enquanto.')).toBeInTheDocument();
  });

  it('clicar numa notificação marca como lida e leva ao destino', async () => {
    semear(ALUNA.id, 1, { tipo: 'NOTA_PUBLICADA', atividadeId: A_LISTA_1, texto: 'Sua entrega de Lista 1 foi avaliada.' });
    const user = await abrir(ALUNA);
    await user.click(await screen.findByRole('button', { name: 'Notificações, 1 não lidas' }));

    const lista = await screen.findByRole('dialog', { name: 'Notificações' });
    await user.click(await within(lista).findByRole('button', { name: /Sua entrega de Lista 1 foi avaliada/ }));

    expect(await screen.findByRole('heading', { name: 'Lista 1 — Recursão e Divisão e Conquista', level: 2 })).toBeInTheDocument();
    expect(db.notificacoes.every((n) => n.lida)).toBe(true);
  });

  it('"Marcar todas como lidas" zera o contador', async () => {
    semear(ALUNA.id, 4);
    const user = await abrir(ALUNA);
    await user.click(await screen.findByRole('button', { name: 'Notificações, 4 não lidas' }));

    const lista = await screen.findByRole('dialog', { name: 'Notificações' });
    await user.click(within(lista).getByRole('button', { name: 'Marcar todas como lidas' }));

    await waitFor(() => expect(db.notificacoes.every((n) => n.lida)).toBe(true));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Notificações' })).toBeInTheDocument());
  });

  it('prazos próximos aparecem à parte e não entram no contador', async () => {
    const user = await abrir(ALUNA);
    const botao = await sino();
    expect(botao).toHaveAccessibleName('Notificações');
    await user.click(botao);

    const lista = await screen.findByRole('dialog', { name: 'Notificações' });
    expect(await within(lista).findByRole('heading', { name: 'Prazos próximos' })).toBeInTheDocument();
    expect(within(lista).getByText(/O prazo de Prática 2/)).toBeInTheDocument();
  });

  it('mostra o estado de erro e tenta de novo', async () => {
    server.use(http.get('*/api/v1/notificacoes', () => HttpResponse.json({ status: 500, message: 'Erro' }, { status: 500 })));
    const user = await abrir(PROFESSOR);
    await user.click(await sino());

    const lista = await screen.findByRole('dialog', { name: 'Notificações' });
    const alerta = await within(lista).findByRole('alert');
    server.resetHandlers();
    await user.click(within(alerta).getByRole('button', { name: /tentar de novo/i }));

    expect(await within(lista).findByText('Nenhuma notificação por enquanto.')).toBeInTheDocument();
  });

  it('uma notificação de aviso abre o mural mesmo com a aba Atividades aberta', async () => {
    semear(ALUNA.id, 1, { avisoId: 'aviso-inexistente', texto: 'Novo aviso em Turma A — Algoritmos.' });
    const user = await abrir(ALUNA, `/turmas/${TURMA_A}`);
    await user.click(await screen.findByRole('button', { name: /^Atividades/ }));
    expect(screen.queryByText(/Sejam muito bem-vindos à disciplina/)).not.toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: 'Notificações, 1 não lidas' }));
    const lista = await screen.findByRole('dialog', { name: 'Notificações' });
    await user.click(await within(lista).findByRole('button', { name: /Novo aviso em Turma A/ }));

    expect(await screen.findByText(/Sejam muito bem-vindos à disciplina/)).toBeInTheDocument();
  });
});
