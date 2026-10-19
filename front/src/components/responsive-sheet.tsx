import { useEffect, useRef, type ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useMediaQuery } from '@/lib/use-media-query';

type Props = {
  open: boolean;
  onOpenChange: (aberto: boolean) => void;
  titulo: string;
  descricao?: string;
  children: ReactNode;
};

/**
 * O botão Voltar do navegador (e do celular) fecha a folha em vez de sair da tela: ao abrir, empurra uma
 * entrada no histórico com a mesma URL; Voltar a consome e fecha. Se a folha fecha por outro caminho
 * (X, Esc, enviar), a entrada é desfeita, a não ser que a pessoa já tenha navegado para outro lugar.
 */
function useVoltarFechaFolha(open: boolean, onOpenChange: (aberto: boolean) => void) {
  const fechar = useRef(onOpenChange);
  fechar.current = onOpenChange;

  useEffect(() => {
    if (!open) return;
    window.history.pushState({ ...window.history.state, folha: true }, '');
    let consumida = false;
    const aoVoltar = () => {
      consumida = true;
      fechar.current(false);
    };
    window.addEventListener('popstate', aoVoltar);
    return () => {
      window.removeEventListener('popstate', aoVoltar);
      if (!consumida && window.history.state?.folha) window.history.back();
    };
  }, [open]);
}

/** Folha vinda de baixo no mobile (< 1024 px) e modal centrado no desktop. */
export function ResponsiveSheet({ open, onOpenChange, titulo, descricao, children }: Props) {
  const desktop = useMediaQuery('(min-width: 1024px)');
  useVoltarFechaFolha(open, onOpenChange);

  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent data-variante="modal" className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{titulo}</DialogTitle>
            {descricao ? <DialogDescription>{descricao}</DialogDescription> : null}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        data-variante="folha"
        className="max-h-[92dvh] overflow-y-auto rounded-t-2xl pt-2 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
      >
        <div className="mx-auto mb-1 mt-1 h-1.5 w-12 rounded-full bg-muted-foreground/30 shrink-0" aria-hidden="true" />
        <SheetHeader className="px-4 py-2">
          <SheetTitle className="text-lg font-bold sm:text-xl">{titulo}</SheetTitle>
          {descricao ? <SheetDescription className="text-xs sm:text-sm">{descricao}</SheetDescription> : null}
        </SheetHeader>
        <div className="px-4 pb-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
