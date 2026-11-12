import { HttpResponse, http } from 'msw';
import { db, usuarioDaSessao } from '../db';
import { naoAutenticado, naoEncontrado, problem } from './problem';
import { notificarAlunosNoMock, notificarComentarioNoMock, notificarNoMock } from './notificacoes';
import { estaInscrito, nomeDoUsuario } from './projecoes';
import type { AvisoDb, ComentarioDb } from '../domain';

const API = '*/api/v1';

export const avisosHandlers = [
  http.get(`${API}/turmas/:turmaId/avisos`, ({ params, request }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    const turma = db.turmas.find((t) => t.id === params.turmaId);
    if (!turma) return naoEncontrado('Turma não encontrada.');

    const isMember = turma.professorId === usuario.id || estaInscrito(turma.id, usuario.id);
    if (!isMember) return problem(403, 'Você não é membro desta turma.');

    const professor = turma.professorId === usuario.id;
    const consulta = new URL(request.url).searchParams;
    const limite = consulta.get('limite') ? Number(consulta.get('limite')) : undefined;
    const deslocamento = Number(consulta.get('deslocamento') ?? 0);
    const avisos = (db.avisos ?? [])
      .filter((a) => a.turmaId === turma.id)
      .filter((a) => professor || !a.destinatariosIds || a.destinatariosIds.includes(usuario.id))
      .sort((a, b) => new Date(b.horario).getTime() - new Date(a.horario).getTime())
      .map(({ destinatariosIds, ...resto }) => ({
        ...resto,
        direcionado: Boolean(destinatariosIds),
        destinatarios: professor && destinatariosIds ? destinatariosIds.map((id) => ({ id, nome: nomeDoUsuario(id) })) : null,
      }));

    const fatia = limite === undefined ? avisos : avisos.slice(deslocamento, deslocamento + limite);
    return HttpResponse.json(fatia, { headers: { 'X-Total-Count': String(avisos.length) } });
  }),

  http.post(`${API}/turmas/:turmaId/avisos`, async ({ params, request }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    const turma = db.turmas.find((t) => t.id === params.turmaId);
    if (!turma) return naoEncontrado('Turma não encontrada.');

    const isMember = turma.professorId === usuario.id || estaInscrito(turma.id, usuario.id);
    if (!isMember) return problem(403, 'Você não é membro desta turma.');

    const { texto, gruposIds = [], alunosIds = [] } = (await request.json()) as { texto?: string; gruposIds?: string[]; alunosIds?: string[] };
    if (!texto?.trim()) {
      return problem(422, 'O texto do aviso não pode ser vazio.');
    }

    // RF13: com grupos ou alunos escolhidos o aviso é direcionado; sem nenhum, vai para a turma toda
    let destinatariosIds: string[] | undefined;
    if (gruposIds.length > 0 || alunosIds.length > 0) {
      const grupos = gruposIds.map((id) => db.grupos.find((g) => g.id === id && g.turmaId === turma.id && g.status !== 'REPROVADO'));
      if (grupos.some((g) => !g)) return problem(422, 'Um dos grupos escolhidos não existe nesta turma.');
      if (alunosIds.some((id) => !estaInscrito(turma.id, id))) return problem(422, 'Todos os destinatários precisam ser alunos desta turma.');
      destinatariosIds = [...new Set([...grupos.flatMap((g) => g!.integrantesIds), ...alunosIds])];
      if (destinatariosIds.length === 0) return problem(422, 'Os grupos escolhidos não têm alunos para receber o aviso.');
    }

    const novo: AvisoDb = {
      id: crypto.randomUUID(),
      turmaId: turma.id,
      autorId: usuario.id,
      autorNome: usuario.nome,
      texto: texto.trim(),
      horario: new Date().toISOString(),
      comentarios: [],
      ...(destinatariosIds ? { destinatariosIds } : {}),
    };

    if (!db.avisos) db.avisos = [];
    db.avisos.unshift(novo);
    const texto_ = `Novo aviso em ${turma.nome}.`;
    if (destinatariosIds) {
      for (const id of destinatariosIds) notificarNoMock(id, 'AVISO_NOVO', texto_, turma.id, null, novo.id);
    } else {
      notificarAlunosNoMock(turma.id, usuario.id, 'AVISO_NOVO', texto_, null, novo.id);
    }

    const publico: Partial<AvisoDb> = { ...novo };
    delete publico.destinatariosIds;
    return HttpResponse.json(
      {
        ...publico,
        direcionado: Boolean(destinatariosIds),
        destinatarios: destinatariosIds ? destinatariosIds.map((id) => ({ id, nome: nomeDoUsuario(id) })) : null,
      },
      { status: 201 },
    );
  }),

  http.post(`${API}/avisos/:avisoId/comentarios`, async ({ params, request }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();

    const aviso = (db.avisos ?? []).find((a) => a.id === params.avisoId);
    if (!aviso) return naoEncontrado('Aviso não encontrado.');

    const { texto, comentarioPaiId } = (await request.json()) as { texto?: string; comentarioPaiId?: string };
    if (!texto?.trim()) {
      return problem(422, 'O comentário não pode ser vazio.');
    }
    let paiRaiz: string | null = null;
    let respondidoAutorId: string | undefined;
    if (comentarioPaiId) {
      const pai = (aviso.comentarios ?? []).find((c) => c.id === comentarioPaiId);
      if (!pai) return problem(422, 'O comentário respondido não existe neste aviso.');
      respondidoAutorId = pai.autorId;
      // um nível só: responder a uma resposta vira resposta ao comentário original
      paiRaiz = pai.comentarioPaiId ?? pai.id;
    }

    const novoComentario: ComentarioDb = {
      id: crypto.randomUUID(),
      avisoId: aviso.id,
      comentarioPaiId: paiRaiz,
      autorId: usuario.id,
      autorNome: usuario.nome,
      texto: texto.trim(),
      horario: new Date().toISOString(),
    };

    if (!aviso.comentarios) aviso.comentarios = [];
    aviso.comentarios.push(novoComentario);
    const turmaDoAviso = db.turmas.find((t) => t.id === aviso.turmaId);
    notificarComentarioNoMock({
      autorId: usuario.id,
      autorNome: usuario.nome,
      turmaId: aviso.turmaId,
      atividadeId: null,
      avisoId: aviso.id,
      respondidoAutorId,
      alvo: `no mural de ${turmaDoAviso?.nome ?? 'uma turma'}`,
    });

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
