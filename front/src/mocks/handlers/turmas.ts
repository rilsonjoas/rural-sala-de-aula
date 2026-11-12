import { HttpResponse, http } from 'msw';
import type { components } from '@/lib/api.generated';
import { db, usuarioDaSessao } from '../db';
import { gerarCodigo, type TurmaDb } from '../domain';
import { dadosInvalidos, naoAutenticado, naoEncontrado, problem, proibido } from './problem';
import { estaInscrito, paraTurmaApi } from './projecoes';

type TurmaInput = components['schemas']['TurmaInput'];
const API = '*/api/v1';

function turmaVisivel(turma: TurmaDb | undefined, usuarioId: string) {
  if (!turma) return false;
  return turma.professorId === usuarioId || estaInscrito(turma.id, usuarioId);
}

/** Leva junto tudo o que depende da turma, como o ON DELETE CASCADE da API. */
export function excluirTurmaDoMock(turmaId: string) {
  const atividades = new Set(db.atividades.filter((a) => a.turmaId === turmaId).map((a) => a.id));
  const entregas = new Set(db.entregas.filter((e) => atividades.has(e.atividadeId)).map((e) => e.id));
  db.turmas = db.turmas.filter((t) => t.id !== turmaId);
  db.inscricoes = db.inscricoes.filter((i) => i.turmaId !== turmaId);
  db.atividades = db.atividades.filter((a) => a.turmaId !== turmaId);
  db.entregas = db.entregas.filter((e) => !entregas.has(e.id));
  db.avaliacoes = db.avaliacoes.filter((a) => !entregas.has(a.entregaId));
  db.avisos = db.avisos.filter((a) => a.turmaId !== turmaId);
  db.comentariosAtividade = db.comentariosAtividade.filter((c) => !c.atividadeId || !atividades.has(c.atividadeId));
  db.notificacoes = db.notificacoes.filter((n) => n.turmaId !== turmaId);
  db.grupos = db.grupos.filter((g) => g.turmaId !== turmaId);
  delete db.configuracoesDeGrupos[turmaId];
}

export const turmasHandlers = [
  http.get(`${API}/turmas`, ({ request }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    const semestre = new URL(request.url).searchParams.get('semestre');

    const turmas = db.turmas
      .filter((t) => turmaVisivel(t, usuario.id))
      .filter((t) => !semestre || t.semestre === semestre)
      .sort((a, b) => b.semestre.localeCompare(a.semestre) || a.nome.localeCompare(b.nome));

    return HttpResponse.json(turmas.map((t) => paraTurmaApi(t, usuario)));
  }),

  http.post(`${API}/turmas`, async ({ request }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();

    const corpo = (await request.json()) as Partial<TurmaInput>;
    const nome = corpo.nome?.trim();
    const disciplina = corpo.disciplina?.trim() || nome;
    const campos: NonNullable<components['schemas']['Problem']['campos']> = [];
    if (!nome) campos.push({ campo: 'nome', mensagem: 'Informe o nome da turma.' });
    if (!/^[0-9]{4}\.[12]$/.test(corpo.semestre ?? '')) {
      campos.push({ campo: 'semestre', mensagem: 'Use o formato 2026.1 ou 2026.2.' });
    }
    if (campos.length > 0) return dadosInvalidos(campos);

    const nova: TurmaDb = {
      id: crypto.randomUUID(),
      professorId: usuario.id,
      nome: nome!,
      disciplina: disciplina!,
      semestre: corpo.semestre!,
      diasAula: Array.isArray(corpo.diasAula) ? [...new Set(corpo.diasAula)].sort((a, b) => a - b) : [],
      codigo: gerarCodigo(db.turmas.map((t) => t.codigo)),
      descricao: corpo.descricao?.trim(),
    };
    db.turmas.push(nova);
    return HttpResponse.json(paraTurmaApi(nova, usuario), { status: 201 });
  }),

  http.get(`${API}/turmas/:turmaId`, ({ params }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    const turma = db.turmas.find((t) => t.id === params.turmaId);
    if (!turmaVisivel(turma, usuario.id)) return naoEncontrado('Turma não encontrada.');
    return HttpResponse.json(paraTurmaApi(turma!, usuario));
  }),

  http.delete(`${API}/turmas/:turmaId`, ({ params }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    const turma = db.turmas.find((t) => t.id === params.turmaId);
    if (!turma) return naoEncontrado('Turma não encontrada.');
    if (turma.professorId !== usuario.id) return proibido('Somente o professor da turma pode excluí-la.');
    excluirTurmaDoMock(turma.id);
    return new HttpResponse(null, { status: 204 });
  }),

  http.delete(`${API}/turmas/:turmaId/inscricao`, ({ params }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    const turma = db.turmas.find((t) => t.id === params.turmaId);
    if (!turma) return naoEncontrado('Turma não encontrada.');
    if (turma.professorId === usuario.id) return problem(409, 'O professor não sai da própria turma.');
    const indice = db.inscricoes.findIndex((i) => i.turmaId === turma.id && i.alunoId === usuario.id);
    if (indice < 0) return naoEncontrado('Turma não encontrada.');
    db.inscricoes.splice(indice, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(`${API}/inscricoes`, async ({ request }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();

    const { codigo } = (await request.json()) as { codigo?: string };
    const normalizado = (codigo ?? '').replace(/\s+/g, '').toUpperCase();
    const turma = db.turmas.find((t) => t.codigo.toUpperCase() === normalizado);
    if (!normalizado || !turma) {
      return problem(404, 'Não encontramos uma turma com esse código. Confira com o professor.');
    }
    if (turma.professorId === usuario.id) {
      return problem(409, 'Você é o professor desta turma.');
    }
    if (estaInscrito(turma.id, usuario.id)) return problem(409, 'Você já está nesta turma.');

    db.inscricoes.push({ turmaId: turma.id, alunoId: usuario.id });
    return HttpResponse.json(paraTurmaApi(turma, usuario), { status: 201 });
  }),
];
