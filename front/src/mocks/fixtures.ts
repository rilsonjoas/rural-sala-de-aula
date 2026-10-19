import type { components } from '@/lib/api.generated';
import type { AtividadeDb, AvaliacaoDb, AvisoDb, EntregaDb, InscricaoDb, TurmaDb } from './domain';

export type Usuario = components['schemas']['Usuario'];
export type UsuarioComSenha = Usuario & { senha: string };

const usuario = (n: number, nome: string, email: string, papel: Usuario['papel']): UsuarioComSenha => ({
  id: `00000000-0000-4000-8000-00000000000${n}`,
  nome,
  email,
  papel,
  senha: 'senha1234',
});

export const PROFESSOR = usuario(1, 'Paulo Silva', 'paulo@ufrpe.br', 'PROFESSOR');
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
export const TURMA_D = id(1, 4);
export const TURMA_E = id(1, 5);

export const A_LISTA_1 = id(2, 1); // pendente (Maria)
export const A_TRABALHO_1 = id(2, 2); // entregue (Maria)
export const A_LISTA_2 = id(2, 3); // entregue com atraso (Maria); tem 4 entregas para o professor
export const A_PROVA_1 = id(2, 4); // concluída, nota 9,5 (Maria)
export const A_LISTA_0 = id(2, 5); // atrasada (Maria)
export const A_PROJETO = id(2, 6); // ainda não disponível
export const B_PRATICA_2 = id(2, 7); // pendente (Maria e Paulo - vence em 1 dia)
export const B_SEMINARIO = id(2, 8); // pendente, em grupo (Maria e Paulo)
export const C_MODELAGEM = id(2, 9); // entregue (Maria)
export const D_HANDSON_1 = id(2, 10); // entregue (Paulo)
export const D_PRATICA_1 = id(2, 11); // entregue com atraso (Paulo)
export const D_DESAFIO = id(2, 12); // atrasada (Paulo)
export const D_PROVA_1 = id(2, 13); // concluída nota 9,2 (Paulo)
export const D_PROJETO = id(2, 14); // pendente (Paulo)
export const E_ARTIGO = id(2, 15); // concluída nota 10,0 (Paulo)

const DIA = 24 * 60 * 60 * 1000;

/** Dados iniciais relativos ao momento atual, para que os estados (pendente, atrasada...) sejam sempre os mesmos. */
export function dadosIniciais(agora: Date = new Date()) {
  const em = (dias: number, horas = 0) => new Date(agora.getTime() + dias * DIA + horas * 60 * 60 * 1000).toISOString();

  const turmas: TurmaDb[] = [
    { id: TURMA_A, professorId: PROFESSOR.id, nome: 'Turma A — Algoritmos', disciplina: 'Algoritmos e Estruturas de Dados II', semestre: '2026.2', diasAula: [1, 3], codigo: 'ALG202' },
    { id: TURMA_B, professorId: PROFESSORA.id, nome: 'Turma B — Programação Web', disciplina: 'Desenvolvimento de Aplicações Web', semestre: '2026.2', diasAula: [2, 4], codigo: 'WEB404' },
    { id: TURMA_C, professorId: PROFESSOR.id, nome: 'Turma C — Banco de Dados', disciplina: 'Sistemas de Banco de Dados I', semestre: '2026.1', diasAula: [5], codigo: 'BDK426' },
    { id: TURMA_D, professorId: PROFESSORA.id, nome: 'Turma D — Inteligência Artificial', disciplina: 'Inteligência Artificial Aplicada', semestre: '2026.2', diasAula: [1, 3], codigo: 'IAA505', descricao: 'Fundamentos de ML, redes neurais e processamento de linguagem natural.' },
    { id: TURMA_E, professorId: PROFESSORA.id, nome: 'Turma E — Metodologia Científica', disciplina: 'Metodologia da Pesquisa Científica', semestre: '2026.1', diasAula: [5], codigo: 'MET101', descricao: 'Estrutura de artigos, métodos de pesquisa e escrita acadêmica.' },
  ];

  const inscricoes: InscricaoDb[] = [
    { turmaId: TURMA_A, alunoId: ALUNA.id },
    { turmaId: TURMA_B, alunoId: ALUNA.id },
    { turmaId: TURMA_C, alunoId: ALUNA.id },
    { turmaId: TURMA_A, alunoId: ALUNO.id },
    { turmaId: TURMA_A, alunoId: BEATRIZ.id },
    { turmaId: TURMA_A, alunoId: GABRIEL.id },
    // Paulo matriculado como Aluno nas turmas da Profª Carla Mendes:
    { turmaId: TURMA_B, alunoId: PROFESSOR.id },
    { turmaId: TURMA_D, alunoId: PROFESSOR.id },
    { turmaId: TURMA_E, alunoId: PROFESSOR.id },
    // Lucas também matriculado em IA:
    { turmaId: TURMA_D, alunoId: ALUNO.id },
  ];

  const atividades: AtividadeDb[] = [
    { id: A_LISTA_1, turmaId: TURMA_A, nome: 'Lista 1 — Recursão e Divisão e Conquista', descricao: 'Implementar soluções recursivas para os problemas clássicos propostos: Torre de Hanói, busca binária recursiva e algoritmo de divisão e conquista para merge sort.', tipo: 'LISTA_DE_EXERCICIO', prazoFinal: em(2), disponivelEm: em(-5), aceitaAtraso: true },
    { id: A_TRABALHO_1, turmaId: TURMA_A, nome: 'Trabalho 1 — Árvores Binárias de Busca (BST)', descricao: 'Implementar uma BST com inserção, remoção e percursos.', tipo: 'PROJETO_INDIVIDUAL', prazoFinal: em(10), disponivelEm: em(-3), aceitaAtraso: true },
    { id: A_LISTA_2, turmaId: TURMA_A, nome: 'Lista 2 — Balanceamento AVL', descricao: 'Rotações simples e duplas em árvores AVL.', tipo: 'LISTA_DE_EXERCICIO', prazoFinal: em(-9), disponivelEm: em(-20), aceitaAtraso: true },
    { id: A_PROVA_1, turmaId: TURMA_A, nome: 'Prova Teórica 1 — Estruturas Hierárquicas', tipo: 'PROVA', prazoFinal: em(-20), disponivelEm: em(-30), aceitaAtraso: false },
    { id: A_LISTA_0, turmaId: TURMA_A, nome: 'Lista 0 — Revisão de Vetores', tipo: 'LISTA_DE_EXERCICIO', prazoFinal: em(-1), disponivelEm: em(-12), aceitaAtraso: true },
    { id: A_PROJETO, turmaId: TURMA_A, nome: 'Projeto Final — Grafos', tipo: 'PROJETO_INDIVIDUAL', prazoFinal: em(30), disponivelEm: em(5), aceitaAtraso: true },
    { id: B_PRATICA_2, turmaId: TURMA_B, nome: 'Prática 2 — Layout Flexbox e CSS Grid', tipo: 'LISTA_DE_EXERCICIO', prazoFinal: em(1), disponivelEm: em(-4), aceitaAtraso: true },
    { id: B_SEMINARIO, turmaId: TURMA_B, nome: 'Seminário — APIs REST e GraphQL', tipo: 'PROJETO_EM_GRUPO', prazoFinal: em(15), disponivelEm: em(-2), aceitaAtraso: true },
    { id: C_MODELAGEM, turmaId: TURMA_C, nome: 'Modelagem Relacional — Diagrama E/R', tipo: 'PROJETO_INDIVIDUAL', prazoFinal: em(7), disponivelEm: em(-6), aceitaAtraso: true },
    { id: D_HANDSON_1, turmaId: TURMA_D, nome: 'Hands-on 1 — Análise Exploratória com Pandas', tipo: 'LISTA_DE_EXERCICIO', prazoFinal: em(4), disponivelEm: em(-3), aceitaAtraso: true },
    { id: D_PRATICA_1, turmaId: TURMA_D, nome: 'Hands-on 2 — Classificação com Scikit-Learn', tipo: 'LISTA_DE_EXERCICIO', prazoFinal: em(-5), disponivelEm: em(-15), aceitaAtraso: true },
    { id: D_DESAFIO, turmaId: TURMA_D, nome: 'Desafio — Otimização de Hiperparâmetros', tipo: 'PROJETO_INDIVIDUAL', prazoFinal: em(-2), disponivelEm: em(-10), aceitaAtraso: true },
    { id: D_PROVA_1, turmaId: TURMA_D, nome: 'Prova Teórica 1 — Conceitos de Aprendizado Supervisionado', tipo: 'PROVA', prazoFinal: em(-14), disponivelEm: em(-25), aceitaAtraso: false },
    { id: D_PROJETO, turmaId: TURMA_D, nome: 'Projeto Final — Classificação de Texto com NLP', tipo: 'PROJETO_EM_GRUPO', prazoFinal: em(20), disponivelEm: em(-1), aceitaAtraso: true },
    { id: E_ARTIGO, turmaId: TURMA_E, nome: 'Artigo Final — Revisão Sistemática da Literatura', tipo: 'PROJETO_INDIVIDUAL', prazoFinal: em(-45), disponivelEm: em(-60), aceitaAtraso: true },
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
    // Entregas de Paulo como aluno:
    entrega(8, D_HANDSON_1, PROFESSOR, 'eda_paulo_silva.ipynb', 1420, em(-1)), // entregue no prazo (prazo é +4)
    entrega(9, D_PRATICA_1, PROFESSOR, 'scikit_paulo_silva.zip', 850, em(-4)), // entregue com atraso (prazo era -5)
    entrega(10, D_PROVA_1, PROFESSOR, 'prova1_ia_paulo.pdf', 620, em(-15)), // entregue no prazo (prazo era -14)
    entrega(11, E_ARTIGO, PROFESSOR, 'artigo_revisao_paulo.pdf', 2850, em(-48)), // entregue no prazo (prazo era -45)
  ];

  const avaliacoes: AvaliacaoDb[] = [
    { entregaId: id(3, 3), nota: 9.5, comentarioPrivado: 'Ótimo trabalho, rotações corretas.' },
    { entregaId: id(3, 4), nota: 8, comentarioPrivado: 'Faltou tratar o caso da rotação dupla à direita.' },
    { entregaId: id(3, 6), nota: 9.5, comentarioPrivado: 'Parabéns! Só revisar a questão 4.' },
    // Avaliações das entregas de Paulo:
    { entregaId: id(3, 10), nota: 9.2, comentarioPrivado: 'Excelente domínio dos conceitos de overfitting, regularização e validação cruzada.' },
    { entregaId: id(3, 11), nota: 10, comentarioPrivado: 'Trabalho de altíssimo nível acadêmico! Metodologia PRISMA aplicada com rigor e síntese crítica exemplar.' },
  ];

  const avisos: AvisoDb[] = [
    {
      id: id(4, 1),
      turmaId: TURMA_A,
      autorId: PROFESSOR.id,
      autorNome: PROFESSOR.nome,
      texto: 'Olá, turma! Sejam muito bem-vindos à disciplina. Os avisos importantes e as atividades serão compartilhados por aqui.',
      horario: em(-10),
      comentarios: [
        {
          id: id(5, 1),
          avisoId: id(4, 1),
          autorId: ALUNA.id,
          autorNome: ALUNA.nome,
          texto: 'Professor, os slides das aulas já estão disponíveis?',
          horario: em(-9),
        },
        {
          id: id(5, 2),
          avisoId: id(4, 1),
          autorId: PROFESSOR.id,
          autorNome: PROFESSOR.nome,
          texto: 'Sim! Podem acessar no drive da turma.',
          horario: em(-9, 1),
        },
      ],
    },
    {
      id: id(4, 2),
      turmaId: TURMA_B,
      autorId: PROFESSORA.id,
      autorNome: PROFESSORA.nome,
      texto: 'Olá, pessoal! O material da aula de Flexbox e CSS Grid já está disponível no drive. Façam a Prática 2 antes do prazo final.',
      horario: em(-3),
      comentarios: [
        {
          id: id(5, 3),
          avisoId: id(4, 2),
          autorId: PROFESSOR.id,
          autorNome: PROFESSOR.nome,
          texto: 'Professora Carla, os exemplos em sala sobre layout responsivo ajudaram muito!',
          horario: em(-2),
        },
        {
          id: id(5, 4),
          avisoId: id(4, 2),
          autorId: ALUNA.id,
          autorNome: ALUNA.nome,
          texto: 'Também gostei bastante! Recomendo o jogo Flexbox Froggy pra treinar.',
          horario: em(-1),
        },
      ],
    },
    {
      id: id(4, 3),
      turmaId: TURMA_D,
      autorId: PROFESSORA.id,
      autorNome: PROFESSORA.nome,
      texto: 'Sejam bem-vindos à disciplina de Inteligência Artificial Aplicada! Aqui postaremos todos os datasets e notebooks dos laboratórios.',
      horario: em(-8),
      comentarios: [
        {
          id: id(5, 5),
          avisoId: id(4, 3),
          autorId: PROFESSOR.id,
          autorNome: PROFESSOR.nome,
          texto: 'Excelente iniciativa, professora! Animado para começar os módulos práticos com PyTorch.',
          horario: em(-7),
        },
      ],
    },
  ];

  return { turmas, inscricoes, atividades, entregas, avaliacoes, avisos };
}

export const E_BST_MARIA = id(3, 1);
export const E_LISTA2_MARIA = id(3, 2);
export const E_LISTA2_BEATRIZ = id(3, 3);
export const E_LISTA2_LUCAS = id(3, 4);
export const E_LISTA2_GABRIEL = id(3, 5);
export const E_PROVA_MARIA = id(3, 6);
