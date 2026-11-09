import { describe, expect, it } from 'vitest';
import { calcularGamificacao } from './calcular-gamificacao';
import type { components } from '@/lib/api.generated';

type Atividade = components['schemas']['Atividade'] & {
  minhaEntrega?: components['schemas']['Entrega'] | null;
};

const baseAtividade = (override: Partial<Atividade>): Atividade => ({
  id: 'ativ-1',
  turmaId: 'turma-1',
  turmaNome: 'Algoritmos',
  nome: 'Lista 1',
  tipo: 'LISTA_DE_EXERCICIO',
  prazoFinal: '2026-11-10T23:59:00Z',
  disponivelEm: '2026-11-01T08:00:00Z',
  aceitaAtraso: true,
  estado: 'PENDENTE',
  nota: null,
  ...override,
});

describe('calcularGamificacao', () => {
  it('começa no nível 1 com 0 XP quando não há entregas', () => {
    const perfil = calcularGamificacao([]);
    expect(perfil.nivel).toBe(1);
    expect(perfil.xpTotal).toBe(0);
    expect(perfil.entregasConcluidas).toBe(0);
    expect(perfil.entregasParaSubirNivel).toBe(3);
    expect(perfil.conquistas.every((c) => !c.desbloqueada)).toBe(true);
  });

  it('concede 50 XP e desbloqueia Primeiro Passo na primeira entrega no prazo', () => {
    const atividades = [
      baseAtividade({ id: '1', estado: 'ENTREGUE' }),
    ];
    const perfil = calcularGamificacao(atividades);
    expect(perfil.nivel).toBe(1);
    expect(perfil.xpTotal).toBe(50);
    expect(perfil.entregasConcluidas).toBe(1);
    expect(perfil.entregasParaSubirNivel).toBe(2);

    const primeiroPasso = perfil.conquistas.find((c) => c.id === 'primeiro-passo');
    expect(primeiroPasso?.desbloqueada).toBe(true);

    const semestreEmDia = perfil.conquistas.find((c) => c.id === 'semestre-em-dia');
    expect(semestreEmDia?.desbloqueada).toBe(true);
  });

  it('sobe para o nível 2 após 3 entregas e desbloqueia Pontualidade Rural', () => {
    const atividades = [
      baseAtividade({ id: '1', estado: 'ENTREGUE' }),
      baseAtividade({ id: '2', estado: 'ENTREGUE' }),
      baseAtividade({ id: '3', estado: 'ENTREGUE' }),
    ];
    const perfil = calcularGamificacao(atividades);
    expect(perfil.nivel).toBe(2);
    expect(perfil.xpTotal).toBe(150);
    expect(perfil.entregasConcluidas).toBe(3);
    expect(perfil.entregasParaSubirNivel).toBe(3);

    const pontualidade = perfil.conquistas.find((c) => c.id === 'pontualidade-rural');
    expect(pontualidade?.desbloqueada).toBe(true);
  });

  it('adiciona bônus de antecedência (+20 XP) e desbloqueia Sempre Adiante', () => {
    const atividades = [
      baseAtividade({
        id: '1',
        estado: 'ENTREGUE',
        prazoFinal: '2026-11-10T23:59:00Z',
        minhaEntrega: {
          id: 'ent-1',
          atividadeId: '1',
          alunoId: 'aluno-1',
          alunoNome: 'Aluno',
          nomeOriginal: 'trabalho.pdf',
          tamanhoBytes: 1024,
          enviadaEm: '2026-11-08T10:00:00Z', // 2+ dias antes
          atrasada: false,
        },
      }),
    ];
    const perfil = calcularGamificacao(atividades);
    expect(perfil.xpTotal).toBe(70); // 50 base + 20 antecedencia
    const sempreAdiante = perfil.conquistas.find((c) => c.id === 'sempre-adiante');
    expect(sempreAdiante?.desbloqueada).toBe(true);
  });

  it('concede XP de avaliação (+30) e bônus de nota (>=7 +10) e desbloqueia Nota de Destaque se nota >= 9.0', () => {
    const atividades = [
      baseAtividade({
        id: '1',
        estado: 'CONCLUIDA',
        nota: 9.5,
      }),
    ];
    const perfil = calcularGamificacao(atividades);
    // 50 (prazo) + 30 (avaliacao) + 10 (nota >= 7) = 90 XP
    expect(perfil.xpTotal).toBe(90);

    const notaDestaque = perfil.conquistas.find((c) => c.id === 'nota-destaque');
    expect(notaDestaque?.desbloqueada).toBe(true);
  });

  it('concede 15 XP em entrega com atraso sem bloquear evolução', () => {
    const atividades = [
      baseAtividade({ id: '1', estado: 'ENTREGUE_COM_ATRASO' }),
    ];
    const perfil = calcularGamificacao(atividades);
    expect(perfil.xpTotal).toBe(15);
    expect(perfil.entregasConcluidas).toBe(1);
  });

  it('desbloqueia Espírito de Equipe quando entrega PROJETO_EM_GRUPO', () => {
    const atividades = [
      baseAtividade({ id: '1', tipo: 'PROJETO_EM_GRUPO', estado: 'ENTREGUE' }),
    ];
    const perfil = calcularGamificacao(atividades);
    const equipe = perfil.conquistas.find((c) => c.id === 'espirito-equipe');
    expect(equipe?.desbloqueada).toBe(true);
  });

  it('não desbloqueia Semestre em Dia se houver atividade atrasada', () => {
    const atividades = [
      baseAtividade({ id: '1', estado: 'ENTREGUE' }),
      baseAtividade({ id: '2', estado: 'ATRASADA' }),
    ];
    const perfil = calcularGamificacao(atividades);
    const semestreEmDia = perfil.conquistas.find((c) => c.id === 'semestre-em-dia');
    expect(semestreEmDia?.desbloqueada).toBe(false);
  });
});
