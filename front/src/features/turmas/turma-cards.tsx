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

function CardBase({ turma, children }: { turma: Turma; children: React.ReactNode }) {
  const idTitulo = useId();
  return (
    <article
      aria-labelledby={idTitulo}
      className="space-y-3 rounded-xl border border-l-4 border-border border-l-primary bg-card p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 id={idTitulo} className="text-xl font-semibold text-primary">
          {turma.nome}
        </h3>
        <span className="shrink-0 rounded-full bg-secondary px-2.5 py-0.5 text-sm font-semibold text-primary">{turma.semestre}</span>
      </div>
      <p className="text-muted-foreground">{turma.disciplina}</p>
      {children}
      <Button asChild variant="secondary" className="w-full">
        <Link to={`/turmas/${turma.id}`}>
          Ver atividades
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
  // Os prazos vêm de GET /atividades, que Minhas atividades já usa (mesma consulta, uma só requisição para todos os cards).
  const minhas = useMinhasAtividades(FILTROS_VAZIOS);
  const comPressa = minhas.data?.filter((a) => a.turmaId === turma.id && alunoComPressa(a)).length ?? 0;
  const pendentesSemPressa = Math.max(0, pendentes - comPressa);

  return (
    <CardBase turma={turma}>
      <Linha icone={Users}>Prof. {turma.professorNome}</Linha>
      <Linha icone={Clock}>{formatDias(turma.diasAula)}</Linha>
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
    <CardBase turma={turma}>
      <Linha icone={Clock}>{formatDias(turma.diasAula)}</Linha>
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
