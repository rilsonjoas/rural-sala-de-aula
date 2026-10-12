import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MENSAGEM_PADRAO } from '@/lib/api-error';
import { messages as copy } from '@/i18n/messages';

export function ErrorState({ mensagem = MENSAGEM_PADRAO, onRetry }: { mensagem?: string; onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 rounded-xl border border-destructive/30 bg-danger-tint px-6 py-10 text-center"
    >
      <AlertTriangle aria-hidden="true" className="size-6 text-destructive" />
      <p className="max-w-sm text-destructive">{mensagem}</p>
      <Button variant="outline" onClick={onRetry}>
        {copy.tryAgain}
      </Button>
    </div>
  );
}
