import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { db } from '@/mocks/db';
import { ALUNA, ALUNO, BEATRIZ, PROFESSOR, TURMA_A } from '@/mocks/fixtures';
import { entrarComo } from '@/test/auth';
import { renderApp } from '@/test/render';

// RF13: aviso para a turma toda, para grupos ou para alunos específicos.

async function abrirMural(usuario: { email: string; senha: string }) {
  const user = userEvent.setup();
  await entrarComo(usuario);
  renderApp(`/turmas/${TURMA_A}`);
  await screen.findByRole('heading', { name: 'Turma A — Algoritmos', level: 2 });
  return user;
}

function semearAviso(texto: string, destinatariosIds?: string[]) {
  db.avisos.unshift({
    id: `av-${texto}`, turmaId: TURMA_A, autorId: PROFESSOR.id, autorNome: PROFESSOR.nome, texto,
    horario: new Date().toISOString(), comentarios: [], ...(destinatariosIds ? { destinatariosIds } : {}),
  });
}

async function abrirComposer(user: ReturnType<typeof userEvent.setup>, texto: string) {
  await user.click(await screen.findByText('Escreva um comunicado para a turma...'));
  await user.type(screen.getByPlaceholderText(/Escreva um comunicado ou orientação/), texto);
}

describe('Aviso direcionado: professor', () => {
  it('escolhe um aluno, publica e vê para quem foi; só ele é avisado', async () => {
    const professor = await abrirMural(PROFESSOR);
    await abrirComposer(professor, 'Reunião só com o Lucas');
    await professor.click(screen.getByRole('radio', { name: 'Só para grupos ou alunos' }));
    await professor.click(await within(screen.getByRole('group', { name: 'Alunos' })).findByRole('checkbox', { name: ALUNO.nome }));
    await professor.click(screen.getByRole('button', { name: 'Postar' }));

    const cartao = within((await screen.findByText('Reunião só com o Lucas')).closest('article') as HTMLElement);
    expect(cartao.getByText(`Só para: ${ALUNO.nome}`)).toBeInTheDocument();
    const avisados = db.notificacoes.filter((n) => n.tipo === 'AVISO_NOVO').map((n) => n.usuarioId);
    expect(avisados).toEqual([ALUNO.id]);
  });

  it('escolhe um grupo e o aviso vai para os integrantes dele', async () => {
    db.grupos.push({ id: 'g-1', turmaId: TURMA_A, nome: 'Time Alfa', status: 'APROVADO', criadoPorId: ALUNA.id, integrantesIds: [ALUNA.id, BEATRIZ.id] });
    const professor = await abrirMural(PROFESSOR);
    await abrirComposer(professor, 'Ensaio do grupo');
    await professor.click(screen.getByRole('radio', { name: 'Só para grupos ou alunos' }));
    await professor.click(await within(screen.getByRole('group', { name: 'Grupos' })).findByRole('checkbox', { name: 'Time Alfa' }));
    await professor.click(screen.getByRole('button', { name: 'Postar' }));

    await screen.findByText('Ensaio do grupo');
    expect(db.notificacoes.filter((n) => n.tipo === 'AVISO_NOVO').map((n) => n.usuarioId).sort()).toEqual([ALUNA.id, BEATRIZ.id].sort());
  });

  it('não deixa postar direcionado sem escolher ninguém e avisa o motivo', async () => {
    const professor = await abrirMural(PROFESSOR);
    await abrirComposer(professor, 'Sem destino');
    await professor.click(screen.getByRole('radio', { name: 'Só para grupos ou alunos' }));

    expect(screen.getByRole('button', { name: 'Postar' })).toBeDisabled();
    expect(screen.getByText('Escolha ao menos um grupo ou aluno.')).toBeInTheDocument();
  });
});

describe('Aviso direcionado: aluno', () => {
  it('só vê o aviso direcionado quem é destinatário, e o aviso da turma toda todos veem', async () => {
    semearAviso('Para todos');
    semearAviso('Só para o Lucas', [ALUNO.id]);

    await abrirMural(ALUNA);
    expect(await screen.findByText('Para todos')).toBeInTheDocument();
    expect(screen.queryByText('Só para o Lucas')).not.toBeInTheDocument();
  });

  it('o destinatário vê o aviso com a etiqueta e sem a lista de colegas', async () => {
    semearAviso('Só para o Lucas', [ALUNO.id]);

    await abrirMural({ email: ALUNO.email, senha: ALUNO.senha });
    const cartao = within((await screen.findByText('Só para o Lucas')).closest('article') as HTMLElement);
    expect(cartao.getByText('Aviso só para você e outros alunos escolhidos')).toBeInTheDocument();
  });
});
