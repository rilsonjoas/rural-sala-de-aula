import { HttpResponse, http } from 'msw';
import type { components } from '@/lib/api.generated';
import { db, usuarioDaSessao } from '../db';
import { gerarCodigo, type TurmaDb } from '../domain';
import { dadosInvalidos, naoAutenticado, naoEncontrado, problem, proibido } from './problem';
import { estaInscrito, paraTurmaApi } from './projecoes';

type TurmaInput = components['schemas']['TurmaInput'];
const API = '*/api/v1';

function turmaVisivel(turma: TurmaDb | undefined, usuarioId: string, papel: 'ALUNO' | 'PROFESSOR') {
  if (!turma) return false;
  return papel === 'PROFESSOR' ? turma.professorId === usuarioId : estaInscrito(turma.id, usuarioId);
}

export const turmasHandlers = [
  http.get(`${API}/turmas`, ({ request }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    const semestre = new URL(request.url).searchParams.get('semestre');

    const turmas = db.turmas
      .filter((t) => turmaVisivel(t, usuario.id, usuario.papel))
      .filter((t) => !semestre || t.semestre === semestre)
      .sort((a, b) => b.semestre.localeCompare(a.semestre) || a.nome.localeCompare(b.nome));

    return HttpResponse.json(turmas.map((t) => paraTurmaApi(t, usuario)));
  }),

  http.post(`${API}/turmas`, async ({ request }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    if (usuario.papel !== 'PROFESSOR') return proibido('Só professores podem criar turmas.');

    const corpo = (await request.json()) as Partial<TurmaInput>;
    const campos: NonNullable<components['schemas']['Problem']['campos']> = [];
    if (!corpo.nome?.trim()) campos.push({ campo: 'nome', mensagem: 'Informe o nome da turma.' });
    if (!corpo.disciplina?.trim()) campos.push({ campo: 'disciplina', mensagem: 'Informe a disciplina.' });
    if (!/^[0-9]{4}\.[12]$/.test(corpo.semestre ?? '')) {
      campos.push({ campo: 'semestre', mensagem: 'Use o formato 2026.1 ou 2026.2.' });
    }
    if (!Array.isArray(corpo.diasAula) || corpo.diasAula.length === 0) {
      campos.push({ campo: 'diasAula', mensagem: 'Escolha ao menos um dia de aula.' });
    }
    if (campos.length > 0) return dadosInvalidos(campos);

    const nova: TurmaDb = {
      id: crypto.randomUUID(),
      professorId: usuario.id,
      nome: corpo.nome!.trim(),
      disciplina: corpo.disciplina!.trim(),
      semestre: corpo.semestre!,
      diasAula: [...new Set(corpo.diasAula!)].sort((a, b) => a - b),
      codigo: gerarCodigo(db.turmas.map((t) => t.codigo)),
    };
    db.turmas.push(nova);
    return HttpResponse.json(paraTurmaApi(nova, usuario), { status: 201 });
  }),

  http.get(`${API}/turmas/:turmaId`, ({ params }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    const turma = db.turmas.find((t) => t.id === params.turmaId);
    if (!turmaVisivel(turma, usuario.id, usuario.papel)) return naoEncontrado('Turma não encontrada.');
    return HttpResponse.json(paraTurmaApi(turma!, usuario));
  }),

  http.post(`${API}/inscricoes`, async ({ request }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    if (usuario.papel !== 'ALUNO') return proibido('Só alunos entram em turmas pelo código.');

    const { codigo } = (await request.json()) as { codigo?: string };
    const normalizado = (codigo ?? '').replace(/\s+/g, '').toUpperCase();
    const turma = db.turmas.find((t) => t.codigo.toUpperCase() === normalizado);
    if (!normalizado || !turma) {
      return problem(404, 'Não encontramos uma turma com esse código. Confira com o professor.');
    }
    if (estaInscrito(turma.id, usuario.id)) return problem(409, 'Você já está nesta turma.');

    db.inscricoes.push({ turmaId: turma.id, alunoId: usuario.id });
    return HttpResponse.json(paraTurmaApi(turma, usuario), { status: 201 });
  }),
];
