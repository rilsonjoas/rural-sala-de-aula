import { HttpResponse, http } from 'msw';
import type { components } from '@/lib/api.generated';
import { db, usuarioDaSessao } from '../db';
import {
  filtrarEOrdenarAtividades,
  type AtividadeDb,
  type AtividadeTipo,
  type EstadoAtividade,
} from '../domain';
import type { UsuarioComSenha } from '../fixtures';
import { dadosInvalidos, naoAutenticado, naoEncontrado, proibido } from './problem';
import {
  agora,
  atividadesDisponiveis,
  entregaDoAluno,
  estaInscrito,
  nomeDoUsuario,
  paraAtividadeApi,
  paraEntregaApi,
} from './projecoes';

type AtividadeInput = components['schemas']['AtividadeInput'];
const API = '*/api/v1';

const TIPOS = ['PROVA', 'LISTA_DE_EXERCICIO', 'PROJETO_INDIVIDUAL', 'PROJETO_EM_GRUPO'];

function lerFiltros(url: string) {
  const q = new URL(url).searchParams;
  return {
    estado: (q.get('estado') ?? undefined) as EstadoAtividade | undefined,
    tipo: (q.get('tipo') ?? undefined) as AtividadeTipo | undefined,
    ordenar: (q.get('ordenar') ?? undefined) as 'prazo' | undefined,
    direcao: (q.get('direcao') ?? undefined) as 'asc' | 'desc' | undefined,
    turmaId: q.get('turmaId') ?? undefined,
  };
}

function listar(atividades: AtividadeDb[], usuario: UsuarioComSenha, filtros: ReturnType<typeof lerFiltros>) {
  const comEstado = atividades.map((a) => paraAtividadeApi(a, usuario));
  const base = atividades.map((a, i) => ({ ...a, estado: comEstado[i].estado }));
  const ordenadas = filtrarEOrdenarAtividades(base, filtros);
  return ordenadas.map((a) => paraAtividadeApi(a, usuario));
}

/** Aluno só enxerga atividade de turma em que está inscrito e já disponível; professor, só das suas turmas. */
export function atividadeVisivel(atividade: AtividadeDb | undefined, usuario: UsuarioComSenha) {
  if (!atividade) return false;
  const turma = db.turmas.find((t) => t.id === atividade.turmaId);
  if (!turma) return false;
  if (turma.professorId === usuario.id) return true;
  return estaInscrito(turma.id, usuario.id) && new Date(atividade.disponivelEm).getTime() <= agora().getTime();
}

export const atividadesHandlers = [
  http.get(`${API}/turmas/:turmaId/atividades`, ({ params, request }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    const turma = db.turmas.find((t) => t.id === params.turmaId);
    const isProfessor = turma?.professorId === usuario.id;
    const isAluno = turma ? estaInscrito(turma.id, usuario.id) : false;
    if (!turma || (!isProfessor && !isAluno)) return naoEncontrado('Turma não encontrada.');

    const base = isProfessor ? db.atividades.filter((a) => a.turmaId === turma.id) : atividadesDisponiveis(turma.id);
    return HttpResponse.json(listar(base, usuario, lerFiltros(request.url)));
  }),

  http.post(`${API}/turmas/:turmaId/atividades`, async ({ params, request }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    const turma = db.turmas.find((t) => t.id === params.turmaId);
    if (!turma) return naoEncontrado('Turma não encontrada.');
    if (turma.professorId !== usuario.id) {
      return proibido('Só o professor da turma pode cadastrar atividades.');
    }

    const corpo = (await request.json()) as Partial<AtividadeInput>;
    const campos: NonNullable<components['schemas']['Problem']['campos']> = [];
    if (!corpo.nome?.trim()) campos.push({ campo: 'nome', mensagem: 'Informe o nome da atividade.' });
    if (!TIPOS.includes(corpo.tipo ?? '')) campos.push({ campo: 'tipo', mensagem: 'Escolha o tipo de atividade.' });
    const prazo = Date.parse(corpo.prazoFinal ?? '');
    if (Number.isNaN(prazo)) campos.push({ campo: 'prazoFinal', mensagem: 'Informe o prazo final.' });
    const disponivel = corpo.disponivelEm ? Date.parse(corpo.disponivelEm) : agora().getTime();
    if (!Number.isNaN(prazo) && prazo < disponivel) {
      campos.push({ campo: 'prazoFinal', mensagem: 'O prazo final não pode ser antes de quando a atividade fica disponível.' });
    }
    if (campos.length > 0) return dadosInvalidos(campos);

    const nova: AtividadeDb = {
      id: crypto.randomUUID(),
      turmaId: turma.id,
      nome: corpo.nome!.trim(),
      ...(corpo.descricao?.trim() ? { descricao: corpo.descricao.trim() } : {}),
      tipo: corpo.tipo!,
      prazoFinal: new Date(prazo).toISOString(),
      disponivelEm: new Date(disponivel).toISOString(),
      aceitaAtraso: corpo.aceitaAtraso ?? true,
    };
    db.atividades.push(nova);
    return HttpResponse.json(paraAtividadeApi(nova, usuario), { status: 201 });
  }),

  http.put(`${API}/atividades/:atividadeId`, async ({ params, request }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    const atividade = db.atividades.find((a) => a.id === params.atividadeId);
    if (!atividade) return naoEncontrado('Atividade não encontrada.');
    const turma = db.turmas.find((t) => t.id === atividade.turmaId)!;
    if (turma.professorId !== usuario.id) return proibido('Somente o professor da turma pode editar atividades.');

    const corpo = (await request.json()) as Partial<AtividadeInput>;
    const campos: NonNullable<components['schemas']['Problem']['campos']> = [];
    if (!corpo.nome?.trim()) campos.push({ campo: 'nome', mensagem: 'Informe o nome da atividade.' });
    if (!TIPOS.includes(corpo.tipo ?? '')) campos.push({ campo: 'tipo', mensagem: 'Escolha o tipo de atividade.' });
    const prazo = Date.parse(corpo.prazoFinal ?? '');
    if (Number.isNaN(prazo)) campos.push({ campo: 'prazoFinal', mensagem: 'Informe o prazo final.' });
    const disponivel = corpo.disponivelEm ? Date.parse(corpo.disponivelEm) : Date.parse(atividade.disponivelEm);
    if (!Number.isNaN(prazo) && prazo < disponivel) {
      campos.push({ campo: 'prazoFinal', mensagem: 'O prazo final não pode ser antes de quando a atividade fica disponível.' });
    }
    if (campos.length > 0) return dadosInvalidos(campos);

    atividade.nome = corpo.nome!.trim();
    atividade.descricao = corpo.descricao?.trim() || undefined;
    atividade.tipo = corpo.tipo!;
    atividade.prazoFinal = new Date(prazo).toISOString();
    atividade.disponivelEm = new Date(disponivel).toISOString();
    if (corpo.aceitaAtraso !== undefined) atividade.aceitaAtraso = corpo.aceitaAtraso;
    return HttpResponse.json(paraAtividadeApi(atividade, usuario));
  }),

  http.get(`${API}/atividades/:atividadeId/sem-entrega`, ({ params }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    const atividade = db.atividades.find((a) => a.id === params.atividadeId);
    if (!atividade) return naoEncontrado('Atividade não encontrada.');
    const turma = db.turmas.find((t) => t.id === atividade.turmaId)!;
    if (turma.professorId !== usuario.id) return proibido('Acesso restrito ao professor da turma.');

    const entregaram = new Set(db.entregas.filter((e) => e.atividadeId === atividade.id).map((e) => e.alunoId));
    const lista = db.inscricoes
      .filter((i) => i.turmaId === turma.id && !entregaram.has(i.alunoId))
      .map((i) => db.usuarios.find((u) => u.id === i.alunoId)!)
      .map((u) => ({ id: u.id, nome: u.nome, email: u.email }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
    return HttpResponse.json(lista);
  }),

  http.get(`${API}/atividades`, ({ request }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();

    const filtros = lerFiltros(request.url);
    const turmasDoAluno = db.inscricoes.filter((i) => i.alunoId === usuario.id).map((i) => i.turmaId);
    const base = turmasDoAluno
      .filter((id) => !filtros.turmaId || id === filtros.turmaId)
      .flatMap((id) => atividadesDisponiveis(id));
    return HttpResponse.json(listar(base, usuario, filtros));
  }),

  http.get(`${API}/atividades/:atividadeId`, ({ params }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    const atividade = db.atividades.find((a) => a.id === params.atividadeId);
    if (!atividadeVisivel(atividade, usuario)) return naoEncontrado('Atividade não encontrada.');

    const turma = db.turmas.find((t) => t.id === atividade!.turmaId)!;
    const isAluno = estaInscrito(turma.id, usuario.id);
    const entrega = isAluno ? entregaDoAluno(atividade!.id, usuario.id) : undefined;
    return HttpResponse.json({
      ...paraAtividadeApi(atividade!, usuario),
      professorNome: nomeDoUsuario(turma.professorId),
      minhaEntrega: entrega ? paraEntregaApi(entrega) : null,
    });
  }),
];
