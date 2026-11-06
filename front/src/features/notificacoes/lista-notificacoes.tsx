import { useNavigate } from 'react-router-dom';
import { ErrorState } from '@/components/error-state';
import { Button } from '@/components/ui/button';
import { formatHa } from '@/lib/format';
import { cn } from '@/lib/utils';
import { destinoDaNotificacao } from './destino';
import { useMarcarLida, useMarcarTodasLidas, useNotificacoes, type Notificacao } from './api';

export function ListaNotificacoes({ aoNavegar }: { aoNavegar: () => void }) {
  const notificacoes = useNotificacoes();
  const marcarLida = useMarcarLida();
  const marcarTodas = useMarcarTodasLidas();
  const navigate = useNavigate();

  async function abrir(n: Notificacao) {
    if (!n.lida) {
      try {
        await marcarLida.mutateAsync(n.id);
      } catch {
        // não impede a pessoa de chegar ao destino
      }
    }
    aoNavegar();
    navigate(destinoDaNotificacao(n));
  }

  if (notificacoes.isPending) {
    return <div role="status" aria-label="Carregando notificações" className="h-24 animate-pulse rounded-lg bg-secondary" />;
  }
  if (notificacoes.isError) {
    return <ErrorState mensagem="Não conseguimos carregar as notificações." onRetry={() => void notificacoes.refetch()} />;
  }

  const { naoLidas, itens, prazosProximos } = notificacoes.data;

  return (
    <div className="space-y-5">
      <section aria-label="Notificações recentes" className="space-y-2">
        {naoLidas > 0 ? (
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => marcarTodas.mutate()} disabled={marcarTodas.isPending}>
              Marcar todas como lidas
            </Button>
          </div>
        ) : null}
        {itens.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            Nenhuma notificação por enquanto.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {itens.map((n) => (
              <li key={n.id}>
                <ItemDaLista notificacao={n} aoAbrir={() => void abrir(n)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {prazosProximos.length > 0 ? (
        <section aria-labelledby="titulo-prazos-proximos" className="space-y-2">
          <h3 id="titulo-prazos-proximos" className="text-sm font-semibold text-primary">
            Prazos próximos
          </h3>
          <ul className="space-y-1.5">
            {prazosProximos.map((n) => (
              <li key={n.id}>
                <ItemDaLista notificacao={n} aoAbrir={() => void abrir(n)} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function ItemDaLista({ notificacao: n, aoAbrir }: { notificacao: Notificacao; aoAbrir: () => void }) {
  const prazo = n.tipo === 'PRAZO_PROXIMO';
  return (
    <button
      type="button"
      onClick={aoAbrir}
      className={cn(
        'flex w-full min-h-11 items-start gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        !n.lida && 'bg-secondary/60',
      )}
    >
      <span aria-hidden="true" className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.lida ? 'bg-transparent' : 'bg-primary')} />
      <span className="min-w-0 flex-1">
        <span className="block text-sm text-foreground">{n.texto}</span>
        {prazo ? null : <span className="block text-xs text-muted-foreground">{formatHa(n.criadaEm)}</span>}
      </span>
      {n.lida ? null : <span className="sr-only">Não lida</span>}
    </button>
  );
}
