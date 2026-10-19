import { ArrowLeft, GraduationCap } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { StatusBadge } from '@/components/status-badge';
import { alunoComPressa } from '@/lib/urgencia';
import { Button } from '@/components/ui/button';
import { useAtividade } from '@/features/atividades/api';
import { ROTULO_TIPO } from '@/features/atividades/filtros';
import { ApiError } from '@/lib/api-error';
import { formatDataHora } from '@/lib/format';
import { usePageTitle } from '@/lib/use-page-title';
import { SuaEntrega } from './sua-entrega';

const chip = 'inline-flex min-h-6 items-center rounded-full bg-secondary px-2.5 text-xs font-semibold text-primary';

function Esqueleto() {
  return (
    <div role="status" aria-label="Carregando" aria-busy="true" className="animate-pulse space-y-3">
      <div className="h-40 rounded-xl border border-border bg-secondary" />
      <div className="h-40 rounded-xl border border-border bg-secondary" />
    </div>
  );
}

export function DetalheAtividadePage() {
  const { atividadeId = '' } = useParams();
  const atividade = useAtividade(atividadeId);
  usePageTitle(atividade.data?.nome);

  if (atividade.isPending) return <Esqueleto />;

  if (atividade.isError) {
    if (atividade.error instanceof ApiError && [403, 404].includes(atividade.error.status)) {
      return (
        <EmptyState
          mensagem="Atividade não encontrada."
          acao={
            <Button asChild>
              <Link to="/turmas">Voltar para Turmas</Link>
            </Button>
          }
        />
      );
    }
    return <ErrorState mensagem="Não conseguimos carregar a atividade. Verifique a conexão e tente de novo." onRetry={() => void atividade.refetch()} />;
  }

  const a = atividade.data;
  const atrasada = a.estado === 'ATRASADA';

  return (
    <section aria-labelledby="titulo-pagina" className="mx-auto max-w-3xl space-y-4">
      <Link to="/atividades" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary">
        <ArrowLeft aria-hidden="true" className="size-4" />
        Atividades
      </Link>

      <div className="space-y-3 rounded-xl border border-border bg-card p-3.5 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className={chip}>{ROTULO_TIPO[a.tipo]}</span>
          {a.estado ? (
            <span className="ml-auto">
              <StatusBadge estado={a.estado} nota={a.nota} urgente={alunoComPressa(a)} />
            </span>
          ) : null}
        </div>
        <h2 id="titulo-pagina" className="text-xl sm:text-2xl font-bold text-primary leading-snug">
          {a.nome}
        </h2>
        <p className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
          <GraduationCap aria-hidden="true" className="size-4 shrink-0" />
          <span>{`${a.turmaNome} · Prof. ${a.professorNome}`}</span>
        </p>
      </div>

      {atrasada ? (
        a.aceitaAtraso === false ? (
          <p className="rounded-xl border border-destructive/40 bg-danger-tint p-3.5 sm:p-4 text-xs sm:text-sm text-destructive">
            O prazo final encerrou e esta atividade não permite envios com atraso.
          </p>
        ) : (
          <p className="rounded-xl border border-destructive/40 bg-danger-tint p-3.5 sm:p-4 text-xs sm:text-sm text-destructive">
            O prazo final passou. Você ainda pode enviar, mas a entrega será marcada com atraso.
          </p>
        )
      ) : null}

      <div className="space-y-2 rounded-xl border border-border bg-card p-3.5 sm:p-4">
        <h3 className="text-base sm:text-lg font-semibold text-primary">Prazo</h3>
        <p className="text-sm sm:text-base">{`Prazo final: ${formatDataHora(a.prazoFinal)}`}</p>
        <p className="text-xs sm:text-sm text-muted-foreground">
          {a.aceitaAtraso === false ? 'Esta atividade não aceita entregas após o prazo final.' : 'Envios após o prazo serão marcados com atraso.'}
        </p>
      </div>

      {a.descricao ? (
        <div className="space-y-2 rounded-xl border border-border bg-card p-3.5 sm:p-4">
          <h3 className="text-base sm:text-lg font-semibold text-primary">Descrição</h3>
          <p className="whitespace-pre-line text-sm sm:text-base text-foreground">{a.descricao}</p>
        </div>
      ) : null}

      <SuaEntrega atividade={a} />
    </section>
  );
}
