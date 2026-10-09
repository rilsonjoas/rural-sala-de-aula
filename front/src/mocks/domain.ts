import type { components } from '@/lib/api.generated';

type S = components['schemas'];

export type EstadoAtividade = S['EstadoAtividade'];
export type Complexidade = S['Complexidade'];
export type AtividadeTipo = S['AtividadeTipo'];
export type AtividadeModalidade = S['AtividadeModalidade'];

export type TurmaDb = {
  id: string;
  professorId: string;
  nome: string;
  disciplina: string;
  semestre: string;
  diasAula: number[];
  codigo: string;
};

export type InscricaoDb = { turmaId: string; alunoId: string };

export type AtividadeDb = {
  id: string;
  turmaId: string;
  nome: string;
  descricao?: string;
  complexidade: Complexidade;
  tipo: AtividadeTipo;
  modalidade: AtividadeModalidade;
  prazoFinal: string;
  disponivelEm: string;
};

export type EntregaDb = {
  id: string;
  atividadeId: string;
  alunoId: string;
  nomeOriginal: string;
  tamanhoBytes: number;
  enviadaEm: string;
  conteudo: string;
};

export type AvaliacaoDb = { entregaId: string; nota: number; comentarioPrivado?: string };

/** Estado derivado (ADR-0005 e ADR-0006): o prazo final é o limite real e nada é gravado. */
export function estadoDaAtividade(
  atividade: Pick<AtividadeDb, 'prazoFinal'>,
  entrega: { enviadaEm: string } | undefined,
  avaliacao: { nota: number } | undefined,
  agora: Date = new Date(),
): EstadoAtividade {
  const prazo = new Date(atividade.prazoFinal).getTime();
  if (!entrega) return agora.getTime() > prazo ? 'ATRASADA' : 'PENDENTE';
  if (avaliacao) return 'CONCLUIDA';
  return new Date(entrega.enviadaEm).getTime() > prazo ? 'ENTREGUE_COM_ATRASO' : 'ENTREGUE';
}

/** Sem 0, O, 1, I e L, que se confundem ao ler e digitar. */
export const CODIGO_ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function gerarCodigo(existentes: string[]): string {
  const usados = new Set(existentes.map((c) => c.toUpperCase()));
  for (;;) {
    let codigo = '';
    for (let i = 0; i < 6; i++) codigo += CODIGO_ALFABETO[Math.floor(Math.random() * CODIGO_ALFABETO.length)];
    if (!usados.has(codigo)) return codigo;
  }
}

const POSICAO_COMPLEXIDADE: Record<Complexidade, number> = { BAIXA: 0, MEDIA: 1, ALTA: 2 };

export type FiltrosDeAtividade = {
  estado?: EstadoAtividade;
  tipo?: AtividadeTipo;
  modalidade?: AtividadeModalidade;
  complexidade?: Complexidade;
  ordenar?: 'prazo' | 'complexidade';
  direcao?: 'asc' | 'desc';
};

export function filtrarEOrdenarAtividades<T extends AtividadeDb & { estado?: EstadoAtividade }>(
  lista: T[],
  { estado, tipo, modalidade, complexidade, ordenar = 'prazo', direcao = 'asc' }: FiltrosDeAtividade,
): T[] {
  const filtradas = lista.filter(
    (a) =>
      (!estado || a.estado === estado) &&
      (!tipo || a.tipo === tipo) &&
      (!modalidade || a.modalidade === modalidade) &&
      (!complexidade || a.complexidade === complexidade),
  );

  const chave = (a: T) => (ordenar === 'complexidade' ? POSICAO_COMPLEXIDADE[a.complexidade] : new Date(a.prazoFinal).getTime());
  const sinal = direcao === 'desc' ? -1 : 1;

  return [...filtradas].sort((a, b) => sinal * (chave(a) - chave(b)) || a.nome.localeCompare(b.nome));
}
