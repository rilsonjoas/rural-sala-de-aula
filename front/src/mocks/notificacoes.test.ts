import { describe, expect, it } from 'vitest';
import { api } from '@/lib/api-client';
import { db } from './db';
import { ALUNA, ALUNO, A_LISTA_1, A_PROJETO, E_LISTA2_MARIA, PROFESSOR, TURMA_A } from './fixtures';

async function entrar(u: { email: string; senha: string }) {
  await api.POST('/auth/login', { body: { email: u.email, senha: u.senha } });
}
const ler = async () => (await api.GET('/notificacoes')).data!;
const ativ = (atividadeId: string) => ({ params: { path: { atividadeId } } });

describe('API simulada: notificações', () => {
  it('aviso novo notifica os alunos da turma, e não o professor', async () => {
    await entrar(PROFESSOR);
    await api.POST('/turmas/{turmaId}/avisos', { params: { path: { turmaId: TURMA_A } }, body: { texto: 'Prova adiada' } });
    expect((await ler()).itens.filter((n) => n.tipo === 'AVISO_NOVO')).toHaveLength(0);

    await entrar(ALUNA);
    const itens = (await ler()).itens.filter((n) => n.tipo === 'AVISO_NOVO');
    expect(itens).toHaveLength(1);
    expect(itens[0]).toMatchObject({ turmaId: TURMA_A, lida: false, paraProfessor: false });
  });

  it('editar atividade aberta notifica uma vez; salvar igual não notifica; atividade fechada não notifica', async () => {
    await entrar(PROFESSOR);
    const edicao = { nome: 'Lista 1 editada', tipo: 'LISTA_DE_EXERCICIO' as const, prazoFinal: '2030-01-01T10:00:00Z', aceitaAtraso: true };
    await api.PUT('/atividades/{atividadeId}', { ...ativ(A_LISTA_1), body: edicao });
    await api.PUT('/atividades/{atividadeId}', { ...ativ(A_LISTA_1), body: edicao });
    await api.PUT('/atividades/{atividadeId}', {
      ...ativ(A_PROJETO),
      body: { nome: 'Projeto fechado editado', tipo: 'PROJETO_INDIVIDUAL', prazoFinal: '2030-02-01T10:00:00Z', aceitaAtraso: true },
    });

    await entrar(ALUNA);
    const alteradas = (await ler()).itens.filter((n) => n.tipo === 'ATIVIDADE_ALTERADA');
    expect(alteradas.map((n) => n.atividadeId)).toEqual([A_LISTA_1]);
  });

  it('avaliar notifica o aluno da entrega, de novo na reavaliação', async () => {
    await entrar(PROFESSOR);
    await api.PUT('/entregas/{entregaId}/avaliacao', { params: { path: { entregaId: E_LISTA2_MARIA } }, body: { nota: 6 } });
    await api.PUT('/entregas/{entregaId}/avaliacao', { params: { path: { entregaId: E_LISTA2_MARIA } }, body: { nota: 7 } });

    await entrar(ALUNA);
    expect((await ler()).itens.filter((n) => n.tipo === 'NOTA_PUBLICADA')).toHaveLength(2);
    await entrar(ALUNO);
    expect((await ler()).itens.filter((n) => n.tipo === 'NOTA_PUBLICADA')).toHaveLength(0);
  });

  it('comentário de aluno avisa o professor; resposta avisa o autor; comentário solto do professor não avisa ninguém', async () => {
    await entrar(ALUNA);
    const raiz = (await api.POST('/atividades/{atividadeId}/comentarios', { ...ativ(A_LISTA_1), body: { texto: 'Dúvida' } })).data!;
    await entrar(PROFESSOR);
    const professor = (await ler()).itens.find((n) => n.tipo === 'COMENTARIO_NOVO');
    expect(professor).toMatchObject({ atividadeId: A_LISTA_1, paraProfessor: true });

    await api.POST('/atividades/{atividadeId}/comentarios', { ...ativ(A_LISTA_1), body: { texto: 'Solto' } });
    await api.POST('/atividades/{atividadeId}/comentarios', { ...ativ(A_LISTA_1), body: { texto: 'Resposta', comentarioPaiId: raiz.id } });
    await entrar(ALUNA);
    const aluna = await ler();
    expect(aluna.itens.filter((n) => n.tipo === 'RESPOSTA_NOVA')).toHaveLength(1);
    expect(aluna.itens.filter((n) => n.tipo === 'COMENTARIO_NOVO')).toHaveLength(0);
    await entrar(ALUNO);
    expect((await ler()).itens.filter((n) => n.tipo === 'RESPOSTA_NOVA' || n.tipo === 'COMENTARIO_NOVO')).toHaveLength(0);
  });

  it('atividade nova aparece quando abre depois do início, uma vez só', async () => {
    await entrar(PROFESSOR);
    const nova = (
      await api.POST('/turmas/{turmaId}/atividades', {
        params: { path: { turmaId: TURMA_A } },
        body: { nome: 'Lista nova', tipo: 'LISTA_DE_EXERCICIO', prazoFinal: '2030-03-01T10:00:00Z', aceitaAtraso: true },
      })
    ).data!;
    await entrar(ALUNA);
    await ler();
    const itens = (await ler()).itens.filter((n) => n.tipo === 'ATIVIDADE_NOVA' && n.atividadeId === nova.id);
    expect(itens).toHaveLength(1);
    await entrar(PROFESSOR);
    expect((await ler()).itens.filter((n) => n.tipo === 'ATIVIDADE_NOVA')).toHaveLength(0);
  });

  it('a lista corta em 50 e o contador conta todas; marcar como lida é só do dono', async () => {
    for (let i = 0; i < 55; i += 1) {
      db.notificacoes.push({
        id: `n-${i}`, usuarioId: ALUNA.id, tipo: 'AVISO_NOVO', texto: `Aviso ${i}`, turmaId: TURMA_A,
        atividadeId: null, avisoId: null, criadaEm: new Date(Date.now() - i * 1000).toISOString(), lida: false,
      });
    }
    await entrar(ALUNA);
    const antes = await ler();
    expect(antes.itens).toHaveLength(50);
    expect(antes.naoLidas).toBe(55);

    await entrar(ALUNO);
    await expect(api.POST('/notificacoes/{notificacaoId}/lida', { params: { path: { notificacaoId: 'n-0' } } })).rejects.toMatchObject({ status: 404 });
    await entrar(ALUNA);
    await api.POST('/notificacoes/{notificacaoId}/lida', { params: { path: { notificacaoId: 'n-0' } } });
    expect((await ler()).naoLidas).toBe(54);
  });

  it('quem saiu da turma não vê mais as notificações dela', async () => {
    await entrar(ALUNA);
    db.notificacoes.push({
      id: 'n-x', usuarioId: ALUNA.id, tipo: 'AVISO_NOVO', texto: 'x', turmaId: TURMA_A,
      atividadeId: null, avisoId: null, criadaEm: new Date().toISOString(), lida: false,
    });
    expect((await ler()).naoLidas).toBe(1);
    await api.DELETE('/turmas/{turmaId}/inscricao', { params: { path: { turmaId: TURMA_A } } });
    const depois = await ler();
    expect(depois.itens.filter((n) => n.turmaId === TURMA_A)).toHaveLength(0);
    expect(depois.naoLidas).toBe(0);
  });

  it('sem sessão é 401', async () => {
    await expect(api.GET('/notificacoes')).rejects.toMatchObject({ status: 401 });
  });
});
