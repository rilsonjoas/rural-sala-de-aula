import { ErrorState } from '@/components/error-state';
import { ComentariosThread } from './comentarios-thread';
import { useComentariosAtividade, useCriarComentarioAtividade } from './api';

export function ComentariosAtividade({ atividadeId }: { atividadeId: string }) {
  const comentarios = useComentariosAtividade(atividadeId);
  const criar = useCriarComentarioAtividade(atividadeId);

  return (
    <section aria-labelledby="titulo-comentarios" className="space-y-3 rounded-xl border border-border bg-card p-3.5 sm:p-4">
      <h3 id="titulo-comentarios" className="text-base sm:text-lg font-semibold text-primary">
        Dúvidas e comentários
      </h3>
      {comentarios.isError ? (
        <ErrorState
          mensagem="Não conseguimos carregar os comentários."
          onRetry={() => void comentarios.refetch()}
        />
      ) : comentarios.isPending ? (
        <div role="status" aria-label="Carregando comentários" className="h-16 animate-pulse rounded-lg bg-secondary" />
      ) : (
        <>
          {comentarios.data.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ainda não há comentários.</p>
          ) : null}
          <ComentariosThread
            comentarios={comentarios.data}
            pendente={criar.isPending}
            placeholder="Escreva uma dúvida ou comentário..."
            aoComentar={async (texto) => {
              await criar.mutateAsync({ texto });
            }}
            aoResponder={async (texto, paiId) => {
              await criar.mutateAsync({ texto, comentarioPaiId: paiId });
            }}
          />
        </>
      )}
    </section>
  );
}
