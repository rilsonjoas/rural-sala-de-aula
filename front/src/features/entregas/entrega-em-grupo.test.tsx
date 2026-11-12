import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { db } from '@/mocks/db';
import { ALUNA, B_SEMINARIO, PROFESSOR, PROFESSORA, TURMA_B } from '@/mocks/fixtures';
import { entrarComo } from '@/test/auth';
import { renderApp } from '@/test/render';

// Projeto em grupo (RF06): a entrega é feita em nome do grupo aprovado e a nota vale para todos os integrantes.
// Na Turma B, Maria e Paulo são alunos e a professora é a Carla.

const pdf = (nome: string) => new File([new Uint8Array(16)], nome, { type: 'application/pdf' });

function semearGrupo(status: 'PENDENTE' | 'APROVADO') {
  db.grupos.push({ id: 'g-time', turmaId: TURMA_B, nome: 'Time Beta', status, criadoPorId: ALUNA.id, integrantesIds: [ALUNA.id, PROFESSOR.id] });
}

async function abrirComoAluno() {
  const user = userEvent.setup();
  await entrarComo(ALUNA);
  renderApp(`/atividades/${B_SEMINARIO}`);
  await screen.findByRole('heading', { name: /Seminário/, level: 2 });
  return user;
}

describe('Entrega em grupo: aluno', () => {
  it('sem grupo aprovado explica e leva à aba Grupos, sem oferecer o envio', async () => {
    semearGrupo('PENDENTE');
    await abrirComoAluno();

    const secao = within(await screen.findByRole('region', { name: 'Entrega do grupo' }));
    expect(await secao.findByText(/a entrega é feita em nome de um grupo aprovado/)).toBeInTheDocument();
    expect(secao.getByRole('link', { name: 'Ir para os grupos da turma' })).toHaveAttribute('href', `/turmas/${TURMA_B}?aba=grupos`);
    expect(secao.queryByRole('button', { name: 'Enviar entrega' })).not.toBeInTheDocument();
  });

  it('com grupo aprovado envia em nome do grupo e vê quem são os integrantes', async () => {
    semearGrupo('APROVADO');
    const user = await abrirComoAluno();

    const secao = within(await screen.findByRole('region', { name: 'Entrega do grupo' }));
    await user.upload(await secao.findByLabelText('Escolher arquivo'), pdf('seminario.pdf'));
    await user.click(secao.getByRole('button', { name: 'Enviar entrega' }));

    expect(await screen.findByText('Entrega enviada.')).toBeInTheDocument();
    expect(await secao.findByText(/Grupo Time Beta: .*Maria Clara Albuquerque, Paulo Silva · enviada por Maria Clara Albuquerque/)).toBeInTheDocument();
    expect(db.entregas.find((e) => e.atividadeId === B_SEMINARIO)?.grupoId).toBe('g-time');
  });

  it('o colega de grupo vê a mesma entrega e pode substituir o arquivo', async () => {
    semearGrupo('APROVADO');
    db.entregas.push({
      id: 'e-grupo', atividadeId: B_SEMINARIO, alunoId: ALUNA.id, grupoId: 'g-time',
      nomeOriginal: 'v1.pdf', tamanhoBytes: 10, enviadaEm: new Date().toISOString(), conteudo: 'x',
    });
    const user = userEvent.setup();
    await entrarComo(PROFESSOR); // Paulo é aluno na Turma B
    renderApp(`/atividades/${B_SEMINARIO}`);

    const secao = within(await screen.findByRole('region', { name: 'Entrega do grupo' }));
    expect(await secao.findByText('v1.pdf')).toBeInTheDocument();
    await user.click(secao.getByRole('button', { name: 'Enviar outro arquivo' }));
    await user.upload(secao.getByLabelText('Escolher arquivo'), pdf('v2.pdf'));
    await user.click(secao.getByRole('button', { name: 'Enviar entrega' }));

    expect(await secao.findByText('v2.pdf')).toBeInTheDocument();
    expect(db.entregas.filter((e) => e.atividadeId === B_SEMINARIO)).toHaveLength(1);
    expect(db.entregas.find((e) => e.id === 'e-grupo')?.alunoId).toBe(PROFESSOR.id); // quem enviou por último
  });
});

describe('Entrega em grupo: professor', () => {
  it('vê uma linha por grupo e a nota vale para todos os integrantes, que são avisados', async () => {
    semearGrupo('APROVADO');
    db.entregas.push({
      id: 'e-grupo', atividadeId: B_SEMINARIO, alunoId: ALUNA.id, grupoId: 'g-time',
      nomeOriginal: 'seminario.pdf', tamanhoBytes: 10, enviadaEm: new Date().toISOString(), conteudo: 'x',
    });
    const user = userEvent.setup();
    await entrarComo(PROFESSORA);
    renderApp(`/atividades/${B_SEMINARIO}/entregas`);

    const item = within(await screen.findByRole('article', { name: /Grupo Time Beta/ }));
    expect(item.getByText(/Maria Clara Albuquerque, Paulo Silva · enviada por Maria Clara Albuquerque/)).toBeInTheDocument();
    await user.click(item.getByRole('button', { name: 'Avaliar entrega de Grupo Time Beta' }));
    const folha = await screen.findByRole('dialog');
    await user.type(within(folha).getByLabelText('Nota (0 a 10)'), '9');
    await user.click(within(folha).getByRole('button', { name: 'Salvar avaliação' }));

    expect(await screen.findByText('Avaliação salva.')).toBeInTheDocument();
    await waitFor(() => expect(db.avaliacoes.find((a) => a.entregaId === 'e-grupo')?.nota).toBe(9));
    const avisados = db.notificacoes.filter((n) => n.tipo === 'NOTA_PUBLICADA').map((n) => n.usuarioId).sort();
    expect(avisados).toEqual([ALUNA.id, PROFESSOR.id].sort());
  });
});
