import { ArrowRight, ChevronRight, ClipboardCheck } from 'lucide-react';
import { useId } from 'react';
import { Link } from 'react-router-dom';
import { PrazoBadge, StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { useEntregas } from '@/features/entregas/api';
import { formatData, formatDataHora } from '@/lib/format';
import { alunoComPressa, urgenciaDoPrazo } from '@/lib/urgencia';
import { apoioAoEstado } from './apoio';
import { ROTULO_TIPO, type Atividade } from './filtros';

const ACAO_DO_ALUNO: Record<NonNullable<Atividade['estado']>, { rotulo: string; primaria: boolean }> = {
  PENDENTE: { rotulo: 'Enviar entrega', primaria: true },
  ATRASADA: { rotulo: 'Enviar entrega', primaria: true },
  ENTREGUE: { rotulo: 'Ver detalhes', primaria: false },
  ENTREGUE_COM_ATRASO: { rotulo: 'Ver envio', primaria: false },
  CONCLUIDA: { rotulo: 'Ver nota e comentário', primaria: false },
};

const chipNeutro = 'inline-flex min-h-5 sm:min-h-6 items-center rounded-full bg-secondary px-2 sm:px-2.5 text-[11px] sm:text-xs font-medium text-primary';

/**
 * Professor: quantas entregas ainda esperam nota. Usa a mesma consulta da tela de entregas
 * (GET /atividades/{id}/entregas), então abrir a tela depois não faz outra requisição.
 */
function ContadorAAvaliar({ atividadeId }: { atividadeId: string }) {
  const entregas = useEntregas(atividadeId);
  const aAvaliar = entregas.data?.filter((e) => e.nota == null).length ?? 0;
  if (aAvaliar === 0) return null;
  return (
    <span className="inline-flex min-h-5 sm:min-h-6 items-center gap-1 sm:gap-1.5 rounded-full border border-primary bg-card px-2 sm:px-2.5 text-[11px] sm:text-xs font-semibold text-primary">
      <ClipboardCheck aria-hidden="true" className="size-3.5" />
      {`${aAvaliar} a avaliar`}
    </span>
  );
}

type Props = {
  atividade: Atividade;
  /** turma-aluno: card inteiro é link; turma-professor: botão Ver entregas; minhas: turma + ação por estado. */
  variante: 'turma-aluno' | 'turma-professor' | 'minhas';
  /** Nível do título (h3 sob o título da página; h4 quando há um subtítulo h3 antes). */
  nivelTitulo?: 3 | 4;
};

export function AtividadeCard({ atividade, variante, nivelTitulo = 3 }: Props) {
  const Titulo = `h${nivelTitulo}` as 'h3' | 'h4';
  const idTitulo = useId();
  const apoio = apoioAoEstado(atividade);
  const comPressa = alunoComPressa(atividade);
  const atrasada = atividade.estado === 'ATRASADA';
  const aindaIndisponivel = new Date(atividade.disponivelEm).getTime() > Date.now();
  const urlDetalhe = `/atividades/${atividade.id}`;

  const titulo =
    variante === 'turma-aluno' ? (
      <Link to={urlDetalhe} className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:rounded-xl">
        {atividade.nome}
      </Link>
    ) : (
      atividade.nome
    );

  return (
    <article
      aria-labelledby={idTitulo}
      className={`relative space-y-2.5 sm:space-y-3 rounded-xl border border-border bg-card p-3.5 sm:p-4 transition-shadow hover:shadow-xs ${comPressa ? 'border-l-4 border-l-highlight' : atrasada ? 'border-l-4 border-l-destructive' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {variante === 'minhas' ? <span className={chipNeutro}>{atividade.turmaNome}</span> : null}
          <span className={chipNeutro}>{ROTULO_TIPO[atividade.tipo]}</span>
          {aindaIndisponivel ? (
            <span className={chipNeutro}>A partir de {formatData(atividade.disponivelEm)}</span>
          ) : null}
        </div>
        {atividade.estado ? (
          <div className="shrink-0">
            <StatusBadge estado={atividade.estado} nota={atividade.nota} urgente={comPressa} />
          </div>
        ) : variante === 'turma-professor' ? (
          <div className="shrink-0 flex flex-wrap items-center justify-end gap-1.5 sm:gap-2">
            <ContadorAAvaliar atividadeId={atividade.id} />
            <PrazoBadge urgencia={urgenciaDoPrazo(atividade.prazoFinal)} />
          </div>
        ) : null}
      </div>

      <Titulo id={idTitulo} className="text-base sm:text-lg font-semibold text-primary leading-snug">
        {titulo}
      </Titulo>

      <div className="space-y-0.5 text-xs sm:text-sm">
        <p className="text-foreground">{`Prazo final: ${formatDataHora(atividade.prazoFinal)}`}</p>
        {apoio ? (
          <p className={comPressa || atrasada ? 'font-semibold text-primary' : 'text-muted-foreground'}>{apoio}</p>
        ) : null}
      </div>

      {variante === 'turma-aluno' ? (
        <ChevronRight aria-hidden="true" className="absolute right-3.5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
      ) : null}

      {variante === 'turma-professor' ? (
        <Button asChild variant="outline" className="w-full min-h-9 sm:min-h-10 text-xs sm:text-sm">
          <Link to={`${urlDetalhe}/entregas`}>Ver entregas</Link>
        </Button>
      ) : null}

      {variante === 'minhas' && atividade.estado ? (
        <Button asChild variant={ACAO_DO_ALUNO[atividade.estado].primaria ? 'default' : 'secondary'} className="w-full sm:w-auto min-h-9 sm:min-h-10 text-xs sm:text-sm">
          <Link to={urlDetalhe}>
            {ACAO_DO_ALUNO[atividade.estado].rotulo}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </Button>
      ) : null}
    </article>
  );
}
