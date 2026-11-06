import type { Atividade } from '@/features/atividades/filtros';

export type Carga = 'LIVRE' | 'MEDIA' | 'PESADA';

export type Semana = { inicio: Date; atividades: Atividade[]; carga: Carga };

/** Segunda-feira, 00:00 (horário local), da semana da data. */
export function inicioDaSemana(data: Date): Date {
  const inicio = new Date(data.getFullYear(), data.getMonth(), data.getDate());
  inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
  return inicio;
}

/** Só a quantidade de prazos na semana: 0 livre, 1 e 2 média, 3 ou mais pesada (sem complexidade). */
export function cargaDaSemana(quantidade: number): Carga {
  if (quantidade === 0) return 'LIVRE';
  return quantidade <= 2 ? 'MEDIA' : 'PESADA';
}

/** Agrupa as atividades pelo prazo final em `quantidade` semanas seguidas a partir de `inicio` (segunda). */
export function agruparPorSemana(atividades: Atividade[], inicio: Date, quantidade: number): Semana[] {
  const ordenadas = [...atividades].sort((a, b) => new Date(a.prazoFinal).getTime() - new Date(b.prazoFinal).getTime());
  return Array.from({ length: quantidade }, (_, i) => {
    const ini = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 7 * i);
    const fim = new Date(ini.getFullYear(), ini.getMonth(), ini.getDate() + 7);
    const daSemana = ordenadas.filter((a) => {
      const prazo = new Date(a.prazoFinal).getTime();
      return prazo >= ini.getTime() && prazo < fim.getTime();
    });
    return { inicio: ini, atividades: daSemana, carga: cargaDaSemana(daSemana.length) };
  });
}
