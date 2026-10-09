import { describe, expect, it } from 'vitest';
import { enviarEntrega } from '@/features/entregas/enviar-entrega';
import { api } from '@/lib/api-client';
import { entrarComo } from '@/test/auth';
import {
  ALUNA,
  ALUNO,
  A_LISTA_0,
  A_LISTA_1,
  A_LISTA_2,
  A_PROJETO,
  A_PROVA_1,
  A_TRABALHO_1,
  BEATRIZ,
  B_PRATICA_2,
  E_LISTA2_MARIA,
  PROFESSOR,
  PROFESSORA,
  TURMA_A,
  TURMA_B,
  TURMA_C,
} from './fixtures';

const pdf = (nome = 'trabalho.pdf', tamanho = 10) => new File([new Uint8Array(tamanho)], nome, { type: 'application/pdf' });

describe('API simulada: turmas', () => {
  it('a aluna vê as três turmas, com professor, pendentes e atrasadas, e sem o código', async () => {
    await entrarComo(ALUNA);

    const { data } = await api.GET('/turmas');

    expect(data).toHaveLength(3);
    const a = data!.find((t) => t.id === TURMA_A)!;
    expect(a).toMatchObject({ professorNome: 'Marcos Silva', atividadesPendentes: 1, atividadesAtrasadas: 1 });
    expect(a).not.toHaveProperty('codigo');
    expect(data!.find((t) => t.id === TURMA_B)).toMatchObject({ atividadesPendentes: 2, atividadesAtrasadas: 0 });
    expect(data!.find((t) => t.id === TURMA_C)).toMatchObject({ atividadesPendentes: 0, atividadesAtrasadas: 0 });
  });

  it('o aluno só vê as turmas em que está inscrito', async () => {
    await entrarComo(ALUNO);

    expect((await api.GET('/turmas')).data?.map((t) => t.id)).toEqual([TURMA_A]);
  });

  it('o professor vê só as próprias turmas, com código e sem contadores', async () => {
    await entrarComo(PROFESSOR);

    const { data } = await api.GET('/turmas');

    expect(data?.map((t) => t.id).sort()).toEqual([TURMA_A, TURMA_C].sort());
    expect(data![0]).toHaveProperty('codigo');
    expect(data![0]).not.toHaveProperty('atividadesPendentes');
  });

  it('filtra por semestre', async () => {
    await entrarComo(ALUNA);

    const { data } = await api.GET('/turmas', { params: { query: { semestre: '2026.1' } } });

    expect(data?.map((t) => t.id)).toEqual([TURMA_C]);
  });

  it('o professor cadastra a turma e o servidor gera o código', async () => {
    await entrarComo(PROFESSOR);

    const { data } = await api.POST('/turmas', {
      body: { nome: 'Turma D', disciplina: 'Redes', semestre: '2026.2', diasAula: [3, 1] },
    });

    expect(data).toMatchObject({ nome: 'Turma D', diasAula: [1, 3], professorNome: 'Marcos Silva' });
    expect(data?.codigo).toMatch(/^[A-Z2-9]{6}$/);
  });

  it('cadastro de turma inválido devolve 422 por campo; aluno recebe 403', async () => {
    await entrarComo(PROFESSOR);
    await expect(
      api.POST('/turmas', { body: { nome: ' ', disciplina: '', semestre: '2026', diasAula: [] } }),
    ).rejects.toMatchObject({
      status: 422,
      campos: expect.arrayContaining([
        expect.objectContaining({ campo: 'nome' }),
        expect.objectContaining({ campo: 'disciplina' }),
        expect.objectContaining({ campo: 'semestre' }),
        expect.objectContaining({ campo: 'diasAula' }),
      ]),
    });

    await api.POST('/auth/logout');
    await entrarComo(ALUNA);
    await expect(
      api.POST('/turmas', { body: { nome: 'X', disciplina: 'Y', semestre: '2026.2', diasAula: [1] } }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('inscrição pelo código ignora espaços e maiúsculas', async () => {
    await entrarComo(ALUNO);

    const { data } = await api.POST('/inscricoes', { body: { codigo: ' web 404 ' } });

    expect(data?.id).toBe(TURMA_B);
    expect((await api.GET('/turmas')).data).toHaveLength(2);
  });

  it('inscrição: código inexistente dá 404, repetida dá 409, professor dá 403', async () => {
    await entrarComo(ALUNO);
    await expect(api.POST('/inscricoes', { body: { codigo: 'XXXXXX' } })).rejects.toMatchObject({
      status: 404,
      message: 'Não encontramos uma turma com esse código. Confira com o professor.',
    });
    await expect(api.POST('/inscricoes', { body: { codigo: 'ALG202' } })).rejects.toMatchObject({
      status: 409,
      message: 'Você já está nesta turma.',
    });

    await api.POST('/auth/logout');
    await entrarComo(PROFESSOR);
    await expect(api.POST('/inscricoes', { body: { codigo: 'WEB404' } })).rejects.toMatchObject({ status: 403 });
  });

  it('turma em que o aluno não está inscrito não é encontrada', async () => {
    await entrarComo(ALUNO);

    await expect(api.GET('/turmas/{turmaId}', { params: { path: { turmaId: TURMA_B } } })).rejects.toMatchObject({ status: 404 });
  });
});

describe('API simulada: atividades', () => {
  it('a aluna vê as atividades disponíveis da turma, cada uma com o estado derivado', async () => {
    await entrarComo(ALUNA);

    const { data } = await api.GET('/turmas/{turmaId}/atividades', { params: { path: { turmaId: TURMA_A } } });

    expect(data?.map((a) => a.id)).not.toContain(A_PROJETO);
    const estados = Object.fromEntries(data!.map((a) => [a.id, a.estado]));
    expect(estados).toMatchObject({
      [A_LISTA_1]: 'PENDENTE',
      [A_TRABALHO_1]: 'ENTREGUE',
      [A_LISTA_2]: 'ENTREGUE_COM_ATRASO',
      [A_PROVA_1]: 'CONCLUIDA',
      [A_LISTA_0]: 'ATRASADA',
    });
  });

  it('o professor vê também as ainda não disponíveis, sem estado', async () => {
    await entrarComo(PROFESSOR);

    const { data } = await api.GET('/turmas/{turmaId}/atividades', { params: { path: { turmaId: TURMA_A } } });

    expect(data?.map((a) => a.id)).toContain(A_PROJETO);
    expect(data![0]).not.toHaveProperty('estado');
  });

  it('Minhas atividades junta todas as turmas, por prazo final mais próximo primeiro', async () => {
    await entrarComo(ALUNA);

    const { data } = await api.GET('/atividades', { params: { query: { estado: 'PENDENTE' } } });

    expect(data?.map((a) => a.nome)).toEqual([
      'Prática 2 — Layout Flexbox e CSS Grid',
      'Lista 1 — Recursão e Divisão e Conquista',
      'Seminário — APIs REST',
    ]);
    expect(data?.map((a) => a.turmaNome)).toEqual(['Turma B — Programação Web', 'Turma A — Algoritmos', 'Turma B — Programação Web']);
  });

  it('filtra por turma, complexidade e modalidade, e ordena por complexidade', async () => {
    await entrarComo(ALUNA);

    const porTurma = await api.GET('/atividades', { params: { query: { turmaId: TURMA_C } } });
    expect(porTurma.data).toHaveLength(1);

    const altas = await api.GET('/atividades', { params: { query: { complexidade: 'ALTA', ordenar: 'complexidade', direcao: 'desc' } } });
    expect(altas.data?.every((a) => a.complexidade === 'ALTA')).toBe(true);

    const grupo = await api.GET('/atividades', { params: { query: { modalidade: 'GRUPO' } } });
    expect(grupo.data?.map((a) => a.nome)).toEqual(['Seminário — APIs REST']);
  });

  it('Minhas atividades é só do aluno', async () => {
    await entrarComo(PROFESSOR);

    await expect(api.GET('/atividades')).rejects.toMatchObject({ status: 403 });
  });

  it('o detalhe traz o professor e a própria entrega (ou null)', async () => {
    await entrarComo(ALUNA);

    const pendente = await api.GET('/atividades/{atividadeId}', { params: { path: { atividadeId: A_LISTA_1 } } });
    expect(pendente.data).toMatchObject({ professorNome: 'Marcos Silva', estado: 'PENDENTE', minhaEntrega: null });

    const atrasada = await api.GET('/atividades/{atividadeId}', { params: { path: { atividadeId: A_LISTA_2 } } });
    expect(atrasada.data?.minhaEntrega).toMatchObject({ nomeOriginal: 'lista2_maria.pdf', atrasada: true, nota: null });

    const concluida = await api.GET('/atividades/{atividadeId}', { params: { path: { atividadeId: A_PROVA_1 } } });
    expect(concluida.data?.minhaEntrega).toMatchObject({ nota: 9.5, comentarioPrivado: 'Parabéns! Só revisar a questão 4.' });
  });

  it('não mostra atividade ainda não disponível nem de turma alheia', async () => {
    await entrarComo(ALUNA);
    await expect(api.GET('/atividades/{atividadeId}', { params: { path: { atividadeId: A_PROJETO } } })).rejects.toMatchObject({ status: 404 });

    await api.POST('/auth/logout');
    await entrarComo(ALUNO);
    await expect(api.GET('/atividades/{atividadeId}', { params: { path: { atividadeId: B_PRATICA_2 } } })).rejects.toMatchObject({ status: 404 });
  });

  it('o professor da turma cadastra atividade; outro professor ou aluno recebem 403', async () => {
    await entrarComo(PROFESSOR);
    const corpo = {
      nome: 'Lista 3',
      complexidade: 'BAIXA' as const,
      tipo: 'ATIVIDADE' as const,
      prazoFinal: new Date(Date.now() + 5 * 86400000).toISOString(),
    };
    const { data } = await api.POST('/turmas/{turmaId}/atividades', { params: { path: { turmaId: TURMA_A } }, body: corpo });
    expect(data).toMatchObject({ nome: 'Lista 3', modalidade: 'INDIVIDUAL', turmaNome: 'Turma A — Algoritmos' });

    await api.POST('/auth/logout');
    await entrarComo(PROFESSORA);
    await expect(
      api.POST('/turmas/{turmaId}/atividades', { params: { path: { turmaId: TURMA_A } }, body: corpo }),
    ).rejects.toMatchObject({ status: 403 });

    await api.POST('/auth/logout');
    await entrarComo(ALUNA);
    await expect(
      api.POST('/turmas/{turmaId}/atividades', { params: { path: { turmaId: TURMA_A } }, body: corpo }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it('prazo final antes da disponibilidade devolve 422 no campo prazoFinal', async () => {
    await entrarComo(PROFESSOR);

    await expect(
      api.POST('/turmas/{turmaId}/atividades', {
        params: { path: { turmaId: TURMA_A } },
        body: {
          nome: 'X',
          complexidade: 'BAIXA',
          tipo: 'ATIVIDADE',
          disponivelEm: '2026-11-10T10:00:00.000Z',
          prazoFinal: '2026-11-01T10:00:00.000Z',
        },
      }),
    ).rejects.toMatchObject({
      status: 422,
      campos: [{ campo: 'prazoFinal', mensagem: 'O prazo final não pode ser antes de quando a atividade fica disponível.' }],
    });
  });
});

describe('API simulada: entregas e avaliação', () => {
  it('a aluna entrega no prazo, o estado vira ENTREGUE e o reenvio substitui o arquivo', async () => {
    await entrarComo(ALUNA);

    const primeira = await enviarEntrega(A_LISTA_1, pdf('versao1.pdf'));
    expect(primeira.data).toMatchObject({ nomeOriginal: 'versao1.pdf', atrasada: false, nota: null });
    const segunda = await enviarEntrega(A_LISTA_1, pdf('versao2.pdf'));

    expect(segunda.data?.id).toBe(primeira.data?.id);
    const detalhe = await api.GET('/atividades/{atividadeId}', { params: { path: { atividadeId: A_LISTA_1 } } });
    expect(detalhe.data).toMatchObject({ estado: 'ENTREGUE', minhaEntrega: { nomeOriginal: 'versao2.pdf' } });
  });

  it('depois do prazo final a entrega é aceita e marcada como atrasada', async () => {
    await entrarComo(ALUNA);

    const { data } = await enviarEntrega(A_LISTA_0, pdf());

    expect(data?.atrasada).toBe(true);
    const detalhe = await api.GET('/atividades/{atividadeId}', { params: { path: { atividadeId: A_LISTA_0 } } });
    expect(detalhe.data?.estado).toBe('ENTREGUE_COM_ATRASO');
  });

  it('entrega já avaliada não aceita reenvio (409)', async () => {
    await entrarComo(ALUNA);

    await expect(enviarEntrega(A_PROVA_1, pdf())).rejects.toMatchObject({
      status: 409,
      message: 'Esta entrega já foi avaliada e não aceita novo envio.',
    });
  });

  it('rejeita tipo de arquivo (415), arquivo grande (413) e envio sem arquivo (422)', async () => {
    await entrarComo(ALUNA);

    await expect(enviarEntrega(A_LISTA_1, pdf('programa.exe'))).rejects.toMatchObject({
      status: 415,
      message: 'Esse tipo de arquivo não é aceito. Envie PDF, apresentação ou texto.',
    });
    await expect(enviarEntrega(A_LISTA_1, pdf('enorme.pdf', 26 * 1024 * 1024))).rejects.toMatchObject({
      status: 413,
      message: 'O arquivo passa de 25 MB. Envie um arquivo menor.',
    });
    await expect(
      api.POST('/atividades/{atividadeId}/entregas', {
        params: { path: { atividadeId: A_LISTA_1 } },
        body: { arquivo: '' },
        bodySerializer: () => new FormData(),
      }),
    ).rejects.toMatchObject({ status: 422 });
  });

  it('professor lista só quem entregou, da mais antiga para a mais recente', async () => {
    await entrarComo(PROFESSOR);

    const { data } = await api.GET('/atividades/{atividadeId}/entregas', { params: { path: { atividadeId: A_LISTA_2 } } });

    expect(data?.map((e) => e.alunoNome)).toEqual([
      'Beatriz Oliveira Santos',
      'Lucas Mendes',
      'Maria Clara Albuquerque',
      'Gabriel Henrique Ribeiro',
    ]);
    expect(data?.map((e) => e.atrasada)).toEqual([false, true, true, true]);
    expect(data?.map((e) => e.nota)).toEqual([9.5, 8, null, null]);
  });

  it('só o professor da turma lista, baixa e avalia as entregas', async () => {
    await entrarComo(ALUNA);
    await expect(api.GET('/atividades/{atividadeId}/entregas', { params: { path: { atividadeId: A_LISTA_2 } } })).rejects.toMatchObject({ status: 403 });

    await api.POST('/auth/logout');
    await entrarComo(PROFESSORA);
    await expect(api.GET('/atividades/{atividadeId}/entregas', { params: { path: { atividadeId: A_LISTA_2 } } })).rejects.toMatchObject({ status: 403 });
    await expect(
      api.PUT('/entregas/{entregaId}/avaliacao', { params: { path: { entregaId: E_LISTA2_MARIA } }, body: { nota: 9 } }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it('o professor baixa o arquivo com o nome original', async () => {
    await entrarComo(PROFESSOR);

    const { response } = await api.GET('/entregas/{entregaId}/arquivo', {
      params: { path: { entregaId: E_LISTA2_MARIA } },
      parseAs: 'text',
    });

    expect(response.headers.get('Content-Disposition')).toContain('lista2_maria.pdf');
  });

  it('avaliar grava nota e comentário, e o estado da aluna vira CONCLUIDA', async () => {
    await entrarComo(PROFESSOR);

    const { data } = await api.PUT('/entregas/{entregaId}/avaliacao', {
      params: { path: { entregaId: E_LISTA2_MARIA } },
      body: { nota: 9, comentarioPrivado: 'Boa entrega.' },
    });
    expect(data).toMatchObject({ nota: 9, comentarioPrivado: 'Boa entrega.' });

    await api.POST('/auth/logout');
    await entrarComo(ALUNA);
    const detalhe = await api.GET('/atividades/{atividadeId}', { params: { path: { atividadeId: A_LISTA_2 } } });
    expect(detalhe.data).toMatchObject({ estado: 'CONCLUIDA', minhaEntrega: { nota: 9 } });
  });

  it('a nota pode ser editada e precisa estar entre 0 e 10', async () => {
    await entrarComo(PROFESSOR);

    const editada = await api.PUT('/entregas/{entregaId}/avaliacao', {
      params: { path: { entregaId: '30000000-0000-4000-8000-000000000003' } },
      body: { nota: 7 },
    });
    expect(editada.data?.nota).toBe(7);

    await expect(
      api.PUT('/entregas/{entregaId}/avaliacao', { params: { path: { entregaId: E_LISTA2_MARIA } }, body: { nota: 10.5 } }),
    ).rejects.toMatchObject({ status: 422, campos: [{ campo: 'nota', mensagem: 'A nota deve estar entre 0 e 10.' }] });
  });

  it('Beatriz (outra aluna) não enxerga a entrega da Maria no detalhe', async () => {
    await entrarComo(BEATRIZ);

    const { data } = await api.GET('/atividades/{atividadeId}', { params: { path: { atividadeId: A_LISTA_2 } } });

    expect(data?.minhaEntrega).toMatchObject({ nomeOriginal: 'lista2_beatriz.pdf', nota: 9.5 });
  });
});
