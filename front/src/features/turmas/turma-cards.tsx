import { AlarmClock, ArrowRight, CheckCircle2, Clock, Users } from 'lucide-react';
import { useId } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useMinhasAtividades } from '@/features/atividades/api';
import { FILTROS_VAZIOS } from '@/features/atividades/filtros';
import { formatDias, plural } from '@/lib/format';
import { alunoComPressa } from '@/lib/urgencia';
import { cn } from '@/lib/utils';
import { CopiarCodigo } from './copiar-codigo';
import type { Turma } from './api';

function CardBase({ turma, papel, children }: { turma: Turma; papel?: 'Professor' | 'Aluno'; children: React.ReactNode }) {
  const idTitulo = useId();
  return (
    <article
      aria-labelledby={idTitulo}
      className={cn(
        'space-y-2.5 sm:space-y-3 rounded-xl border border-l-4 bg-card p-3.5 sm:p-4 transition-shadow hover:shadow-xs',
        papel === 'Professor' ? 'border-border border-l-primary' : 'border-border border-l-emerald-600',
      )}
    >
      <div className="flex items-start justify-between gap-2.5 sm:gap-3">
        <div>
          <span
            className={cn(
              'mb-1 inline-block rounded-full px-2 py-0.5 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider',
              papel === 'Professor' ? 'bg-primary/10 text-primary' : 'bg-emerald-500/15 text-emerald-700',
            )}
          >
            {papel ?? 'Turma'}
          </span>
          <h3 id={idTitulo} className="text-lg sm:text-xl font-semibold text-primary leading-snug">
            {turma.nome}
          </h3>
        </div>
        <span className="shrink-0 rounded-full bg-secondary px-2 sm:px-2.5 py-0.5 text-xs sm:text-sm font-semibold text-primary">{turma.semestre}</span>
      </div>
      {turma.descricao && turma.descricao !== turma.nome ? (
        <p className="text-xs sm:text-sm text-muted-foreground">{turma.descricao}</p>
      ) : turma.disciplina && turma.disciplina !== turma.nome ? (
        <p className="text-xs sm:text-sm text-muted-foreground">{turma.disciplina}</p>
      ) : null}
      {children}
      <Button asChild variant="secondary" className="w-full min-h-9 sm:min-h-10 text-xs sm:text-sm">
        <Link to={`/turmas/${turma.id}`}>
          Ver turma
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </Button>
    </article>
  );
}

const Linha = ({ icone: Icone, children }: { icone: typeof Clock; children: React.ReactNode }) => (
  <p className="flex items-center gap-2 text-sm text-muted-foreground">
    <Icone aria-hidden="true" className="size-4 shrink-0" />
    {children}
  </p>
);

export function TurmaCardAluno({ turma }: { turma: Turma }) {
  const pendentes = turma.atividadesPendentes ?? 0;
  const atrasadas = turma.atividadesAtrasadas ?? 0;
  const minhas = useMinhasAtividades(FILTROS_VAZIOS);
  const comPressa = minhas.data?.filter((a) => a.turmaId === turma.id && alunoComPressa(a)).length ?? 0;
  const pendentesSemPressa = Math.max(0, pendentes - comPressa);

  return (
    <CardBase turma={turma} papel="Aluno">
      <Linha icone={Users}>Prof. {turma.professorNome}</Linha>
      {turma.diasAula && turma.diasAula.length > 0 ? (
        <Linha icone={Clock}>{formatDias(turma.diasAula)}</Linha>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        {atrasadas > 0 ? (
          <span className="inline-flex min-h-6 items-center rounded-full bg-destructive px-2.5 text-xs font-semibold text-destructive-foreground">
            {plural(atrasadas, 'atrasada')}
          </span>
        ) : null}
        {comPressa > 0 ? (
          <span className="inline-flex min-h-6 items-center gap-1.5 rounded-full bg-highlight px-2.5 text-xs font-semibold text-highlight-foreground">
            <AlarmClock aria-hidden="true" className="size-3.5" />
            {comPressa === 1 ? '1 vence em breve' : `${comPressa} vencem em breve`}
          </span>
        ) : null}
        {pendentesSemPressa > 0 ? (
          <span className="inline-flex min-h-6 items-center rounded-full border border-primary bg-card px-2.5 text-xs font-semibold text-primary">
            {plural(pendentesSemPressa, 'pendente')}
          </span>
        ) : null}
        {pendentes === 0 && atrasadas === 0 ? (
          <span className="inline-flex min-h-6 items-center gap-1.5 rounded-full bg-secondary px-2.5 text-xs font-semibold text-primary">
            <CheckCircle2 aria-hidden="true" className="size-3.5" />
            Em dia
          </span>
        ) : null}
      </div>
    </CardBase>
  );
}

export function TurmaCardProfessor({ turma }: { turma: Turma }) {
  return (
    <CardBase turma={turma} papel="Professor">
      {turma.diasAula && turma.diasAula.length > 0 ? (
        <Linha icone={Clock}>{formatDias(turma.diasAula)}</Linha>
      ) : null}
      <div className={cn('flex items-center justify-between gap-3 rounded-lg bg-secondary p-3')}>
        <div>
          <p className="text-sm text-muted-foreground">Código de inscrição</p>
          <p className="font-mono text-lg font-bold tracking-wider text-primary">{turma.codigo}</p>
        </div>
        {turma.codigo ? <CopiarCodigo codigo={turma.codigo} /> : null}
      </div>
    </CardBase>
  );
}
