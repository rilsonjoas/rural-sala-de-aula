import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { db } from '@/mocks/db';
import { ALUNA, ALUNO, BEATRIZ, GABRIEL, PROFESSOR, TURMA_A } from '@/mocks/fixtures';
import { server } from '@/mocks/server';
import { entrarComo } from '@/test/auth';
import { renderApp } from '@/test/render';

async function abrir(usuario: { email: string; senha: string }) {
  const user = userEvent.setup();
  await entrarComo(usuario);
  renderApp(`/turmas/${TURMA_A}?aba=grupos`);
  await screen.findByRole('button', { name: 'Grupos' });
  return user;
}

function semear(nome: string, status: 'PENDENTE' | 'APROVADO' | 'REPROVADO', integrantesIds: string[]) {
  db.grupos.push({ id: `g-${nome}`, turmaId: TURMA_A, nome, status, criadoPorId: integrantesIds[0], integrantesIds });
}

describe('Grupos da turma: aluno', () => {
  it('mostra as regras, solicita o grupo com um colega e passa a ver o grupo aguardando aprovação', async () => {
    const aluna = await abrir(ALUNA);
    expect(await screen.findByText('Grupos de 2 a 5 integrantes · sem limite de grupos')).toBeInTheDocument();

    await aluna.click(screen.getByRole('button', { name: 'Solicitar grupo' }));
    const folha = await screen.findByRole('dialog', { name: 'Solicitar grupo' });
    await aluna.type(within(folha).getByLabelText('Nome do grupo'), 'Time Alfa');
    await aluna.click(await within(folha).findByRole('checkbox', { name: ALUNO.nome }));
    expect(within(folha).queryByRole('checkbox', { name: ALUNA.nome })).not.toBeInTheDocument();
    await aluna.click(within(folha).getByRole('button', { name: 'Enviar solicitação' }));

    const meu = await screen.findByRole('region', { name: 'Meu grupo' });
    expect(within(meu).getByText('Time Alfa')).toBeInTheDocument();
    expect(within(meu).getByText('Aguardando aprovação')).toBeInTheDocument();
    expect(meu).toHaveTextContent(ALUNO.nome);
    expect(screen.queryByRole('button', { name: 'Solicitar grupo' })).not.toBeInTheDocument();
  });

  it('mostra a mensagem da API quando o pedido fere uma regra', async () => {
    const aluna = await abrir(ALUNA);
    await aluna.click(await screen.findByRole('button', { name: 'Solicitar grupo' }));
    const folha = await screen.findByRole('dialog', { name: 'Solicitar grupo' });
    await aluna.type(within(folha).getByLabelText('Nome do grupo'), 'Sozinha');
    await aluna.click(within(folha).getByRole('button', { name: 'Enviar solicitação' }));

    expect(await within(folha).findByRole('alert')).toHaveTextContent('O grupo precisa de pelo menos 2 integrantes.');
  });

  it('entra em um grupo aprovado com vaga e deixa de ver outros grupos para entrar', async () => {
    semear('Time Beta', 'APROVADO', [BEATRIZ.id, GABRIEL.id]);
    semear('Time Secreto', 'PENDENTE', [ALUNO.id, PROFESSOR.id]);
    const aluna = await abrir(ALUNA);

    const aprovados = await screen.findByRole('region', { name: 'Grupos aprovados' });
    expect(screen.queryByText('Time Secreto')).not.toBeInTheDocument();
    expect(within(aprovados).getByText('2 de 5 integrantes')).toBeInTheDocument();
    await aluna.click(within(aprovados).getByRole('button', { name: 'Entrar no grupo Time Beta' }));

    const meu = await screen.findByRole('region', { name: 'Meu grupo' });
    expect(within(meu).getByText('Time Beta')).toBeInTheDocument();
    expect(within(meu).getByText('Aprovado')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Entrar no grupo/ })).not.toBeInTheDocument();
  });

  it('sai do grupo depois de confirmar e volta a poder solicitar', async () => {
    semear('Time Alfa', 'PENDENTE', [ALUNA.id, ALUNO.id]);
    const aluna = await abrir(ALUNA);

    await aluna.click(await screen.findByRole('button', { name: 'Sair do grupo' }));
    const folha = await screen.findByRole('dialog', { name: 'Sair do grupo?' });
    await aluna.click(within(folha).getByRole('button', { name: 'Confirmar saída' }));

    expect(await screen.findByRole('button', { name: 'Solicitar grupo' })).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Meu grupo' })).not.toBeInTheDocument();
  });

  it('um grupo reprovado aparece como informação e libera novo pedido', async () => {
    semear('Time Velho', 'REPROVADO', [ALUNA.id, ALUNO.id]);
    await abrir(ALUNA);

    expect(await screen.findByText('Time Velho')).toBeInTheDocument();
    expect(screen.getByText('Não aprovado')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Solicitar grupo' })).toBeInTheDocument();
  });

  it('mostra o erro de carregamento e tenta de novo', async () => {
    server.use(http.get('*/api/v1/turmas/:turmaId/grupos', () => HttpResponse.json({ status: 500, message: 'Erro' }, { status: 500 })));
    const aluna = await abrir(ALUNA);

    const alerta = await screen.findByRole('alert');
    server.resetHandlers();
    await aluna.click(within(alerta).getByRole('button', { name: /tentar de novo/i }));
    expect(await screen.findByRole('button', { name: 'Solicitar grupo' })).toBeInTheDocument();
  });
});

describe('Grupos da turma: professor', () => {
  it('salva as regras de formação e vê o aviso de que foram salvas', async () => {
    const professor = await abrir(PROFESSOR);
    const minimo = await screen.findByLabelText('Mínimo de integrantes');
    await professor.clear(minimo);
    await professor.type(minimo, '3');
    const maximo = screen.getByLabelText('Máximo de integrantes');
    await professor.clear(maximo);
    await professor.type(maximo, '4');
    await professor.type(screen.getByLabelText('Limite de grupos da turma'), '6');
    await professor.click(screen.getByRole('button', { name: 'Salvar regras' }));

    expect(await screen.findByText('Regras salvas.')).toBeInTheDocument();
    expect(db.configuracoesDeGrupos[TURMA_A]).toEqual({ minimoIntegrantes: 3, maximoIntegrantes: 4, maximoGrupos: 6 });
  });

  it('mostra a mensagem da API quando o máximo fica abaixo do mínimo', async () => {
    const professor = await abrir(PROFESSOR);
    const maximo = await screen.findByLabelText('Máximo de integrantes');
    await professor.clear(maximo);
    await professor.type(maximo, '1');
    await professor.click(screen.getByRole('button', { name: 'Salvar regras' }));

    expect(await screen.findByText('O máximo de integrantes não pode ser menor que o mínimo.')).toBeInTheDocument();
  });

  it('aprova uma solicitação, que passa para os grupos aprovados, e reprova outra', async () => {
    semear('Time Alfa', 'PENDENTE', [ALUNA.id, ALUNO.id]);
    semear('Time Beta', 'PENDENTE', [BEATRIZ.id, GABRIEL.id]);
    const professor = await abrir(PROFESSOR);

    const pendentes = await screen.findByRole('region', { name: 'Solicitações pendentes' });
    expect(within(pendentes).getByText(`${ALUNA.nome}, ${ALUNO.nome}`)).toBeInTheDocument();
    await professor.click(within(pendentes).getByRole('button', { name: 'Aprovar Time Alfa' }));
    await professor.click(await within(pendentes).findByRole('button', { name: 'Reprovar Time Beta' }));

    const aprovados = await screen.findByRole('region', { name: 'Grupos aprovados' });
    expect(within(aprovados).getByText('Time Alfa')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Solicitações pendentes' })).not.toBeInTheDocument();
    expect(db.grupos.find((g) => g.nome === 'Time Beta')?.status).toBe('REPROVADO');
  });

  it('sem nenhum grupo, explica que as solicitações dos alunos aparecem ali', async () => {
    await abrir(PROFESSOR);
    expect(await screen.findByText('Nenhum grupo por enquanto. As solicitações dos alunos aparecem aqui.')).toBeInTheDocument();
  });
});
