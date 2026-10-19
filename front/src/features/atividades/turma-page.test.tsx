import { fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { api } from '@/lib/api-client';
import {
  ALUNA,
  ALUNO,
  A_LISTA_0,
  A_LISTA_1,
  A_PROJETO,
  PROFESSOR,
  TURMA_A,
  TURMA_B,
} from '@/mocks/fixtures';
import { entrarComo } from '@/test/auth';
import { renderApp } from '@/test/render';

async function abrirTurma(usuario: { email: string; senha: string }, turmaId = TURMA_A) {
  const user = userEvent.setup();
  await entrarComo(usuario);
  renderApp(`/turmas/${turmaId}`);
  return user;
}

const card = (nome: RegExp | string) => screen.getByRole('article', { name: nome });

describe('Atividades da turma (aluno)', () => {
  it('mostra o cabeçalho da turma e o link para voltar', async () => {
    await abrirTurma(ALUNA);

    expect(await screen.findByRole('heading', { name: 'Turma A — Algoritmos', level: 2 })).toBeInTheDocument();
    expect(within(screen.getByRole('main')).getByRole('link', { name: /Turmas/ })).toHaveAttribute('href', '/turmas');
    expect(screen.getByText('Algoritmos e Estruturas de Dados II · 2026.2')).toBeInTheDocument();
    expect(screen.getByText('Prof. Paulo Silva')).toBeInTheDocument();
    expect(screen.getByText('Seg · Qua')).toBeInTheDocument();
  });

  it('lista as atividades disponíveis, cada uma com o selo do estado, e não mostra as indisponíveis', async () => {
    await abrirTurma(ALUNA);
    await screen.findByRole('heading', { name: 'Turma A — Algoritmos', level: 2 });

    expect(await screen.findAllByRole('article')).toHaveLength(5);
    expect(screen.queryByRole('article', { name: /Projeto Final/ })).not.toBeInTheDocument();
    expect(within(card(/Lista 1/)).getByText('Vence em breve')).toBeInTheDocument();
    expect(within(card(/Trabalho 1/)).getByText('Entregue')).toBeInTheDocument();
    expect(within(card(/Lista 2/)).getByText('Entregue com atraso')).toBeInTheDocument();
    expect(within(card(/Prova Teórica 1/)).getByText('Concluída · nota 9,5')).toBeInTheDocument();
    expect(within(card(/Lista 0/)).getByText('Atrasada')).toBeInTheDocument();
  });

  it('cada card mostra tipo, um só prazo (o prazo final) e o apoio ao estado', async () => {
    await abrirTurma(ALUNA);
    await screen.findAllByRole('article');

    const lista1 = within(card(/Lista 1/));
    expect(lista1.getByText('Lista de Exercício')).toBeInTheDocument();
    expect(lista1.getByText(/^Prazo final: \d{2}\/\d{2}(\/\d{4})? às \d{2}:\d{2}$/)).toBeInTheDocument();
    expect(lista1.getByText('Restam 2 dias')).toBeInTheDocument();
    expect(within(card(/Lista 0/)).getByText('Prazo final passou há 1 dia')).toBeInTheDocument();
    expect(within(card(/Trabalho 1/)).getByText('Aguardando avaliação')).toBeInTheDocument();
    expect(within(card(/Prova Teórica 1/)).getByText('Nota e comentário disponíveis')).toBeInTheDocument();
    expect(screen.queryByText(/Entrega: \d/)).not.toBeInTheDocument();
  });

  it('o card inteiro leva ao detalhe da atividade', async () => {
    await abrirTurma(ALUNA);
    await screen.findAllByRole('article');

    expect(within(card(/Lista 1/)).getByRole('link', { name: /Lista 1/ })).toHaveAttribute('href', `/atividades/${A_LISTA_1}`);
  });

  it('o aluno não vê Nova atividade nem Ver entregas', async () => {
    await abrirTurma(ALUNA);
    await screen.findAllByRole('article');

    expect(screen.queryByRole('button', { name: 'Cadastrar atividade' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ver entregas' })).not.toBeInTheDocument();
  });

  it('filtra por estado com os chips e limpa os filtros', async () => {
    const user = await abrirTurma(ALUNA);
    await screen.findAllByRole('article');

    await user.click(screen.getByRole('button', { name: 'Atrasada' }));

    expect(await screen.findAllByRole('article')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Atrasada' })).toHaveAttribute('aria-pressed', 'true');
    expect(card(/Lista 0/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Limpar filtros' }));
    expect(await screen.findAllByRole('article')).toHaveLength(5);
    expect(screen.queryByRole('button', { name: 'Limpar filtros' })).not.toBeInTheDocument();
  });

  it('um filtro sem resultado ensina a limpar', async () => {
    const user = await abrirTurma(ALUNA);
    await screen.findAllByRole('article');

    await user.click(screen.getByRole('button', { name: 'Em grupo' }));

    expect(await screen.findByText('Nenhuma atividade com esses filtros.')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Limpar filtros' }).length).toBeGreaterThan(0);
  });

  it('o seletor de ordenação tem rótulo visível', async () => {
    await abrirTurma(ALUNA);
    await screen.findAllByRole('article');

    expect(screen.getByText('Ordenar por')).toBeVisible();
    expect(screen.getByRole('combobox', { name: 'Ordenar por' })).toBeInTheDocument();
  });

  it('ordena por prazo mais distante primeiro', async () => {
    const user = await abrirTurma(ALUNA);
    await screen.findAllByRole('article');

    await user.click(screen.getByRole('combobox', { name: 'Ordenar por' }));
    await user.click(await screen.findByRole('option', { name: 'Prazo mais distante primeiro' }));

    const titulos = (await screen.findAllByRole('heading', { level: 4 })).map((h) => h.textContent);
    expect(titulos.length).toBeGreaterThan(0);
  });

  it('turma em que o aluno não está inscrito mostra "Turma não encontrada"', async () => {
    await abrirTurma(ALUNO, TURMA_B);

    expect(await screen.findByText('Turma não encontrada.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voltar para Turmas' })).toHaveAttribute('href', '/turmas');
  });
});

describe('Atividades da turma (professor)', () => {
  it('cada card mostra quantas entregas esperam avaliação e o prazo (Lista 2: duas sem nota, prazo encerrado)', async () => {
    await abrirTurma(PROFESSOR);

    const lista2 = within(await screen.findByRole('article', { name: /Lista 2/ }));
    expect(await lista2.findByText('2 a avaliar')).toBeInTheDocument();
    expect(lista2.getByText('Prazo encerrado')).toBeInTheDocument();
    expect(within(screen.getByRole('article', { name: /Lista 1 —/ })).getByText('Vence em breve')).toBeInTheDocument();
    expect(within(screen.getByRole('article', { name: /Lista 1 —/ })).queryByText(/a avaliar/)).not.toBeInTheDocument();
  });

  it('mostra o código de inscrição, Nova atividade e todas as atividades, até as ainda não disponíveis', async () => {
    await abrirTurma(PROFESSOR);

    expect(await screen.findByRole('heading', { name: 'Turma A — Algoritmos', level: 2 })).toBeInTheDocument();
    expect(await screen.findAllByRole('article')).toHaveLength(6);
    expect(screen.getByText('ALG202')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copiar código' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cadastrar atividade' })).toBeInTheDocument();
    expect(within(card(/Projeto Final/)).getByText(/^Disponível a partir de \d{2}\/\d{2}/)).toBeInTheDocument();
  });

  it('cada card leva às entregas, sem selo de estado do aluno', async () => {
    await abrirTurma(PROFESSOR);
    await screen.findAllByRole('article');

    const lista0 = within(card(/Lista 0/));
    expect(lista0.getByRole('link', { name: 'Ver entregas' })).toHaveAttribute('href', `/atividades/${A_LISTA_0}/entregas`);
    expect(lista0.queryByText('Atrasada')).not.toBeInTheDocument();
    expect(within(card(/Projeto Final/)).getByRole('link', { name: 'Ver entregas' })).toHaveAttribute(
      'href',
      `/atividades/${A_PROJETO}/entregas`,
    );
  });

  it('os filtros do professor não têm o grupo Estado', async () => {
    await abrirTurma(PROFESSOR);
    await screen.findAllByRole('article');

    expect(screen.queryByRole('button', { name: 'Pendente' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trabalho' })).toBeInTheDocument();
  });

  it('turma sem atividades ensina o próximo passo', async () => {
    const user = userEvent.setup();
    await entrarComo(PROFESSOR);
    const nova = await api.POST('/turmas', { body: { nome: 'Turma D', disciplina: 'Redes', semestre: '2026.2', diasAula: [2] } });
    renderApp(`/turmas/${nova.data!.id}`);

    expect(await screen.findByText('Nenhuma atividade por aqui ainda.')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Cadastrar atividade' })).toHaveLength(1);
    void user;
  });
});

describe('Nova atividade', () => {
  async function abrirFolha() {
    const user = await abrirTurma(PROFESSOR);
    await screen.findAllByRole('article');
    await user.click(screen.getByRole('button', { name: 'Cadastrar atividade' }));
    const folha = await screen.findByRole('dialog', { name: 'Nova atividade' });
    return { user, folha };
  }

  it('abre com tipo Lista de Exercício e permitir envio com atraso marcado', async () => {
    const { folha } = await abrirFolha();

    expect(within(folha).getByRole('radio', { name: 'Lista de Exercício' })).toBeChecked();
    expect(within(folha).getByLabelText('Permitir envio com atraso após o prazo final')).toBeChecked();
    expect((within(folha).getByLabelText('Disponível em') as HTMLInputElement).value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
    expect(within(folha).queryByLabelText(/Data de entrega/)).not.toBeInTheDocument();
  });

  it('exige nome e prazo final', async () => {
    const { user, folha } = await abrirFolha();

    await user.click(within(folha).getByRole('button', { name: 'Cadastrar atividade' }));

    expect(await within(folha).findByText('Informe o nome da atividade.')).toBeInTheDocument();
    expect(within(folha).getByText('Informe o prazo final.')).toBeInTheDocument();
    expect(within(folha).queryByText(/Confira antes de cadastrar/)).not.toBeInTheDocument();
  });

  it('não aceita prazo final antes de a atividade ficar disponível', async () => {
    const { user, folha } = await abrirFolha();

    await user.type(within(folha).getByLabelText('Nome da atividade'), 'Lista 3');
    fireEvent.change(within(folha).getByLabelText('Disponível em'), { target: { value: '2030-05-10T08:00' } });
    fireEvent.change(within(folha).getByLabelText('Prazo final'), { target: { value: '2030-05-01T23:59' } });
    await user.click(within(folha).getByRole('button', { name: 'Cadastrar atividade' }));

    expect(await within(folha).findByText('O prazo final não pode ser antes de quando a atividade fica disponível.')).toBeInTheDocument();
  });

  it('pede confirmação com as datas antes de cadastrar e a atividade entra na lista', async () => {
    const { user, folha } = await abrirFolha();

    await user.type(within(folha).getByLabelText('Nome da atividade'), 'Lista 3 — Árvores AVL');
    await user.type(within(folha).getByLabelText('Descrição'), 'Rotações simples e duplas.');
    await user.click(within(folha).getByRole('radio', { name: 'Trabalho' }));
    await user.click(within(folha).getByRole('radio', { name: /Alta/ }));
    fireEvent.change(within(folha).getByLabelText('Disponível em'), { target: { value: '2030-05-01T08:00' } });
    fireEvent.change(within(folha).getByLabelText('Prazo final'), { target: { value: '2030-05-20T23:59' } });
    await user.click(within(folha).getByRole('button', { name: 'Cadastrar atividade' }));

    expect(await within(folha).findByText(/Confira antes de cadastrar/)).toBeInTheDocument();
    expect(within(folha).getByText('Lista 3 — Árvores AVL')).toBeInTheDocument();
    expect(within(folha).getByText('01/05/2030 às 08:00')).toBeInTheDocument();
    expect(within(folha).getByText('20/05/2030 às 23:59')).toBeInTheDocument();
    expect(within(folha).getByText('Trabalho · Complexidade alta · Individual')).toBeInTheDocument();

    await user.click(within(folha).getByRole('button', { name: 'Confirmar e cadastrar' }));

    expect(await screen.findByText('Atividade cadastrada')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(await screen.findAllByRole('article')).toHaveLength(7);
    expect(card(/Lista 3 — Árvores AVL/)).toBeInTheDocument();
  });

  it('"Voltar e editar" devolve ao formulário com o que foi digitado', async () => {
    const { user, folha } = await abrirFolha();

    await user.type(within(folha).getByLabelText('Nome da atividade'), 'Lista 3');
    fireEvent.change(within(folha).getByLabelText('Prazo final'), { target: { value: '2030-05-20T23:59' } });
    await user.click(within(folha).getByRole('button', { name: 'Cadastrar atividade' }));
    await user.click(await within(folha).findByRole('button', { name: 'Voltar e editar' }));

    expect(within(folha).getByLabelText('Nome da atividade')).toHaveValue('Lista 3');
    expect(within(folha).getByLabelText('Prazo final')).toHaveValue('2030-05-20T23:59');
  });
});
