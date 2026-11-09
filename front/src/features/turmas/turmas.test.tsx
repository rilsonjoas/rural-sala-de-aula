import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it, vi } from 'vitest';
import { api } from '@/lib/api-client';
import { server } from '@/mocks/server';
import { ALUNA, ALUNO, PROFESSOR, TURMA_A, TURMA_B } from '@/mocks/fixtures';
import { entrarComo } from '@/test/auth';
import { renderApp } from '@/test/render';

async function abrirTurmas(usuario: { email: string; senha: string }) {
  const user = userEvent.setup();
  await entrarComo(usuario);
  renderApp('/turmas');
  await screen.findByRole('heading', { name: 'Minhas turmas', level: 2 });
  return user;
}

const card = (nome: string) => screen.getByRole('article', { name: new RegExp(nome) });

describe('Turmas do aluno', () => {
  it('mostra o título, o botão Entrar em turma e as turmas do semestre mais recente', async () => {
    await abrirTurmas(ALUNA);

    expect(await screen.findByText('2 turmas')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Entrar em turma' })[0]).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Semestre' })).toHaveTextContent('Semestre 2026.2');
    expect(screen.getAllByRole('article')).toHaveLength(2);
    expect(screen.queryByRole('article', { name: /Banco de Dados/ })).not.toBeInTheDocument();
  });

  it('cada card mostra disciplina, professor, dias e os selos de pendentes e atrasadas', async () => {
    await abrirTurmas(ALUNA);
    await screen.findByText('2 turmas');

    const a = within(card('Turma A — Algoritmos'));
    expect(a.getByText('Algoritmos e Estruturas de Dados II')).toBeInTheDocument();
    expect(a.getByText('Prof. Paulo Silva')).toBeInTheDocument();
    expect(a.getByText('Seg · Qua')).toBeInTheDocument();
    expect(a.getByText('2026.2')).toBeInTheDocument();
    expect(await a.findByText('1 vence em breve')).toBeInTheDocument();
    expect(a.queryByText('1 pendente')).not.toBeInTheDocument();
    expect(a.getByText('1 atrasada')).toBeInTheDocument();
    expect(a.getByRole('link', { name: /Ver turma/ })).toHaveAttribute('href', `/turmas/${TURMA_A}`);

    const b = within(card('Turma B — Programação Web'));
    // Prática 2 vence em 1 dia e Seminário em 15: um selo âmbar e um de pendente, sem contar a mesma atividade duas vezes.
    expect(await b.findByText('1 vence em breve')).toBeInTheDocument();
    expect(b.getByText('1 pendente')).toBeInTheDocument();
    expect(b.queryByText(/atrasada/)).not.toBeInTheDocument();
    expect(a.queryByText('Código de inscrição')).not.toBeInTheDocument();
  });

  it('"Todos os semestres" mostra também a turma do semestre anterior, que está em dia', async () => {
    const user = await abrirTurmas(ALUNA);
    await screen.findByText('2 turmas');

    await user.click(screen.getByRole('combobox', { name: 'Semestre' }));
    await user.click(await screen.findByRole('option', { name: 'Todos os semestres' }));

    expect(await screen.findByText('3 turmas')).toBeInTheDocument();
    expect(within(card('Turma C — Banco de Dados')).getByText('Em dia')).toBeInTheDocument();
  });

  it('entra em uma turma pelo código (maiúsculas e espaços ignorados) e ela aparece na lista', async () => {
    const user = await abrirTurmas(ALUNO);
    await screen.findByText('2 turmas');

    await user.click(screen.getAllByRole('button', { name: 'Entrar em turma' })[0]);
    const folha = await screen.findByRole('dialog', { name: 'Entrar em turma' });
    expect(within(folha).getByText('Peça o código ao professor')).toBeInTheDocument();
    await user.type(within(folha).getByLabelText('Código da turma'), ' web 404 ');
    await user.click(within(folha).getByRole('button', { name: 'Entrar na turma' }));

    expect(await screen.findByText('3 turmas')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('article', { name: /Turma B — Programação Web/ })).toBeInTheDocument();
  });

  it('código inexistente e turma repetida aparecem no campo, sem fechar a folha', async () => {
    const user = await abrirTurmas(ALUNO);
    await screen.findByText('2 turmas');
    await user.click(screen.getAllByRole('button', { name: 'Entrar em turma' })[0]);
    const folha = await screen.findByRole('dialog', { name: 'Entrar em turma' });

    await user.type(within(folha).getByLabelText('Código da turma'), 'ZZZZZZ');
    await user.click(within(folha).getByRole('button', { name: 'Entrar na turma' }));
    expect(await within(folha).findByText('Não encontramos uma turma com esse código. Confira com o professor.')).toBeInTheDocument();
    expect(within(folha).getByLabelText('Código da turma')).toHaveAttribute('aria-invalid', 'true');

    await user.clear(within(folha).getByLabelText('Código da turma'));
    await user.type(within(folha).getByLabelText('Código da turma'), 'ALG202');
    await user.click(within(folha).getByRole('button', { name: 'Entrar na turma' }));
    expect(await within(folha).findByText('Você já está nesta turma.')).toBeInTheDocument();
  });

  it('exige o código antes de enviar', async () => {
    const user = await abrirTurmas(ALUNO);
    await screen.findByText('2 turmas');
    await user.click(screen.getAllByRole('button', { name: 'Entrar em turma' })[0]);
    const folha = await screen.findByRole('dialog', { name: 'Entrar em turma' });

    await user.click(within(folha).getByRole('button', { name: 'Entrar na turma' }));

    expect(await within(folha).findByText('Informe o código da turma.')).toBeInTheDocument();
  });

  it('sem turmas, o estado vazio ensina o que fazer e oferece as ações', async () => {
    await api.POST('/auth/register', { body: { nome: 'Nova Aluna', email: 'nova@ufrpe.br', senha: 'senha1234' } });
    renderApp('/turmas');
    await screen.findByRole('heading', { name: 'Minhas turmas', level: 2 });

    expect(await screen.findByText('Você ainda não está em nenhuma turma. Cadastre uma turma para lecionar ou entre com o código fornecido pelo professor.')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Entrar em turma' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Cadastrar turma' })).toHaveLength(1);
  });

  it('se a API falhar, mostra o erro com "Tentar de novo" e recupera', async () => {
    const user = userEvent.setup();
    await entrarComo(ALUNA);
    server.use(http.get('*/api/v1/turmas', () => HttpResponse.json({ status: 500, message: 'Erro interno.' }, { status: 500 })));
    renderApp('/turmas');

    expect(await screen.findByRole('alert')).toHaveTextContent('Não conseguimos carregar suas turmas. Verifique a conexão e tente de novo.');

    server.resetHandlers();
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('2 turmas')).toBeInTheDocument();
  });

  it('enquanto carrega, mostra o esqueleto', async () => {
    await entrarComo(ALUNA);
    renderApp('/turmas');

    expect(await screen.findByRole('status', { name: 'Carregando' })).toBeInTheDocument();
    await screen.findByText('2 turmas');
    expect(screen.queryByRole('status', { name: 'Carregando' })).not.toBeInTheDocument();
  });
});

describe('Turmas do professor', () => {
  it('mostra Nova turma, o semestre mais recente e o código de inscrição de cada turma', async () => {
    await abrirTurmas(PROFESSOR);

    expect(await screen.findByText('3 turmas')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Cadastrar turma' })[0]).toBeInTheDocument();
    const a = within(card('Turma A — Algoritmos'));
    expect(a.getByText('Código de inscrição')).toBeInTheDocument();
    expect(a.getByText('ALG202')).toBeInTheDocument();
    expect(a.getByText('Seg · Qua')).toBeInTheDocument();
    expect(a.queryByText(/Prof\./)).not.toBeInTheDocument();
    expect(a.queryByText(/pendente/)).not.toBeInTheDocument();
    expect(a.getByRole('link', { name: /Ver turma/ })).toHaveAttribute('href', `/turmas/${TURMA_A}`);
  });

  it('copia o código de inscrição', async () => {
    const user = await abrirTurmas(PROFESSOR);
    await screen.findByText('3 turmas');

    const escrever = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: escrever }, configurable: true });

    await user.click(within(card('Turma A — Algoritmos')).getByRole('button', { name: 'Copiar código' }));

    expect(escrever).toHaveBeenCalledWith('ALG202');
    expect(await screen.findByText('Código copiado')).toBeInTheDocument();
  });

  it('cadastra a turma, mostra o código gerado e a turma entra na lista', async () => {
    const user = await abrirTurmas(PROFESSOR);
    await screen.findByText('3 turmas');

    await user.click(screen.getAllByRole('button', { name: 'Cadastrar turma' })[0]);
    const folha = await screen.findByRole('dialog', { name: 'Nova turma' });
    expect(within(folha).getByText('Formato: 2026.1 ou 2026.2')).toBeInTheDocument();
    expect(within(folha).queryByLabelText('Código')).not.toBeInTheDocument();

    await user.type(within(folha).getByLabelText('Nome da turma'), 'Turma D — Redes');
    await user.clear(within(folha).getByLabelText('Semestre'));
    await user.type(within(folha).getByLabelText('Semestre'), '2026.2');
    await user.click(within(folha).getByRole('checkbox', { name: 'Ter' }));
    await user.click(within(folha).getByRole('checkbox', { name: 'Qui' }));
    await user.click(within(folha).getByRole('button', { name: 'Cadastrar turma' }));

    const sucesso = await within(folha).findByText(/Turma criada\. Código de inscrição: [A-Z2-9]{6}/);
    expect(sucesso).toBeInTheDocument();
    expect(within(folha).getByRole('button', { name: 'Copiar código' })).toBeInTheDocument();

    await user.click(within(folha).getByRole('button', { name: 'Concluir' }));
    expect(await screen.findByText('4 turmas')).toBeInTheDocument();
    expect(within(card('Turma D — Redes')).getByText('Ter · Qui')).toBeInTheDocument();
  });

  it('valida os campos da turma no próprio campo', async () => {
    const user = await abrirTurmas(PROFESSOR);
    await screen.findByText('3 turmas');
    await user.click(screen.getAllByRole('button', { name: 'Cadastrar turma' })[0]);
    const folha = await screen.findByRole('dialog', { name: 'Nova turma' });

    await user.clear(within(folha).getByLabelText('Semestre'));
    await user.type(within(folha).getByLabelText('Semestre'), '2026');
    await user.click(within(folha).getByRole('button', { name: 'Cadastrar turma' }));

    expect(await within(folha).findByText('Informe o nome da turma.')).toBeInTheDocument();
    expect(within(folha).getByText('Use o formato 2026.1 ou 2026.2.')).toBeInTheDocument();
  });

  it('o semestre já vem preenchido com o semestre corrente', async () => {
    const user = await abrirTurmas(PROFESSOR);
    await screen.findByText('3 turmas');
    await user.click(screen.getAllByRole('button', { name: 'Cadastrar turma' })[0]);
    const folha = await screen.findByRole('dialog', { name: 'Nova turma' });

    expect(within(folha).getByLabelText('Semestre')).toHaveValue(
      `${new Date().getFullYear()}.${new Date().getMonth() < 6 ? 1 : 2}`,
    );
  });

  it('sem turmas, mostra o estado vazio permitindo criar ou entrar', async () => {
    await api.POST('/auth/register', { body: { nome: 'Prof Nova', email: 'profnova@ufrpe.br', senha: 'senha1234' } });
    renderApp('/turmas');

    expect(await screen.findByText('Você ainda não está em nenhuma turma. Cadastre uma turma para lecionar ou entre com o código fornecido pelo professor.')).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Cadastrar turma' })).toHaveLength(1);
  });
});

void TURMA_B;
