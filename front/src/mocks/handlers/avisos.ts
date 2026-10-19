import { HttpResponse, http } from 'msw';
import { db, usuarioDaSessao } from '../db';
import { naoAutenticado, naoEncontrado, problem } from './problem';
import { estaInscrito, nomeDoUsuario } from './projecoes';
import type { AvisoDb, ComentarioDb } from '../domain';

const API = '*/api/v1';

export const avisosHandlers = [
  http.get(`${API}/turmas/:turmaId/avisos`, ({ params }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    const turma = db.turmas.find((t) => t.id === params.turmaId);
    if (!turma) return naoEncontrado('Turma não encontrada.');

    const isMember = turma.professorId === usuario.id || estaInscrito(turma.id, usuario.id);
    if (!isMember) return problem(403, 'Você não é membro desta turma.');

    const avisos = (db.avisos ?? [])
      .filter((a) => a.turmaId === turma.id)
      .sort((a, b) => new Date(b.horario).getTime() - new Date(a.horario).getTime());

    return HttpResponse.json(avisos);
  }),

  http.post(`${API}/turmas/:turmaId/avisos`, async ({ params, request }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    const turma = db.turmas.find((t) => t.id === params.turmaId);
    if (!turma) return naoEncontrado('Turma não encontrada.');

    const isMember = turma.professorId === usuario.id || estaInscrito(turma.id, usuario.id);
    if (!isMember) return problem(403, 'Você não é membro desta turma.');

    const { texto } = (await request.json()) as { texto?: string };
    if (!texto?.trim()) {
      return problem(422, 'O texto do aviso não pode ser vazio.');
    }

    const novo: AvisoDb = {
      id: crypto.randomUUID(),
      turmaId: turma.id,
      autorId: usuario.id,
      autorNome: usuario.nome,
      texto: texto.trim(),
      horario: new Date().toISOString(),
      comentarios: [],
    };

    if (!db.avisos) db.avisos = [];
    db.avisos.unshift(novo);

    return HttpResponse.json(novo, { status: 201 });
  }),

  http.post(`${API}/avisos/:avisoId/comentarios`, async ({ params, request }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();

    const aviso = (db.avisos ?? []).find((a) => a.id === params.avisoId);
    if (!aviso) return naoEncontrado('Aviso não encontrado.');

    const { texto } = (await request.json()) as { texto?: string };
    if (!texto?.trim()) {
      return problem(422, 'O comentário não pode ser vazio.');
    }

    const novoComentario: ComentarioDb = {
      id: crypto.randomUUID(),
      avisoId: aviso.id,
      autorId: usuario.id,
      autorNome: usuario.nome,
      texto: texto.trim(),
      horario: new Date().toISOString(),
    };

    if (!aviso.comentarios) aviso.comentarios = [];
    aviso.comentarios.push(novoComentario);

    return HttpResponse.json(novoComentario, { status: 201 });
  }),

  http.get(`${API}/avisos/:avisoId/comentarios`, ({ params }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();

    const aviso = (db.avisos ?? []).find((a) => a.id === params.avisoId);
    if (!aviso) return naoEncontrado('Aviso não encontrado.');

    return HttpResponse.json(aviso.comentarios ?? []);
  }),
];
