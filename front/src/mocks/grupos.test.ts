import { describe, expect, it } from 'vitest';
import { api } from '@/lib/api-client';
import { ALUNA, ALUNO, BEATRIZ, GABRIEL, PROFESSOR, PROFESSORA, TURMA_A } from './fixtures';

async function entrar(u: { email: string; senha: string }) {
  await api.POST('/auth/login', { body: { email: u.email, senha: u.senha } });
}
/** Status HTTP da chamada; o cliente lança ApiError nos erros. */
const codigo = (chamada: Promise<{ response: { status: number } }>) =>
  chamada.then((r) => r.response.status, (e: { status: number }) => e.status);
const turma = { params: { path: { turmaId: TURMA_A } } };
const grupo = (grupoId: string) => ({ params: { path: { grupoId } } });
const listar = async () => (await api.GET('/turmas/{turmaId}/grupos', turma)).data!;
const solicitar = (nome: string, integrantesIds: string[]) =>
  api.POST('/turmas/{turmaId}/grupos', { ...turma, body: { nome, integrantesIds } });
const configurar = (corpo: { minimoIntegrantes: number; maximoIntegrantes: number; maximoGrupos?: number | null }) =>
  api.PUT('/turmas/{turmaId}/grupos/configuracao', { ...turma, body: corpo });
const decidir = (grupoId: string, aprovado: boolean) =>
  api.POST('/grupos/{grupoId}/aprovacao', { ...grupo(grupoId), body: { aprovado } });

/** A aluna pede o grupo e o professor aprova; devolve o grupo aprovado. */
async function grupoAprovado(nome: string, colegas: string[]) {
  await entrar(ALUNA);
  const id = (await solicitar(nome, colegas)).data!.id;
  await entrar(PROFESSOR);
  return (await decidir(id, true)).data!;
}

describe('API simulada: grupos (proposta de contrato)', () => {
  it('a configuração começa em 2 a 5 integrantes, sem limite de grupos; só o professor muda e o máximo não fica abaixo do mínimo', async () => {
    await entrar(ALUNA);
    expect((await api.GET('/turmas/{turmaId}/grupos/configuracao', turma)).data).toEqual({ minimoIntegrantes: 2, maximoIntegrantes: 5, maximoGrupos: null });
    expect(await codigo(configurar({ minimoIntegrantes: 1, maximoIntegrantes: 3 }))).toBe(403);

    await entrar(PROFESSOR);
    expect(await codigo(configurar({ minimoIntegrantes: 4, maximoIntegrantes: 3 }))).toBe(422);
    const salva = await configurar({ minimoIntegrantes: 2, maximoIntegrantes: 3, maximoGrupos: 4 });
    expect(salva.data).toEqual({ minimoIntegrantes: 2, maximoIntegrantes: 3, maximoGrupos: 4 });
  });

  it('o aluno solicita e entra como integrante; nasce pendente e outros alunos só veem os aprovados e os próprios', async () => {
    await entrar(ALUNA);
    const pedido = await solicitar('  Time Alfa ', [ALUNO.id]);
    expect(pedido.response.status).toBe(201);
    expect(pedido.data).toMatchObject({ nome: 'Time Alfa', status: 'PENDENTE', criadoPorId: ALUNA.id, turmaId: TURMA_A });
    expect(pedido.data!.integrantes.map((i) => i.id)).toEqual([ALUNA.id, ALUNO.id]);

    expect(await listar()).toHaveLength(1);
    await entrar(BEATRIZ);
    expect(await listar()).toHaveLength(0);
    await entrar(PROFESSOR);
    expect(await listar()).toHaveLength(1);
  });

  it('recusa o pedido fora das regras: poucos ou muitos integrantes, aluno de fora, aluno já em grupo e limite de grupos', async () => {
    await entrar(PROFESSOR);
    await configurar({ minimoIntegrantes: 2, maximoIntegrantes: 3, maximoGrupos: 1 });
    await entrar(ALUNA);
    expect(await codigo(solicitar('Sozinha', []))).toBe(422);
    expect(await codigo(solicitar('Grande', [ALUNO.id, BEATRIZ.id, GABRIEL.id]))).toBe(422);
    expect(await codigo(solicitar('De fora', [PROFESSORA.id]))).toBe(422);
    expect(await codigo(solicitar('', [ALUNO.id]))).toBe(422);

    expect(await codigo(solicitar('Time Alfa', [ALUNO.id]))).toBe(201);
    expect(await codigo(solicitar('Repetido', [ALUNO.id]))).toBe(422);
    await entrar(BEATRIZ);
    expect(await codigo(solicitar('Time Beta', [GABRIEL.id]))).toBe(422); // limite de 1 grupo
  });

  it('o professor aprova ou reprova uma vez; aluno não decide; reprovado libera os alunos e não conta no limite', async () => {
    await entrar(ALUNA);
    const id = (await solicitar('Time Alfa', [ALUNO.id])).data!.id;
    expect(await codigo(decidir(id, true))).toBe(403);

    await entrar(PROFESSOR);
    await configurar({ minimoIntegrantes: 2, maximoIntegrantes: 5, maximoGrupos: 1 });
    expect((await decidir(id, false)).data!.status).toBe('REPROVADO');
    expect(await codigo(decidir(id, true))).toBe(409);

    await entrar(ALUNA);
    expect(await codigo(solicitar('Time Alfa 2', [ALUNO.id]))).toBe(201);
  });

  it('o aluno entra em grupo aprovado com vaga, uma vez só; pendente e cheio não aceitam', async () => {
    const aprovado = await grupoAprovado('Time Alfa', [ALUNO.id]);
    await entrar(ALUNA);
    expect(await codigo(solicitar('Time Pendente', [GABRIEL.id]))).toBe(422); // ALUNA já está no Time Alfa

    await entrar(BEATRIZ);
    const pendenteDeBeatriz = (await solicitar('Time Beta', [GABRIEL.id])).data!;
    expect(await codigo(api.POST('/grupos/{grupoId}/integrantes', grupo(pendenteDeBeatriz.id)))).toBe(422);
    await entrar(PROFESSOR);
    await configurar({ minimoIntegrantes: 2, maximoIntegrantes: 2 });
    await entrar(BEATRIZ);
    await api.DELETE('/grupos/{grupoId}/integrantes', grupo(pendenteDeBeatriz.id));
    expect(await codigo(api.POST('/grupos/{grupoId}/integrantes', grupo(aprovado.id)))).toBe(422); // cheio

    await entrar(PROFESSOR);
    await configurar({ minimoIntegrantes: 2, maximoIntegrantes: 4 });
    await entrar(BEATRIZ);
    const entrou = await api.POST('/grupos/{grupoId}/integrantes', grupo(aprovado.id));
    expect(entrou.data!.integrantes.map((i) => i.id)).toContain(BEATRIZ.id);
    expect(await codigo(api.POST('/grupos/{grupoId}/integrantes', grupo(aprovado.id)))).toBe(422); // já está
  });

  it('sair: aprovado não pode ficar abaixo do mínimo; pendente sai e o grupo vazio some', async () => {
    const aprovado = await grupoAprovado('Time Alfa', [ALUNO.id]);
    await entrar(ALUNO);
    expect(await codigo(api.DELETE('/grupos/{grupoId}/integrantes', grupo(aprovado.id)))).toBe(422);

    await entrar(BEATRIZ);
    await api.POST('/grupos/{grupoId}/integrantes', grupo(aprovado.id));
    await entrar(ALUNO);
    expect(await codigo(api.DELETE('/grupos/{grupoId}/integrantes', grupo(aprovado.id)))).toBe(204);

    await entrar(GABRIEL);
    const pendente = await codigo(solicitar('Time Beta', [])); // mínimo 2: recusado
    expect(pendente).toBe(422);
    await entrar(PROFESSOR);
    await configurar({ minimoIntegrantes: 1, maximoIntegrantes: 5 });
    await entrar(GABRIEL);
    const solo = (await solicitar('Solo', [])).data!;
    expect(await codigo(api.DELETE('/grupos/{grupoId}/integrantes', grupo(solo.id)))).toBe(204);
    expect((await listar()).some((g) => g.id === solo.id)).toBe(false);
  });

  it('lista os alunos da turma em ordem alfabética para montar o grupo, só para quem é da turma', async () => {
    await entrar(ALUNA);
    const alunos = (await api.GET('/turmas/{turmaId}/alunos', turma)).data!;
    expect(alunos.map((a) => a.nome)).toEqual([...alunos.map((a) => a.nome)].sort((a, b) => a.localeCompare(b, 'pt-BR')));
    expect(alunos.map((a) => a.id)).toEqual(expect.arrayContaining([ALUNA.id, ALUNO.id, BEATRIZ.id, GABRIEL.id]));

    await entrar(PROFESSORA);
    expect(await codigo(api.GET('/turmas/{turmaId}/alunos', turma))).toBe(403);
  });
});
