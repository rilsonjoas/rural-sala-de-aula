import { describe, expect, it } from 'vitest';
import { api } from '@/lib/api-client';
import { ALUNA, A_LISTA_1, A_PROJETO, A_PROVA_1, PROFESSOR } from './fixtures';

async function entrar(u: { email: string; senha: string }) {
  await api.POST('/auth/login', { body: { email: u.email, senha: u.senha } });
}
const path = (atividadeId: string) => ({ params: { path: { atividadeId } } });

describe('API simulada: comentários em atividade', () => {
  it('aluno comenta e o professor responde; resposta a resposta fica sob o original', async () => {
    await entrar(ALUNA);
    const raiz = (await api.POST('/atividades/{atividadeId}/comentarios', { ...path(A_LISTA_1), body: { texto: ' Dúvida ' } })).data!;
    expect(raiz).toMatchObject({ atividadeId: A_LISTA_1, avisoId: null, texto: 'Dúvida' });

    await entrar(PROFESSOR);
    const resposta = (await api.POST('/atividades/{atividadeId}/comentarios', { ...path(A_LISTA_1), body: { texto: 'R1', comentarioPaiId: raiz.id } })).data!;
    const nivel2 = (await api.POST('/atividades/{atividadeId}/comentarios', { ...path(A_LISTA_1), body: { texto: 'R2', comentarioPaiId: resposta.id } })).data!;
    expect(nivel2.comentarioPaiId).toBe(raiz.id);

    const lista = (await api.GET('/atividades/{atividadeId}/comentarios', path(A_LISTA_1))).data!;
    expect(lista.map((c) => c.texto)).toEqual(['Dúvida', 'R1', 'R2']);
  });

  it('recusa texto vazio e pai de outra atividade (422)', async () => {
    await entrar(ALUNA);
    const raiz = (await api.POST('/atividades/{atividadeId}/comentarios', { ...path(A_LISTA_1), body: { texto: 'x' } })).data!;
    await expect(api.POST('/atividades/{atividadeId}/comentarios', { ...path(A_LISTA_1), body: { texto: '  ' } })).rejects.toMatchObject({ status: 422 });
    await expect(
      api.POST('/atividades/{atividadeId}/comentarios', { ...path(A_PROVA_1), body: { texto: 'y', comentarioPaiId: raiz.id } }),
    ).rejects.toMatchObject({ status: 422 });
  });

  it('aluno não lê nem comenta em atividade que ainda não abriu (404); sem sessão é 401', async () => {
    await expect(api.GET('/atividades/{atividadeId}/comentarios', path(A_LISTA_1))).rejects.toMatchObject({ status: 401 });
    await entrar(ALUNA);
    await expect(api.GET('/atividades/{atividadeId}/comentarios', path(A_PROJETO))).rejects.toMatchObject({ status: 404 });
    await expect(api.POST('/atividades/{atividadeId}/comentarios', { ...path(A_PROJETO), body: { texto: 'x' } })).rejects.toMatchObject({ status: 404 });
  });
});
