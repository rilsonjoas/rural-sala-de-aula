import type { ReactNode } from 'react';

/** Estado vazio que ensina: a mensagem diz o que fazer e a ação (se houver) já está à mão. */
export function EmptyState({ mensagem, acao }: { mensagem: string; acao?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-card px-6 py-10 text-center">
      <p className="max-w-sm text-muted-foreground">{mensagem}</p>
      {acao}
    </div>
  );
}
