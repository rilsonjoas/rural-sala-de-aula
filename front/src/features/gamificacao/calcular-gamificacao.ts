import type { components } from '@/lib/api.generated';
import type { Conquista, PerfilGamificacao } from './tipos';

type Atividade = components['schemas']['Atividade'] & {
  minhaEntrega?: components['schemas']['Entrega'] | null;
};

const MS_DIA = 24 * 60 * 60 * 1000;

function obteveAntecedencia(atividade: Atividade): boolean {
  if (atividade.minhaEntrega?.enviadaEm && atividade.prazoFinal) {
    const envio = new Date(atividade.minhaEntrega.enviadaEm).getTime();
    const prazo = new Date(atividade.prazoFinal).getTime();
    return prazo - envio >= MS_DIA;
  }
  return false;
}

export function calcularGamificacao(atividades: Atividade[]): PerfilGamificacao {
  let xpTotal = 0;
  let entregasNoPrazo = 0;
  let entregasAtrasadas = 0;
  let entregasComAntecedencia = 0;
  let temNotaDestaque = false;
  let entregouGrupo = false;

  for (const a of atividades) {
    const estado = a.estado;
    const nota = a.nota;

    if (estado === 'ENTREGUE' || estado === 'CONCLUIDA') {
      entregasNoPrazo++;
      xpTotal += 50; // Entrega no prazo base

      if (obteveAntecedencia(a)) {
        entregasComAntecedencia++;
        xpTotal += 20; // Bônus de antecedência
      }

      if (nota != null) {
        xpTotal += 30; // Avaliação recebida
        if (nota >= 7.0) {
          xpTotal += 10; // Bônus de nota azul / boa
        }
      }
    } else if (estado === 'ENTREGUE_COM_ATRASO') {
      entregasAtrasadas++;
      xpTotal += 15; // Pontuação menor, sem punição

      if (nota != null) {
        xpTotal += 30;
        if (nota >= 7.0) {
          xpTotal += 10;
        }
      }
    }

    if (nota != null && nota >= 9.0) {
      temNotaDestaque = true;
    }

    if (
      a.tipo === 'PROJETO_EM_GRUPO' &&
      (estado === 'ENTREGUE' || estado === 'CONCLUIDA' || estado === 'ENTREGUE_COM_ATRASO')
    ) {
      entregouGrupo = true;
    }
  }

  const entregasConcluidas = entregasNoPrazo + entregasAtrasadas;
  const nivel = Math.max(1, Math.floor(entregasConcluidas / 3) + 1);
  const entregasNoNivelAtual = entregasConcluidas % 3;
  const entregasParaSubirNivel = 3 - entregasNoNivelAtual;
  const xpParaProximoNivel = entregasParaSubirNivel * 50;

  // Streak de semanas com entregas no prazo
  const semanasComEntrega = new Set<string>();
  for (const a of atividades) {
    if (a.estado === 'ENTREGUE' || a.estado === 'CONCLUIDA') {
      const dataRef = a.minhaEntrega?.enviadaEm ? new Date(a.minhaEntrega.enviadaEm) : new Date(a.prazoFinal);
      if (!isNaN(dataRef.getTime())) {
        const ano = dataRef.getUTCFullYear();
        const semana = Math.ceil(
          ((dataRef.getTime() - new Date(Date.UTC(ano, 0, 1)).getTime()) / MS_DIA + 1) / 7
        );
        semanasComEntrega.add(`${ano}-W${semana}`);
      }
    }
  }
  const streakSemanas = semanasComEntrega.size;
  const recordeStreakSemanas = streakSemanas;

  const temAtrasadaPendente = atividades.some((a) => a.estado === 'ATRASADA');
  const semestreEmDia = atividades.length > 0 && !temAtrasadaPendente;

  const conquistas: Conquista[] = [
    {
      id: 'primeiro-passo',
      titulo: 'Primeiro Passo',
      descricao: 'Realizou a 1ª entrega no sistema',
      icone: '🎯',
      desbloqueada: entregasConcluidas >= 1,
      progressoAtual: Math.min(1, entregasConcluidas),
      progressoTotal: 1,
    },
    {
      id: 'pontualidade-rural',
      titulo: 'Pontualidade Rural',
      descricao: '3 entregas concluídas sem atraso',
      icone: '⏱️',
      desbloqueada: entregasNoPrazo >= 3,
      progressoAtual: Math.min(3, entregasNoPrazo),
      progressoTotal: 3,
    },
    {
      id: 'sempre-adiante',
      titulo: 'Sempre Adiante',
      descricao: 'Entrega enviada com 24h+ de antecedência',
      icone: '⚡',
      desbloqueada: entregasComAntecedencia >= 1,
      progressoAtual: Math.min(1, entregasComAntecedencia),
      progressoTotal: 1,
    },
    {
      id: 'nota-destaque',
      titulo: 'Nota de Destaque',
      descricao: 'Recebeu nota igual ou superior a 9,0',
      icone: '🏅',
      desbloqueada: temNotaDestaque,
      progressoAtual: temNotaDestaque ? 1 : 0,
      progressoTotal: 1,
    },
    {
      id: 'semestre-em-dia',
      titulo: 'Semestre em Dia',
      descricao: 'Nenhuma atividade atrasada pendente',
      icone: '📚',
      desbloqueada: semestreEmDia,
      progressoAtual: semestreEmDia ? 1 : 0,
      progressoTotal: 1,
    },
    {
      id: 'espirito-equipe',
      titulo: 'Espírito de Equipe',
      descricao: 'Entregou atividade do tipo Projeto em Grupo',
      icone: '🤝',
      desbloqueada: entregouGrupo,
      progressoAtual: entregouGrupo ? 1 : 0,
      progressoTotal: 1,
    },
  ];

  return {
    nivel,
    xpTotal,
    xpParaProximoNivel,
    entregasConcluidas,
    entregasNoNivelAtual,
    entregasParaSubirNivel,
    streakSemanas,
    recordeStreakSemanas,
    conquistas,
  };
}

