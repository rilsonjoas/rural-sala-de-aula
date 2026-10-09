import type { ReactNode } from 'react';
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

/** Folha vinda de baixo no mobile (< 1024 px) e modal centrado no desktop. */
export function ResponsiveSheet({ open, onOpenChange, titulo, descricao, children }: Props) {
  const desktop = useMediaQuery('(min-width: 1024px)');

  if (desktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent data-variante="modal" aria-describedby={descricao ? undefined : undefined}>
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
        className="max-h-[92dvh] overflow-y-auto rounded-t-xl"
      >
        <SheetHeader>
          <SheetTitle>{titulo}</SheetTitle>
          {descricao ? <SheetDescription>{descricao}</SheetDescription> : null}
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}
