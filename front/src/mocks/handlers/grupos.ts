import { HttpResponse, http } from 'msw';
import type { components } from '@/lib/api.generated';
import { db, usuarioDaSessao } from '../db';
import { CONFIGURACAO_PADRAO_DE_GRUPOS, type ConfiguracaoDeGruposDb, type GrupoDb } from '../domain';
import { naoAutenticado, naoEncontrado, problem, proibido } from './problem';
import { estaInscrito } from './projecoes';

const API = '*/api/v1';

type Grupo = components['schemas']['Grupo'];
type Integrante = components['schemas']['IntegranteDeGrupo'];

const configuracaoDa = (turmaId: string): ConfiguracaoDeGruposDb => db.configuracoesDeGrupos[turmaId] ?? CONFIGURACAO_PADRAO_DE_GRUPOS;
const ativo = (g: GrupoDb) => g.status !== 'REPROVADO';
const grupoAtivoDoAluno = (turmaId: string, alunoId: string) =>
  db.grupos.find((g) => g.turmaId === turmaId && ativo(g) && g.integrantesIds.includes(alunoId));

function integrante(id: string): Integrante {
  return { id, nome: db.usuarios.find((u) => u.id === id)?.nome ?? '' };
}

function paraGrupo(g: GrupoDb): Grupo {
  return { id: g.id, turmaId: g.turmaId, nome: g.nome, status: g.status, criadoPorId: g.criadoPorId, integrantes: g.integrantesIds.map(integrante) };
}

export const gruposHandlers = [
  http.get(`${API}/turmas/:turmaId/alunos`, ({ params }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    const turma = db.turmas.find((t) => t.id === params.turmaId);
    if (!turma) return naoEncontrado('Turma não encontrada.');
    if (turma.professorId !== usuario.id && !estaInscrito(turma.id, usuario.id)) return proibido('Você não é membro desta turma.');

    const alunos = db.inscricoes.filter((i) => i.turmaId === turma.id).map((i) => integrante(i.alunoId));
    return HttpResponse.json(alunos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')));
  }),

  http.get(`${API}/turmas/:turmaId/grupos/configuracao`, ({ params }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    const turma = db.turmas.find((t) => t.id === params.turmaId);
    if (!turma) return naoEncontrado('Turma não encontrada.');
    if (turma.professorId !== usuario.id && !estaInscrito(turma.id, usuario.id)) return proibido('Você não é membro desta turma.');
    return HttpResponse.json(configuracaoDa(turma.id));
  }),

  http.put(`${API}/turmas/:turmaId/grupos/configuracao`, async ({ params, request }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    const turma = db.turmas.find((t) => t.id === params.turmaId);
    if (!turma) return naoEncontrado('Turma não encontrada.');
    if (turma.professorId !== usuario.id) return proibido('Somente o professor da turma configura os grupos.');

    const corpo = (await request.json()) as ConfiguracaoDeGruposDb;
    const { minimoIntegrantes, maximoIntegrantes } = corpo;
    const maximoGrupos = corpo.maximoGrupos ?? null;
    if (!Number.isInteger(minimoIntegrantes) || minimoIntegrantes < 1) {
      return problem(422, 'Dados inválidos.', [{ campo: 'minimoIntegrantes', mensagem: 'O mínimo de integrantes deve ser pelo menos 1.' }]);
    }
    if (!Number.isInteger(maximoIntegrantes) || maximoIntegrantes < minimoIntegrantes) {
      return problem(422, 'Dados inválidos.', [{ campo: 'maximoIntegrantes', mensagem: 'O máximo de integrantes não pode ser menor que o mínimo.' }]);
    }
    if (maximoGrupos !== null && (!Number.isInteger(maximoGrupos) || maximoGrupos < 1)) {
      return problem(422, 'Dados inválidos.', [{ campo: 'maximoGrupos', mensagem: 'O limite de grupos deve ser pelo menos 1, ou fica em branco para não limitar.' }]);
    }
    db.configuracoesDeGrupos[turma.id] = { minimoIntegrantes, maximoIntegrantes, maximoGrupos };
    return HttpResponse.json(db.configuracoesDeGrupos[turma.id]);
  }),

  http.get(`${API}/turmas/:turmaId/grupos`, ({ params }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    const turma = db.turmas.find((t) => t.id === params.turmaId);
    if (!turma) return naoEncontrado('Turma não encontrada.');
    const professor = turma.professorId === usuario.id;
    if (!professor && !estaInscrito(turma.id, usuario.id)) return proibido('Você não é membro desta turma.');

    const visiveis = db.grupos.filter(
      (g) => g.turmaId === turma.id && (professor || g.status === 'APROVADO' || g.integrantesIds.includes(usuario.id)),
    );
    return HttpResponse.json(visiveis.map(paraGrupo));
  }),

  http.post(`${API}/turmas/:turmaId/grupos`, async ({ params, request }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    const turma = db.turmas.find((t) => t.id === params.turmaId);
    if (!turma) return naoEncontrado('Turma não encontrada.');
    if (!estaInscrito(turma.id, usuario.id)) return proibido('Só alunos da turma pedem grupos.');

    const { nome, integrantesIds = [] } = (await request.json()) as { nome?: string; integrantesIds?: string[] };
    const configuracao = configuracaoDa(turma.id);
    const integrantes = [usuario.id, ...new Set(integrantesIds.filter((id) => id !== usuario.id))];

    if (!nome?.trim()) return problem(422, 'Dados inválidos.', [{ campo: 'nome', mensagem: 'Informe o nome do grupo.' }]);
    if (nome.trim().length > 80) return problem(422, 'Dados inválidos.', [{ campo: 'nome', mensagem: 'O nome do grupo tem no máximo 80 caracteres.' }]);
    if (integrantes.length < configuracao.minimoIntegrantes) {
      return problem(422, `O grupo precisa de pelo menos ${configuracao.minimoIntegrantes} integrantes.`);
    }
    if (integrantes.length > configuracao.maximoIntegrantes) {
      return problem(422, `O grupo pode ter no máximo ${configuracao.maximoIntegrantes} integrantes.`);
    }
    if (integrantes.some((id) => !estaInscrito(turma.id, id))) return problem(422, 'Todos os integrantes precisam ser alunos desta turma.');
    if (integrantes.some((id) => grupoAtivoDoAluno(turma.id, id))) {
      return problem(422, 'Algum integrante já está em um grupo desta turma, ou com solicitação pendente.');
    }
    if (configuracao.maximoGrupos !== null && db.grupos.filter((g) => g.turmaId === turma.id && ativo(g)).length >= configuracao.maximoGrupos) {
      return problem(422, 'A turma já atingiu o limite de grupos.');
    }

    const novo: GrupoDb = { id: crypto.randomUUID(), turmaId: turma.id, nome: nome.trim(), status: 'PENDENTE', criadoPorId: usuario.id, integrantesIds: integrantes };
    db.grupos.push(novo);
    return HttpResponse.json(paraGrupo(novo), { status: 201 });
  }),

  http.post(`${API}/grupos/:grupoId/aprovacao`, async ({ params, request }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    const grupo = db.grupos.find((g) => g.id === params.grupoId);
    const turma = grupo && db.turmas.find((t) => t.id === grupo.turmaId);
    if (!grupo || !turma) return naoEncontrado('Grupo não encontrado.');
    if (turma.professorId !== usuario.id) return proibido('Somente o professor da turma decide sobre grupos.');
    if (grupo.status !== 'PENDENTE') return problem(409, 'Este grupo já foi decidido.');

    const { aprovado } = (await request.json()) as { aprovado: boolean };
    grupo.status = aprovado ? 'APROVADO' : 'REPROVADO';
    return HttpResponse.json(paraGrupo(grupo));
  }),

  http.post(`${API}/grupos/:grupoId/integrantes`, ({ params }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    const grupo = db.grupos.find((g) => g.id === params.grupoId);
    if (!grupo || !estaInscrito(grupo.turmaId, usuario.id)) return naoEncontrado('Grupo não encontrado.');
    if (grupo.status !== 'APROVADO') return problem(422, 'Só é possível entrar em grupos aprovados.');
    if (grupoAtivoDoAluno(grupo.turmaId, usuario.id)) return problem(422, 'Você já está em um grupo desta turma.');
    if (grupo.integrantesIds.length >= configuracaoDa(grupo.turmaId).maximoIntegrantes) return problem(422, 'Este grupo já está cheio.');

    grupo.integrantesIds.push(usuario.id);
    return HttpResponse.json(paraGrupo(grupo));
  }),

  http.delete(`${API}/grupos/:grupoId/integrantes`, ({ params }) => {
    const usuario = usuarioDaSessao();
    if (!usuario) return naoAutenticado();
    const grupo = db.grupos.find((g) => g.id === params.grupoId);
    if (!grupo || !grupo.integrantesIds.includes(usuario.id)) return naoEncontrado('Você não está neste grupo.');

    const restantes = grupo.integrantesIds.length - 1;
    const minimo = configuracaoDa(grupo.turmaId).minimoIntegrantes;
    if (grupo.status === 'APROVADO' && restantes < minimo) {
      return problem(422, `O grupo ficaria com menos de ${minimo} integrantes. Peça ao professor para ajustar a regra.`);
    }
    grupo.integrantesIds = grupo.integrantesIds.filter((id) => id !== usuario.id);
    if (grupo.integrantesIds.length === 0) db.grupos = db.grupos.filter((g) => g.id !== grupo.id);
    return new HttpResponse(null, { status: 204 });
  }),
];
