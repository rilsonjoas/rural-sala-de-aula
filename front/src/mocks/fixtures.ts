import type { components } from '@/lib/api.generated';
import type { AtividadeDb, AvaliacaoDb, EntregaDb, InscricaoDb, TurmaDb } from './domain';

export type Usuario = components['schemas']['Usuario'];
export type UsuarioComSenha = Usuario & { senha: string };

const usuario = (n: number, nome: string, email: string, papel: Usuario['papel']): UsuarioComSenha => ({
  id: `00000000-0000-4000-8000-00000000000${n}`,
  nome,
  email,
  papel,
  senha: 'senha1234',
});

export const PROFESSOR = usuario(1, 'Marcos Silva', 'marcos@ufrpe.br', 'PROFESSOR');
export const ALUNA = usuario(2, 'Maria Clara Albuquerque', 'maria@ufrpe.br', 'ALUNO');
export const ALUNO = usuario(3, 'Lucas Mendes', 'lucas@ufrpe.br', 'ALUNO');
export const PROFESSORA = usuario(4, 'Carla Mendes', 'carla@ufrpe.br', 'PROFESSOR');
export const BEATRIZ = usuario(5, 'Beatriz Oliveira Santos', 'beatriz@ufrpe.br', 'ALUNO');
export const GABRIEL = usuario(6, 'Gabriel Henrique Ribeiro', 'gabriel@ufrpe.br', 'ALUNO');

export const USUARIOS_INICIAIS: UsuarioComSenha[] = [PROFESSOR, ALUNA, ALUNO, PROFESSORA, BEATRIZ, GABRIEL];

const id = (prefixo: number, n: number) => `${prefixo}0000000-0000-4000-8000-00000000000${n}`;

export const TURMA_A = id(1, 1);
export const TURMA_B = id(1, 2);
export const TURMA_C = id(1, 3);

export const A_LISTA_1 = id(2, 1); // pendente (Maria)
export const A_TRABALHO_1 = id(2, 2); // entregue (Maria)
export const A_LISTA_2 = id(2, 3); // entregue com atraso (Maria); tem 4 entregas para o professor
export const A_PROVA_1 = id(2, 4); // concluída, nota 9,5 (Maria)
export const A_LISTA_0 = id(2, 5); // atrasada (Maria)
export const A_PROJETO = id(2, 6); // ainda não disponível
export const B_PRATICA_2 = id(2, 7); // pendente (Maria)
export const B_SEMINARIO = id(2, 8); // pendente, em grupo (Maria)
export const C_MODELAGEM = id(2, 9); // entregue (Maria)

const DIA = 24 * 60 * 60 * 1000;

/** Dados iniciais relativos ao momento atual, para que os estados (pendente, atrasada...) sejam sempre os mesmos. */
export function dadosIniciais(agora: Date = new Date()) {
  const em = (dias: number, horas = 0) => new Date(agora.getTime() + dias * DIA + horas * 60 * 60 * 1000).toISOString();

  const turmas: TurmaDb[] = [
    { id: TURMA_A, professorId: PROFESSOR.id, nome: 'Turma A — Algoritmos', disciplina: 'Algoritmos e Estruturas de Dados II', semestre: '2026.2', diasAula: [1, 3], codigo: 'ALG202' },
    { id: TURMA_B, professorId: PROFESSORA.id, nome: 'Turma B — Programação Web', disciplina: 'Desenvolvimento de Aplicações Web', semestre: '2026.2', diasAula: [2, 4], codigo: 'WEB404' },
    { id: TURMA_C, professorId: PROFESSOR.id, nome: 'Turma C — Banco de Dados', disciplina: 'Sistemas de Banco de Dados I', semestre: '2026.1', diasAula: [5], codigo: 'BDK426' },
  ];

  const inscricoes: InscricaoDb[] = [
    { turmaId: TURMA_A, alunoId: ALUNA.id },
    { turmaId: TURMA_B, alunoId: ALUNA.id },
    { turmaId: TURMA_C, alunoId: ALUNA.id },
    { turmaId: TURMA_A, alunoId: ALUNO.id },
    { turmaId: TURMA_A, alunoId: BEATRIZ.id },
    { turmaId: TURMA_A, alunoId: GABRIEL.id },
  ];

  const atividades: AtividadeDb[] = [
    { id: A_LISTA_1, turmaId: TURMA_A, nome: 'Lista 1 — Recursão e Divisão e Conquista', descricao: 'Implementar soluções recursivas para os problemas clássicos propostos: Torre de Hanói, busca binária recursiva e algoritmo de divisão e conquista para merge sort.', complexidade: 'MEDIA', tipo: 'ATIVIDADE', modalidade: 'INDIVIDUAL', prazoFinal: em(2), disponivelEm: em(-5) },
    { id: A_TRABALHO_1, turmaId: TURMA_A, nome: 'Trabalho 1 — Árvores Binárias de Busca (BST)', descricao: 'Implementar uma BST com inserção, remoção e percursos.', complexidade: 'ALTA', tipo: 'TRABALHO', modalidade: 'INDIVIDUAL', prazoFinal: em(10), disponivelEm: em(-3) },
    { id: A_LISTA_2, turmaId: TURMA_A, nome: 'Lista 2 — Balanceamento AVL', descricao: 'Rotações simples e duplas em árvores AVL.', complexidade: 'MEDIA', tipo: 'ATIVIDADE', modalidade: 'INDIVIDUAL', prazoFinal: em(-9), disponivelEm: em(-20) },
    { id: A_PROVA_1, turmaId: TURMA_A, nome: 'Prova Teórica 1 — Estruturas Hierárquicas', complexidade: 'ALTA', tipo: 'PROVA', modalidade: 'INDIVIDUAL', prazoFinal: em(-20), disponivelEm: em(-30) },
    { id: A_LISTA_0, turmaId: TURMA_A, nome: 'Lista 0 — Revisão de Vetores', complexidade: 'BAIXA', tipo: 'ATIVIDADE', modalidade: 'INDIVIDUAL', prazoFinal: em(-1), disponivelEm: em(-12) },
    { id: A_PROJETO, turmaId: TURMA_A, nome: 'Projeto Final — Grafos', complexidade: 'ALTA', tipo: 'TRABALHO', modalidade: 'INDIVIDUAL', prazoFinal: em(30), disponivelEm: em(5) },
    { id: B_PRATICA_2, turmaId: TURMA_B, nome: 'Prática 2 — Layout Flexbox e CSS Grid', complexidade: 'BAIXA', tipo: 'ATIVIDADE', modalidade: 'INDIVIDUAL', prazoFinal: em(1), disponivelEm: em(-4) },
    { id: B_SEMINARIO, turmaId: TURMA_B, nome: 'Seminário — APIs REST', complexidade: 'MEDIA', tipo: 'TRABALHO', modalidade: 'GRUPO', prazoFinal: em(15), disponivelEm: em(-2) },
    { id: C_MODELAGEM, turmaId: TURMA_C, nome: 'Modelagem Relacional — Diagrama E/R', complexidade: 'ALTA', tipo: 'TRABALHO', modalidade: 'INDIVIDUAL', prazoFinal: em(7), disponivelEm: em(-6) },
  ];

  const entrega = (n: number, atividadeId: string, aluno: UsuarioComSenha, nome: string, kb: number, enviadaEm: string): EntregaDb => ({
    id: id(3, n),
    atividadeId,
    alunoId: aluno.id,
    nomeOriginal: nome,
    tamanhoBytes: kb * 1024,
    enviadaEm,
    conteudo: `Conteúdo simulado de ${nome}`,
  });

  const entregas: EntregaDb[] = [
    entrega(1, A_TRABALHO_1, ALUNA, 'bst_maria.pdf', 3100, em(-1)),
    entrega(2, A_LISTA_2, ALUNA, 'lista2_maria.pdf', 1800, em(-8)),
    entrega(3, A_LISTA_2, BEATRIZ, 'lista2_beatriz.pdf', 1500, em(-10)),
    entrega(4, A_LISTA_2, ALUNO, 'exercicios_avl_lucas.pdf', 2400, em(-8, -3)),
    entrega(5, A_LISTA_2, GABRIEL, 'gabriel_lista2.pdf', 950, em(-7)),
    entrega(6, A_PROVA_1, ALUNA, 'prova_maria.pdf', 800, em(-21)),
    entrega(7, C_MODELAGEM, ALUNA, 'diagrama_er.pdf', 2200, em(-2)),
  ];

  const avaliacoes: AvaliacaoDb[] = [
    { entregaId: id(3, 3), nota: 9.5, comentarioPrivado: 'Ótimo trabalho, rotações corretas.' },
    { entregaId: id(3, 4), nota: 8, comentarioPrivado: 'Faltou tratar o caso da rotação dupla à direita.' },
    { entregaId: id(3, 6), nota: 9.5, comentarioPrivado: 'Parabéns! Só revisar a questão 4.' },
  ];

  return { turmas, inscricoes, atividades, entregas, avaliacoes };
}

export const E_BST_MARIA = id(3, 1);
export const E_LISTA2_MARIA = id(3, 2);
export const E_LISTA2_BEATRIZ = id(3, 3);
export const E_LISTA2_LUCAS = id(3, 4);
export const E_LISTA2_GABRIEL = id(3, 5);
export const E_PROVA_MARIA = id(3, 6);
