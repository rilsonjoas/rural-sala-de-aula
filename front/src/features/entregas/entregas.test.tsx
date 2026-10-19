import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { server } from '@/mocks/server';
import {
  ALUNA,
  A_LISTA_1,
  A_LISTA_2,
  PROFESSOR,
  PROFESSORA,
} from '@/mocks/fixtures';
import { entrarComo } from '@/test/auth';
import { renderApp } from '@/test/render';

async function abrirEntregas(atividadeId = A_LISTA_2, usuario: { email: string; senha: string } = PROFESSOR) {
  const user = userEvent.setup();
  await entrarComo(usuario);
  renderApp(`/atividades/${atividadeId}/entregas`);
  return user;
}

const item = (nome: RegExp | string) => screen.getByRole('article', { name: nome });

describe('Entregas da atividade (professor)', () => {
  it('mostra a atividade, a turma e o resumo calculado da lista', async () => {
    await abrirEntregas();

    expect(await screen.findByRole('heading', { name: 'Lista 2 — Balanceamento AVL', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Turma A — Algoritmos')).toBeInTheDocument();
    expect(await screen.findByText('4 entregas · 3 com atraso · 2 avaliadas')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Atividades', current: false })).toHaveAttribute('href', expect.stringMatching(/^\/turmas\//));
  });

  it('lista só quem entregou, da entrega mais antiga para a mais recente', async () => {
    await abrirEntregas();
    await screen.findByText('4 entregas · 3 com atraso · 2 avaliadas');

    const nomes = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    expect(nomes).toEqual(['Beatriz Oliveira Santos', 'Lucas Mendes', 'Maria Clara Albuquerque', 'Gabriel Henrique Ribeiro']);
  });

  it('cada item mostra iniciais, situação, arquivo, tamanho, data de envio e nota', async () => {
    await abrirEntregas();
    await screen.findByText('4 entregas · 3 com atraso · 2 avaliadas');

    const beatriz = within(item(/Beatriz/));
    expect(beatriz.getByText('BS')).toBeInTheDocument();
    expect(beatriz.getByText('No prazo')).toBeInTheDocument();
    expect(beatriz.getByText('lista2_beatriz.pdf')).toBeInTheDocument();
    expect(beatriz.getByText(/^1,5 MB · Enviada em \d{2}\/\d{2} às \d{2}:\d{2}$/)).toBeInTheDocument();
    expect(beatriz.getByText('Nota 9,5')).toBeInTheDocument();

    const maria = within(item(/Maria Clara/));
    expect(maria.getByText('Com atraso')).toBeInTheDocument();
    expect(maria.getByText('Sem nota')).toBeInTheDocument();
    expect(within(item(/Gabriel/)).getByText(/^950 KB/)).toBeInTheDocument();
  });

  it('mostra Avaliar para quem está sem nota e Editar nota para quem já tem', async () => {
    await abrirEntregas();
    await screen.findByText('4 entregas · 3 com atraso · 2 avaliadas');

    expect(within(item(/Maria Clara/)).getByRole('button', { name: /^Avaliar/ })).toBeInTheDocument();
    expect(within(item(/Gabriel/)).getByRole('button', { name: /^Avaliar/ })).toBeInTheDocument();
    expect(within(item(/Beatriz/)).getByRole('button', { name: /^Editar nota/ })).toBeInTheDocument();
    expect(within(item(/Lucas/)).getByRole('button', { name: /^Editar nota/ })).toBeInTheDocument();
  });

  it('baixa o arquivo com o nome original', async () => {
    const user = await abrirEntregas();
    await screen.findByText('4 entregas · 3 com atraso · 2 avaliadas');
    const criarUrl = vi.fn(() => 'blob:simulado');
    Object.assign(URL, { createObjectURL: criarUrl, revokeObjectURL: vi.fn() });
    const clique = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe('lista2_maria.pdf');
    });

    await user.click(within(item(/Maria Clara/)).getByRole('button', { name: /^Baixar/ }));

    await waitFor(() => expect(clique).toHaveBeenCalledTimes(1));
    expect(criarUrl).toHaveBeenCalledTimes(1);
  });

  it('avisa quando o download falha', async () => {
    const user = await abrirEntregas();
    await screen.findByText('4 entregas · 3 com atraso · 2 avaliadas');
    server.use(http.get('*/api/v1/entregas/:id/arquivo', () => HttpResponse.json({ status: 500, message: 'Erro.' }, { status: 500 })));

    await user.click(within(item(/Maria Clara/)).getByRole('button', { name: /^Baixar/ }));

    expect(await screen.findByText('Não foi possível baixar o arquivo. Tente de novo.')).toBeInTheDocument();
  });

  it('atividade sem entregas ensina o que esperar', async () => {
    await abrirEntregas(A_LISTA_1);

    expect(await screen.findByText('Nenhum aluno entregou ainda.')).toBeInTheDocument();
  });

  it('outro professor não vê a atividade', async () => {
    await abrirEntregas(A_LISTA_2, PROFESSORA);

    expect(await screen.findByText('Atividade não encontrada.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar para Turmas' })).toBeInTheDocument();
  });

  it('se a API falhar, mostra o erro com Tentar de novo', async () => {
    const user = userEvent.setup();
    await entrarComo(PROFESSOR);
    server.use(http.get('*/api/v1/atividades/:id/entregas', () => HttpResponse.json({ status: 500, message: 'Erro.' }, { status: 500 })));
    renderApp(`/atividades/${A_LISTA_2}/entregas`);

    expect(await screen.findByRole('alert')).toHaveTextContent('Não conseguimos carregar as entregas. Verifique a conexão e tente de novo.');
    server.resetHandlers();
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('4 entregas · 3 com atraso · 2 avaliadas')).toBeInTheDocument();
  });
});

describe('Avaliar entrega', () => {
  beforeEach(() => undefined);
  afterEach(() => undefined);

  async function abrirFolha(nome: RegExp, botao: RegExp) {
    const user = await abrirEntregas();
    await screen.findByText('4 entregas · 3 com atraso · 2 avaliadas');
    await user.click(within(item(nome)).getByRole('button', { name: botao }));
    const folha = await screen.findByRole('dialog', { name: 'Avaliar entrega' });
    return { user, folha };
  }

  it('mostra o aluno e o arquivo, com a explicação de que o comentário é privado', async () => {
    const { folha } = await abrirFolha(/Maria Clara/, /^Avaliar/);

    expect(within(folha).getByText('Maria Clara Albuquerque')).toBeInTheDocument();
    expect(within(folha).getByText('lista2_maria.pdf')).toBeInTheDocument();
    expect(within(folha).getByText('Só o aluno vê este comentário')).toBeInTheDocument();
    expect(within(folha).getByLabelText('Nota (0 a 10)')).toHaveValue('');
  });

  it('salva nota com vírgula e comentário, e o item passa a mostrar a nota', async () => {
    const { user, folha } = await abrirFolha(/Maria Clara/, /^Avaliar/);

    await user.type(within(folha).getByLabelText('Nota (0 a 10)'), '9,5');
    await user.type(within(folha).getByLabelText('Comentário privado'), 'Boa entrega.');
    await user.click(within(folha).getByRole('button', { name: 'Salvar avaliação' }));

    expect(await screen.findByText('Avaliação salva.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(await screen.findByText('4 entregas · 3 com atraso · 3 avaliadas')).toBeInTheDocument();
    const maria = within(item(/Maria Clara/));
    expect(maria.getByText('Nota 9,5')).toBeInTheDocument();
    expect(maria.getByRole('button', { name: /^Editar nota/ })).toBeInTheDocument();
  });

  it('Editar nota abre com a nota e o comentário atuais', async () => {
    const { user, folha } = await abrirFolha(/Lucas/, /^Editar nota/);

    expect(within(folha).getByLabelText('Nota (0 a 10)')).toHaveValue('8,0');
    expect(within(folha).getByLabelText('Comentário privado')).toHaveValue('Faltou tratar o caso da rotação dupla à direita.');

    await user.clear(within(folha).getByLabelText('Nota (0 a 10)'));
    await user.type(within(folha).getByLabelText('Nota (0 a 10)'), '7');
    await user.click(within(folha).getByRole('button', { name: 'Salvar avaliação' }));

    expect(await within(item(/Lucas/)).findByText('Nota 7,0')).toBeInTheDocument();
  });

  it('valida a nota no campo: vazia, fora de 0–10 e com mais de uma casa decimal', async () => {
    const { user, folha } = await abrirFolha(/Maria Clara/, /^Avaliar/);
    const campo = within(folha).getByLabelText('Nota (0 a 10)');

    await user.click(within(folha).getByRole('button', { name: 'Salvar avaliação' }));
    expect(await within(folha).findByText('Informe a nota.')).toBeInTheDocument();

    await user.type(campo, '11');
    await user.click(within(folha).getByRole('button', { name: 'Salvar avaliação' }));
    expect(await within(folha).findByText('A nota deve estar entre 0 e 10.')).toBeInTheDocument();

    await user.clear(campo);
    await user.type(campo, '8,55');
    await user.click(within(folha).getByRole('button', { name: 'Salvar avaliação' }));
    expect(await within(folha).findByText('Use no máximo uma casa decimal.')).toBeInTheDocument();
    expect(campo).toHaveAttribute('aria-invalid', 'true');
  });

  it('depois de avaliada, a aluna enxerga a nota e o comentário (estado Concluída)', async () => {
    const { user, folha } = await abrirFolha(/Maria Clara/, /^Avaliar/);
    await user.type(within(folha).getByLabelText('Nota (0 a 10)'), '9');
    await user.type(within(folha).getByLabelText('Comentário privado'), 'Parabéns.');
    await user.click(within(folha).getByRole('button', { name: 'Salvar avaliação' }));
    await screen.findByText('Avaliação salva.');

    const { api } = await import('@/lib/api-client');
    await api.POST('/auth/logout');
    await entrarComo(ALUNA);
    const { data } = await api.GET('/atividades/{atividadeId}', { params: { path: { atividadeId: A_LISTA_2 } } });

    expect(data).toMatchObject({ estado: 'CONCLUIDA', minhaEntrega: { nota: 9, comentarioPrivado: 'Parabéns.' } });
  });
});

describe('Entregas no desktop (tabela)', () => {
  it('vira tabela com as colunas do desenho', async () => {
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
    await abrirEntregas();
    await screen.findByText('4 entregas · 3 com atraso · 2 avaliadas');

    const tabela = screen.getByRole('table');
    for (const coluna of ['Aluno', 'Arquivo', 'Enviada em', 'Situação', 'Nota']) {
      expect(within(tabela).getByRole('columnheader', { name: coluna })).toBeInTheDocument();
    }
    expect(within(tabela).getAllByRole('row')).toHaveLength(5);
    expect(within(tabela).getAllByRole('button', { name: /^Avaliar/ })).toHaveLength(2);
    vi.restoreAllMocks();
  });
});
