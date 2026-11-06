import { Bell } from 'lucide-react';
import { useState } from 'react';
import { ResponsiveSheet } from '@/components/responsive-sheet';
import { useNotificacoes } from './api';
import { ListaNotificacoes } from './lista-notificacoes';

export function Sino() {
  const [aberto, setAberto] = useState(false);
  const naoLidas = useNotificacoes().data?.naoLidas ?? 0;
  const rotulo = naoLidas > 0 ? `Notificações, ${naoLidas} não lidas` : 'Notificações';

  return (
    <>
      <button
        type="button"
        aria-label={rotulo}
        onClick={() => setAberto(true)}
        className="relative flex size-11 items-center justify-center rounded-full text-primary hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <Bell aria-hidden="true" className="size-5" />
        <span aria-live="polite">
          {naoLidas > 0 ? (
            <span
              aria-hidden="true"
              className="absolute right-0.5 top-0.5 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-bold leading-5 text-primary-foreground"
            >
              {naoLidas > 9 ? '9+' : naoLidas}
            </span>
          ) : null}
        </span>
      </button>
      <ResponsiveSheet open={aberto} onOpenChange={setAberto} titulo="Notificações">
        <ListaNotificacoes aoNavegar={() => setAberto(false)} />
      </ResponsiveSheet>
    </>
  );
}
