import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorState } from '@/components/error-state';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { useMinhasAtividades } from '@/features/atividades/api';
import { FILTROS_VAZIOS, ROTULO_TIPO } from '@/features/atividades/filtros';
import { formatDataHora, plural } from '@/lib/format';
import { usePageTitle } from '@/lib/use-page-title';
import { cn } from '@/lib/utils';
import { agruparPorSemana, inicioDaSemana, type Carga, type Semana } from './carga';

const SEMANAS_POR_JANELA = 4;
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

const ROTULO_CARGA: Record<Carga, string> = { LIVRE: 'livre', MEDIA: 'média', PESADA: 'pesada' };
// A carga sempre vai em texto; a cor só reforça e não usa o vermelho de erro.
const CLASSES_CARGA: Record<Carga, string> = {
  LIVRE: 'bg-secondary text-muted-foreground',
  MEDIA: 'border border-primary bg-card text-primary',
  PESADA: 'bg-highlight text-highlight-foreground',
};

const diaMes = (d: Date) => `${d.getDate()} de ${MESES[d.getMonth()]}`;

function tituloDaSemana(inicio: Date): string {
  const fim = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 6);
  const mesmoMes = inicio.getMonth() === fim.getMonth();
  return `Semana de ${mesmoMes ? inicio.getDate() : diaMes(inicio)} a ${diaMes(fim)}`;
}

function textoDaCarga({ carga, atividades }: Semana): string {
  return carga === 'LIVRE' ? 'Semana livre' : `Semana ${ROTULO_CARGA[carga]} · ${plural(atividades.length, 'prazo')}`;
}

const DIAS_CURTOS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'];
const mesmoDia = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/** Faixa visual de segunda a domingo; a lista abaixo continua sendo a fonte acessível. */
function FaixaDaSemana({ semana }: { semana: Semana }) {
  const hoje = new Date();
  return (
    <div aria-hidden="true" className="grid grid-cols-7 gap-1 sm:gap-2">
      {DIAS_CURTOS.map((nome, i) => {
        const dia = new Date(semana.inicio.getFullYear(), semana.inicio.getMonth(), semana.inicio.getDate() + i);
        const prazos = semana.atividades.filter((a) => mesmoDia(new Date(a.prazoFinal), dia)).length;
        const ehHoje = mesmoDia(dia, hoje);
        return (
          <div
            key={nome}
            className={cn(
              'flex min-h-14 flex-col items-center justify-between rounded-lg border p-1 text-center sm:min-h-16',
              prazos > 0 ? 'border-primary bg-primary/5' : 'border-border bg-background',
              ehHoje && 'ring-2 ring-ring',
            )}
          >
            <span className="text-[10px] uppercase text-muted-foreground sm:text-xs">{nome}</span>
            <span className={cn('text-sm font-semibold sm:text-base', prazos > 0 ? 'text-primary' : 'text-muted-foreground')}>
              {dia.getDate()}
            </span>
            <span className={cn('min-h-4 rounded-full px-1.5 text-[10px] font-semibold sm:text-xs', prazos > 0 && 'bg-primary text-primary-foreground')}>
              {prazos > 0 ? prazos : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SemanaSecao({ semana }: { semana: Semana }) {
  const idTitulo = useId();
  return (
    <section aria-labelledby={idTitulo} className="space-y-2 rounded-xl border border-border bg-card p-3 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 id={idTitulo} className="text-sm sm:text-base font-semibold text-primary">
          {tituloDaSemana(semana.inicio)}
        </h3>
        <span className={cn('inline-flex min-h-5 sm:min-h-6 items-center rounded-full px-2 sm:px-2.5 text-[11px] sm:text-xs font-semibold', CLASSES_CARGA[semana.carga])}>
          {textoDaCarga(semana)}
        </span>
      </div>
      <FaixaDaSemana semana={semana} />
      {semana.atividades.length > 0 ? (
        <ul className="divide-y divide-border">
          {semana.atividades.map((a) => (
            <li key={a.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2">
              <div className="min-w-0">
                <Link to={`/atividades/${a.id}`} className="font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {a.nome}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {`${a.turmaNome} · ${ROTULO_TIPO[a.tipo]} · ${DIAS[new Date(a.prazoFinal).getDay()]} ${formatDataHora(a.prazoFinal)}`}
                </p>
              </div>
              {a.estado ? <StatusBadge estado={a.estado} nota={a.nota} /> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

export function CalendarioPage() {
  usePageTitle('Calendário');
  const atividades = useMinhasAtividades(FILTROS_VAZIOS);
  const [deslocamento, setDeslocamento] = useState(0); // em janelas de quatro semanas
  const inicio = useMemo(() => {
    const base = inicioDaSemana(new Date());
    return new Date(base.getFullYear(), base.getMonth(), base.getDate() + 7 * SEMANAS_POR_JANELA * deslocamento);
  }, [deslocamento]);
  const semanas = useMemo(
    () => agruparPorSemana(atividades.data ?? [], inicio, SEMANAS_POR_JANELA),
    [atividades.data, inicio],
  );

  return (
    <section aria-labelledby="titulo-pagina" className="space-y-4 sm:space-y-5">
      <div className="space-y-0.5 sm:space-y-1">
        <h2 id="titulo-pagina" className="text-xl sm:text-2xl font-bold text-primary">
          Calendário
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Prazos finais por semana, de segunda a domingo. A carga conta só os prazos: nenhum é livre, 1 ou 2 é média e 3 ou mais é pesada.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" onClick={() => setDeslocamento((d) => d - 1)}>
          <ChevronLeft aria-hidden="true" className="size-4" />
          Semanas anteriores
        </Button>
        <Button type="button" variant="outline" onClick={() => setDeslocamento((d) => d + 1)}>
          Semanas seguintes
          <ChevronRight aria-hidden="true" className="size-4" />
        </Button>
        {deslocamento !== 0 ? (
          <Button type="button" variant="ghost" onClick={() => setDeslocamento(0)}>
            Voltar para esta semana
          </Button>
        ) : null}
      </div>

      {atividades.isPending ? (
        <div role="status" aria-label="Carregando" aria-busy="true" className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-20 rounded-xl border border-border bg-secondary" />
          ))}
        </div>
      ) : null}
      {atividades.isError ? (
        <ErrorState
          mensagem="Não conseguimos carregar o calendário. Verifique a conexão e tente de novo."
          onRetry={() => void atividades.refetch()}
        />
      ) : null}
      {atividades.isSuccess ? (
        <div className="space-y-3">
          {semanas.map((s) => (
            <SemanaSecao key={s.inicio.toISOString()} semana={s} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
