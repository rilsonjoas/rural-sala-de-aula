import { messages as copy } from '@/i18n/messages';

/** Esqueleto de página inteira enquanto a sessão é conferida. */
export function PageSkeleton() {
  return (
    <div role="status" aria-label={copy.loading} aria-busy="true" className="animate-pulse space-y-4 py-6">
      <div className="h-8 w-1/3 rounded-md bg-secondary" />
      <div className="h-24 rounded-xl bg-secondary" />
      <div className="h-24 rounded-xl bg-secondary" />
    </div>
  );
}
