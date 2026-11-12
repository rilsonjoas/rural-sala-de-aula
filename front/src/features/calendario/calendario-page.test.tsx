import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import type { Atividade } from '@/features/atividades/filtros';
import { A_LISTA_1, ALUNA, PROFESSOR } from '@/mocks/fixtures';
import { server } from '@/mocks/server';
import { entrarComo } from '@/test/auth';
import { renderApp } from '@/test/render';
import { inicioDaSemana } from './carga';

/** Atividade com prazo `dias` depois da segunda-feira desta semana, ao meio-dia. */
function naSemana(id: string, dias: number, semanas = 0): Atividade {
  const seg = inicioDaSemana(new Date());
  const prazo = new Date(seg.getFullYear(), seg.getMonth(), seg.getDate() + dias + 7 * semanas, 12, 0);
  return {
    id,
    nome: `Atividade ${id}`,
    tipo: 'LISTA_DE_EXERCICIO',
    turmaId: 't-1',
    turmaNome: 'Turma A',
    prazoFinal: prazo.toISOString(),
    disponivelEm: '2026-01-01T00:00:00Z',
    aceitaAtraso: true,
    estado: 'PENDENTE',
  } as Atividade;
}

function atividadesDoAluno(lista: Atividade[]) {
  server.use(http.get('*/api/v1/atividades', () => HttpResponse.json(lista)));
}

async function abrir() {
  const user = userEvent.setup();
  await entrarComo(ALUNA);
  renderApp('/calendario');
  await screen.findByRole('heading', { name: 'Calendário', level: 2 });
  return user;
}

const semana = (n: number) => screen.getAllByRole('region', { name: /^Semana de / })[n];

describe('Calendário do aluno', () => {
  it('aparece na navegação principal', async () => {
    await abrir();
    const nav = screen.getByRole('navigation', { name: 'Navegação principal' });
    expect(within(nav).getByRole('link', { name: 'Calendário' })).toHaveAttribute('href', '/calendario');
  });

  it('classifica cada semana pela quantidade de prazos e lista as atividades com link', async () => {
    atividadesDoAluno([naSemana('a', 1), naSemana('b', 2), naSemana('c', 3), naSemana('d', 1, 1), naSemana('e', 1, 3)]);
    await abrir();
    await screen.findByText('Atividade a');

    expect(within(semana(0)).getByText('Semana pesada · 3 prazos')).toBeInTheDocument();
    expect(within(semana(0)).getByRole('link', { name: /Atividade a/ })).toHaveAttribute('href', '/atividades/a');
    expect(within(semana(1)).getByText('Semana média · 1 prazo')).toBeInTheDocument();
    expect(within(semana(2)).getByText('Semana livre')).toBeInTheDocument();
    expect(within(semana(3)).getByText('Semana média · 1 prazo')).toBeInTheDocument();
  });

  it('as semanas seguintes e as anteriores deslocam a janela de quatro semanas', async () => {
    atividadesDoAluno([naSemana('longe', 1, 5), naSemana('passada', 1, -1)]);
    const user = await abrir();
    await screen.findAllByRole('region', { name: /^Semana de / });
    expect(screen.queryByText('Atividade longe')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Semanas seguintes' }));
    expect(await screen.findByText('Atividade longe')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Semanas anteriores' }));
    await user.click(screen.getByRole('button', { name: 'Semanas anteriores' }));
    expect(await screen.findByText('Atividade passada')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Voltar para esta semana' }));
    expect(screen.queryByText('Atividade passada')).not.toBeInTheDocument();
  });

  it('mostra o estado de erro e tenta de novo', async () => {
    server.use(http.get('*/api/v1/atividades', () => HttpResponse.json({ status: 500, message: 'Erro' }, { status: 500 })));
    const user = await abrir();

    const alerta = await screen.findByRole('alert');
    atividadesDoAluno([naSemana('a', 1)]);
    await user.click(within(alerta).getByRole('button', { name: /tentar de novo/i }));

    expect(await screen.findByText('Atividade a')).toBeInTheDocument();
  });

  it('o professor vê os prazos das turmas que leciona, sem o estado de entrega', async () => {
    await entrarComo(PROFESSOR);
    renderApp('/calendario');
    await screen.findByRole('heading', { name: 'Calendário', level: 2 });

    const link = await screen.findByRole('link', { name: /Lista 1 — Recursão/ });
    expect(link).toHaveAttribute('href', `/atividades/${A_LISTA_1}`);
    const linha = link.closest('li') as HTMLElement;
    expect(within(linha).queryByText('Pendente')).not.toBeInTheDocument();
  });
});
