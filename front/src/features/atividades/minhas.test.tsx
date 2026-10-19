import { cleanup, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { server } from '@/mocks/server';
import { ALUNA, ALUNO, A_LISTA_0, A_LISTA_1, PROFESSOR } from '@/mocks/fixtures';
import { entrarComo } from '@/test/auth';
import { renderApp } from '@/test/render';
import { lerFiltrosSalvos, FILTROS_VAZIOS } from './filtros';

afterEach(() => vi.restoreAllMocks());

async function abrirMinhas(usuario: { email: string; senha: string } = ALUNA) {
  const user = userEvent.setup();
  await entrarComo(usuario);
  renderApp('/atividades');
  await screen.findByRole('heading', { name: 'Minhas atividades', level: 2 });
  return user;
}

const card = (nome: RegExp | string) => screen.getByRole('article', { name: nome });
const titulos = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent ?? '');

describe('Minhas atividades (aluno)', () => {
  it('junta as atividades de todas as turmas, com o total, pelo prazo final mais próximo primeiro', async () => {
    await abrirMinhas();

    expect(await screen.findByText('Todas as turmas · 8 atividades')).toBeInTheDocument();
    const ordem = titulos();
    expect(ordem[0]).toMatch(/Prova Teórica 1/);
    expect(ordem[ordem.length - 1]).toMatch(/Seminário/);
  });

  it('cada card mostra turma, tipo, prazo final, estado e a ação certa para o estado', async () => {
    await abrirMinhas();
    await screen.findByText('Todas as turmas · 8 atividades');

    const lista1 = within(card(/Lista 1 —/));
    expect(lista1.getByText('Turma A — Algoritmos')).toBeInTheDocument();
    expect(lista1.getByText('Lista de Exercício')).toBeInTheDocument();
    // Lista 1 vence em 2 dias (48 h): o selo de pendente vira "Vence em breve" (só apresentação).
    expect(lista1.getByText('Vence em breve')).toBeInTheDocument();
    expect(lista1.getByRole('link', { name: 'Enviar entrega' })).toHaveAttribute('href', `/atividades/${A_LISTA_1}`);

    expect(within(card(/Lista 0/)).getByRole('link', { name: 'Enviar entrega' })).toHaveAttribute('href', `/atividades/${A_LISTA_0}`);
    expect(within(card(/Trabalho 1/)).getByRole('link', { name: 'Ver detalhes' })).toBeInTheDocument();
    expect(within(card(/Lista 2/)).getByRole('link', { name: 'Ver envio' })).toBeInTheDocument();
    expect(within(card(/Prova Teórica 1/)).getByRole('link', { name: 'Ver nota e comentário' })).toBeInTheDocument();
    expect(within(card(/Seminário/)).getByText('Projeto em Grupo')).toBeInTheDocument();
  });

  it('tem os três grupos de filtro e nenhum chip ativo ao abrir', async () => {
    await abrirMinhas();
    await screen.findByText('Todas as turmas · 8 atividades');

    for (const grupo of ['Estado', 'Tipo', 'Turma']) {
      expect(screen.getByRole('group', { name: grupo })).toBeInTheDocument();
    }
    expect(within(screen.getByRole('group', { name: 'Estado' })).getAllByRole('button')).toHaveLength(5);
    expect(within(screen.getByRole('group', { name: 'Turma' })).getAllByRole('button')).toHaveLength(3);
    expect(screen.queryAllByRole('button', { pressed: true })).toHaveLength(0);
    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument();
  });

  it('filtra por estado e atualiza o total', async () => {
    const user = await abrirMinhas();
    await screen.findByText('Todas as turmas · 8 atividades');

    await user.click(within(screen.getByRole('group', { name: 'Estado' })).getByRole('button', { name: 'Pendente' }));

    expect(await screen.findByText('Todas as turmas · 3 atividades')).toBeInTheDocument();
    expect(titulos().sort()).toEqual(
      ['Lista 1 — Recursão e Divisão e Conquista', 'Prática 2 — Layout Flexbox e CSS Grid', 'Seminário — APIs REST e GraphQL'].sort(),
    );
  });

  it('combina filtros de grupos diferentes (estado e tipo) e de turma', async () => {
    const user = await abrirMinhas();
    await screen.findByText('Todas as turmas · 8 atividades');

    await user.click(within(screen.getByRole('group', { name: 'Estado' })).getByRole('button', { name: 'Pendente' }));
    await user.click(within(screen.getByRole('group', { name: 'Tipo' })).getByRole('button', { name: 'Projeto em Grupo' }));
    expect(await screen.findByText('Todas as turmas · 1 atividade')).toBeInTheDocument();
    expect(titulos()).toEqual(['Seminário — APIs REST e GraphQL']);

    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    await user.click(within(screen.getByRole('group', { name: 'Turma' })).getByRole('button', { name: 'Turma C — Banco de Dados' }));
    expect(await screen.findByText('Todas as turmas · 1 atividade')).toBeInTheDocument();
    expect(titulos()).toEqual(['Modelagem Relacional — Diagrama E/R']);
  });

  it('clicar de novo no chip ativo o desliga', async () => {
    const user = await abrirMinhas();
    await screen.findByText('Todas as turmas · 8 atividades');
    const chip = () => within(screen.getByRole('group', { name: 'Tipo' })).getByRole('button', { name: 'Prova' });

    await user.click(chip());
    expect(chip()).toHaveAttribute('aria-pressed', 'true');
    await user.click(chip());

    expect(chip()).toHaveAttribute('aria-pressed', 'false');
    expect(await screen.findByText('Todas as turmas · 8 atividades')).toBeInTheDocument();
  });

  it('ordena pelo prazo mais distante primeiro', async () => {
    const user = await abrirMinhas();
    await screen.findByText('Todas as turmas · 8 atividades');

    await user.click(screen.getByRole('combobox', { name: 'Ordenar por' }));
    await user.click(await screen.findByRole('option', { name: 'Prazo (mais distante primeiro)' }));

    await screen.findByText('Todas as turmas · 8 atividades');
    await waitFor(() => expect(titulos()[0]).toMatch(/Seminário/));
    expect(titulos()[titulos().length - 1]).toMatch(/Prova Teórica 1/);
  });

  it('um filtro sem resultado ensina a limpar', async () => {
    const user = await abrirMinhas();
    await screen.findByText('Todas as turmas · 8 atividades');

    await user.click(within(screen.getByRole('group', { name: 'Estado' })).getByRole('button', { name: 'Atrasada' }));
    await user.click(within(screen.getByRole('group', { name: 'Tipo' })).getByRole('button', { name: 'Projeto em Grupo' }));

    expect(await screen.findByText('Nenhuma atividade com esses filtros.')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Limpar filtros' })).toHaveLength(2);
  });

  it('lembra os filtros ao voltar à tela, por aluno', async () => {
    const user = await abrirMinhas();
    await screen.findByText('Todas as turmas · 8 atividades');
    await user.click(within(screen.getByRole('group', { name: 'Estado' })).getByRole('button', { name: 'Atrasada' }));
    await screen.findByText('Todas as turmas · 1 atividade');

    cleanup();
    renderApp('/atividades');

    expect(await screen.findByText('Todas as turmas · 1 atividade')).toBeInTheDocument();
    expect(within(screen.getByRole('group', { name: 'Estado' })).getByRole('button', { name: 'Atrasada' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('os filtros de uma aluna não valem para outro aluno', async () => {
    const user = await abrirMinhas(ALUNA);
    await user.click(within(screen.getByRole('group', { name: 'Estado' })).getByRole('button', { name: 'Atrasada' }));
    await screen.findByText('Todas as turmas · 1 atividade');
    cleanup();
    await entrarComo(ALUNO);

    renderApp('/atividades');

    expect(await screen.findByText(/^Todas as turmas · \d+ atividades?$/)).toBeInTheDocument();
    expect(screen.queryAllByRole('button', { pressed: true })).toHaveLength(0);
  });

  it('enquanto carrega mostra o esqueleto e, se a API falhar, o erro com Tentar de novo', async () => {
    const user = userEvent.setup();
    await entrarComo(ALUNA);
    server.use(http.get('*/api/v1/atividades', () => HttpResponse.json({ status: 500, message: 'Erro interno.' }, { status: 500 })));
    renderApp('/atividades');

    expect(await screen.findByRole('alert')).toHaveTextContent('Não conseguimos carregar suas atividades. Verifique a conexão e tente de novo.');
    server.resetHandlers();
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('Todas as turmas · 8 atividades')).toBeInTheDocument();
  });

  it('o professor vê só as atividades das turmas em que é aluno, não as das que leciona', async () => {
    await abrirMinhas(PROFESSOR);
    await screen.findByText(/^Todas as turmas · \d+ atividades?$/);

    expect(screen.queryByRole('article', { name: /Lista 1 —/ })).not.toBeInTheDocument();
    expect(screen.getByRole('article', { name: /Prática 2/ })).toBeInTheDocument();
  });

  it('a aluna sem atividades vê o estado vazio', async () => {
    const user = userEvent.setup();
    await entrarComo(ALUNA);
    server.use(http.get('*/api/v1/atividades', () => HttpResponse.json([])));
    renderApp('/atividades');

    expect(await screen.findByText('Nenhuma atividade por aqui ainda.')).toBeInTheDocument();
    void user;
  });
});

describe('Minhas atividades no desktop (tabela)', () => {
  function simularDesktop() {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (consulta) =>
        ({
          matches: true,
          media: consulta,
          addEventListener: () => {},
          removeEventListener: () => {},
          addListener: () => {},
          removeListener: () => {},
          onchange: null,
          dispatchEvent: () => false,
        }) as MediaQueryList,
    );
  }

  it('vira tabela com as colunas do desenho', async () => {
    simularDesktop();
    await abrirMinhas();
    await screen.findByText('Todas as turmas · 8 atividades');

    const tabela = screen.getByRole('table');
    for (const coluna of ['Atividade', 'Turma', 'Tipo', 'Prazo final', 'Estado']) {
      expect(within(tabela).getByRole('columnheader', { name: new RegExp(coluna) })).toBeInTheDocument();
    }
    expect(within(tabela).getAllByRole('row')).toHaveLength(9);
    expect(within(tabela).getByRole('link', { name: /Lista 1 —/ })).toHaveAttribute('href', `/atividades/${A_LISTA_1}`);
    expect(within(tabela).getAllByRole('link', { name: 'Enviar entrega' }).length).toBeGreaterThan(0);
  });

  it('o cabeçalho Prazo final ordena e inverte a ordem; o ativo indica aria-sort', async () => {
    simularDesktop();
    const user = await abrirMinhas();
    await screen.findByText('Todas as turmas · 8 atividades');
    const cabecalho = () => screen.getByRole('columnheader', { name: /Prazo final/ });
    expect(cabecalho()).toHaveAttribute('aria-sort', 'ascending');

    await user.click(within(cabecalho()).getByRole('button'));

    expect(cabecalho()).toHaveAttribute('aria-sort', 'descending');
    const primeiraLinha = within(screen.getAllByRole('row')[1]).getByRole('link', { name: /Seminário/ });
    expect(primeiraLinha).toBeInTheDocument();
  });
});

describe('lerFiltrosSalvos', () => {
  it('aceita filtros válidos', () => {
    const lidos = lerFiltrosSalvos(JSON.stringify({ estado: 'ATRASADA', tipo: 'PROVA', ordenar: 'prazo:desc' }));

    expect(lidos).toEqual({ estado: 'ATRASADA', tipo: 'PROVA', ordenar: 'prazo:desc' });
  });

  it('ignora texto quebrado, valores desconhecidos e campos de fora', () => {
    expect(lerFiltrosSalvos('{quebrado')).toEqual(FILTROS_VAZIOS);
    expect(lerFiltrosSalvos(null)).toEqual(FILTROS_VAZIOS);
    expect(lerFiltrosSalvos(JSON.stringify({ estado: 'INVENTADO', ordenar: 'nome:asc', outro: 1 }))).toEqual(FILTROS_VAZIOS);
  });
});
