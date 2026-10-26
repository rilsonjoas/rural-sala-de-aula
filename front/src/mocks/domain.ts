import type { components } from '@/lib/api.generated';

type S = components['schemas'];

export type EstadoAtividade = S['EstadoAtividade'];
export type AtividadeTipo = S['AtividadeTipo'];

export type TurmaDb = {
  id: string;
  professorId: string;
  nome: string;
  disciplina: string;
  semestre: string;
  diasAula: number[];
  codigo: string;
  descricao?: string;
};

export type InscricaoDb = { turmaId: string; alunoId: string };

export type AtividadeDb = {
  id: string;
  turmaId: string;
  nome: string;
  descricao?: string;
  tipo: AtividadeTipo;
  prazoFinal: string;
  disponivelEm: string;
  aceitaAtraso?: boolean;
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

export type AvisoDb = {
  id: string;
  turmaId: string;
  autorId: string;
  autorNome: string;
  texto: string;
  horario: string;
  comentarios?: ComentarioDb[];
};

export type ComentarioDb = {
  id: string;
  avisoId: string;
  comentarioPaiId?: string | null;
  autorId: string;
  autorNome: string;
  texto: string;
  horario: string;
};

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

export type FiltrosDeAtividade = {
  estado?: EstadoAtividade;
  tipo?: AtividadeTipo;
  ordenar?: 'prazo';
  direcao?: 'asc' | 'desc';
};

export function filtrarEOrdenarAtividades<T extends AtividadeDb & { estado?: EstadoAtividade }>(
  lista: T[],
  { estado, tipo, ordenar = 'prazo', direcao = 'asc' }: FiltrosDeAtividade,
): T[] {
  const filtradas = lista.filter(
    (a) => (!estado || a.estado === estado) && (!tipo || a.tipo === tipo),
  );

  void ordenar;
  const chave = (a: T) => new Date(a.prazoFinal).getTime();
  const sinal = direcao === 'desc' ? -1 : 1;

  return [...filtradas].sort((a, b) => sinal * (chave(a) - chave(b)) || a.nome.localeCompare(b.nome));
}
