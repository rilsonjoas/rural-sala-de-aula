import { HttpResponse, http } from 'msw';
import { db, usuarioDaSessao } from '../db';
import { dadosInvalidos, naoAutenticado, naoEncontrado, problem, proibido } from './problem';
import { atividadeVisivel } from './atividades';
import { avaliacaoDaEntrega, entregaDoAluno, paraEntregaApi } from './projecoes';

const API = '*/api/v1';
const LIMITE_BYTES = 25 * 1024 * 1024;
const EXTENSOES = ['pdf', 'ppt', 'pptx', 'doc', 'docx', 'txt'];

function entregaDoProfessor(entregaId: string, professorId: string) {
  const entrega = db.entregas.find((e) => e.id === entregaId);
  const atividade = entrega && db.atividades.find((a) => a.id === entrega.atividadeId);
  const turma = atividade && db.turmas.find((t) => t.id === atividade.turmaId);
  return entrega && turma?.professorId === professorId ? entrega : undefined;
}

export const entregasHandlers = [
  http.post(`${API}/atividades/:atividadeId/entregas`, async ({ params, request }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    const atividade = db.atividades.find((a) => a.id === params.atividadeId);
    if (!atividadeVisivel(atividade, usuario)) return naoEncontrado('Atividade não encontrada.');

    const turma = db.turmas.find((t) => t.id === atividade!.turmaId);
    if (turma?.professorId === usuario.id) {
      return proibido('O professor da turma não envia entregas na própria turma.');
    }

    if (atividade!.aceitaAtraso === false && Date.now() > new Date(atividade!.prazoFinal).getTime()) {
      return problem(403, 'O prazo encerrou e esta atividade não aceita entregas com atraso.');
    }

    const existente = entregaDoAluno(atividade!.id, usuario.id);
    if (existente && avaliacaoDaEntrega(existente.id)) {
      return problem(409, 'Esta entrega já foi avaliada e não aceita novo envio.');
    }

    const campo = (await request.formData()).get('arquivo');
    const arquivo = typeof campo === 'object' && campo !== null && 'name' in campo && 'size' in campo ? (campo as File) : null;
    if (!arquivo) return dadosInvalidos([{ campo: 'arquivo', mensagem: 'Escolha um arquivo.' }]);
    const extensao = arquivo.name.split('.').pop()?.toLowerCase() ?? '';
    if (!EXTENSOES.includes(extensao)) {
      return problem(415, 'Esse tipo de arquivo não é aceito. Envie PDF, apresentação ou texto.');
    }
    if (arquivo.size > LIMITE_BYTES) return problem(413, 'O arquivo passa de 25 MB. Envie um arquivo menor.');

    const dados = {
      nomeOriginal: arquivo.name,
      tamanhoBytes: arquivo.size,
      enviadaEm: new Date().toISOString(),
      conteudo: `Conteúdo simulado de ${arquivo.name}`,
    };
    if (existente) Object.assign(existente, dados);
    const entrega = existente ?? { id: crypto.randomUUID(), atividadeId: atividade!.id, alunoId: usuario.id, ...dados };
    if (!existente) db.entregas.push(entrega);

    return HttpResponse.json(paraEntregaApi(entrega), { status: 201 });
  }),

  http.get(`${API}/atividades/:atividadeId/entregas`, ({ params }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    const atividade = db.atividades.find((a) => a.id === params.atividadeId);
    const turma = atividade && db.turmas.find((t) => t.id === atividade.turmaId);
    if (!turma || turma.professorId !== usuario.id) {
      return proibido('Só o professor da turma vê as entregas.');
    }

    const entregas = db.entregas
      .filter((e) => e.atividadeId === atividade!.id)
      .sort((a, b) => a.enviadaEm.localeCompare(b.enviadaEm));
    return HttpResponse.json(entregas.map(paraEntregaApi));
  }),

  http.get(`${API}/entregas/:entregaId/arquivo`, ({ params }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    const entrega = entregaDoProfessor(params.entregaId as string, usuario.id);
    if (!entrega) return proibido('Só o professor da turma baixa arquivos de entrega.');

    return new HttpResponse(entrega.conteudo, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${entrega.nomeOriginal}"`,
      },
    });
  }),

  http.put(`${API}/entregas/:entregaId/avaliacao`, async ({ params, request }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    const entrega = entregaDoProfessor(params.entregaId as string, usuario.id);
    if (!entrega) return proibido('Só o professor da turma avalia entregas.');

    const corpo = (await request.json()) as { nota?: number; comentarioPrivado?: string };
    const nota = corpo.nota;
    if (typeof nota !== 'number' || Number.isNaN(nota) || nota < 0 || nota > 10) {
      return dadosInvalidos([{ campo: 'nota', mensagem: 'A nota deve estar entre 0 e 10.' }]);
    }
    const arredondada = Math.round(nota * 10) / 10;
    const comentario = corpo.comentarioPrivado?.trim();

    const existente = db.avaliacoes.find((a) => a.entregaId === entrega.id);
    if (existente) {
      existente.nota = arredondada;
      existente.comentarioPrivado = comentario;
    } else {
      db.avaliacoes.push({ entregaId: entrega.id, nota: arredondada, comentarioPrivado: comentario });
    }

    return HttpResponse.json(paraEntregaApi(entrega));
  }),
];
