import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { PrazoBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { useAtividade } from '@/features/atividades/api';
import { ApiError } from '@/lib/api-error';
import { formatDataHora, plural } from '@/lib/format';
import { urgenciaDoPrazo } from '@/lib/urgencia';
import { usePageTitle } from '@/lib/use-page-title';
import { useMediaQuery } from '@/lib/use-media-query';
import { useEntregas, type Entrega } from './api';
import { AvaliarSheet } from './avaliar-sheet';
import { EntregasLista } from './entregas-lista';
import { EntregasTabela } from './entregas-tabela';

function Esqueleto() {
  return (
    <div role="status" aria-label="Carregando" aria-busy="true" className="animate-pulse space-y-3">
      {[1, 2, 3].map((n) => (
        <div key={n} className="h-40 rounded-xl border border-border bg-secondary" />
      ))}
    </div>
  );
}

export function EntregasPage() {
  const { atividadeId = '' } = useParams();
  const atividade = useAtividade(atividadeId);
  const entregas = useEntregas(atividadeId);
  usePageTitle(atividade.data ? `Entregas · ${atividade.data.nome}` : 'Entregas');
  const desktop = useMediaQuery('(min-width: 1024px)');
  const [avaliando, setAvaliando] = useState<Entrega | null>(null);

  if (atividade.isError && atividade.error instanceof ApiError && [403, 404].includes(atividade.error.status)) {
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

  const lista = entregas.data ?? [];
  const comAtraso = lista.filter((e) => e.atrasada).length;
  const avaliadas = lista.filter((e) => e.nota != null).length;

  return (
    <section aria-labelledby="titulo-pagina" className="space-y-5">
      <Link
        to={atividade.data ? `/turmas/${atividade.data.turmaId}` : '/turmas'}
        className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Atividades
      </Link>

      <div className="space-y-2 rounded-xl border border-border bg-card p-4">
        <h2 id="titulo-pagina" className="text-2xl font-bold text-primary">
          {atividade.data?.nome ?? 'Entregas da atividade'}
        </h2>
        {atividade.data ? <p className="text-muted-foreground">{atividade.data.turmaNome}</p> : null}
        {atividade.data ? (
          <p className="flex flex-wrap items-center gap-2 text-sm text-foreground">
            {`Prazo final: ${formatDataHora(atividade.data.prazoFinal)}`}
            <PrazoBadge urgencia={urgenciaDoPrazo(atividade.data.prazoFinal)} />
          </p>
        ) : null}
        {entregas.isSuccess ? (
          <p className="text-sm font-semibold text-primary">{`${plural(lista.length, 'entrega')} · ${comAtraso} com atraso · ${plural(avaliadas, 'avaliada')}`}</p>
        ) : null}
      </div>

      {entregas.isPending ? <Esqueleto /> : null}
      {entregas.isError ? (
        <ErrorState
          mensagem="Não conseguimos carregar as entregas. Verifique a conexão e tente de novo."
          onRetry={() => void entregas.refetch()}
        />
      ) : null}
      {entregas.isSuccess && lista.length === 0 ? <EmptyState mensagem="Nenhum aluno entregou ainda." /> : null}
      {entregas.isSuccess && lista.length > 0 ? (
        desktop ? (
          <EntregasTabela entregas={lista} onAvaliar={setAvaliando} />
        ) : (
          <EntregasLista entregas={lista} onAvaliar={setAvaliando} />
        )
      ) : null}

      <AvaliarSheet entrega={avaliando} onOpenChange={(aberto) => !aberto && setAvaliando(null)} />
    </section>
  );
}
