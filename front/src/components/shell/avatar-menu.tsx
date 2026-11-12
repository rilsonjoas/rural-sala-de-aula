import { LogOut, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { messages as copy } from '@/i18n/messages';
import { iniciais } from '@/lib/format';
import { ExcluirConta } from '@/features/session/excluir-conta';
import type { Usuario } from '@/features/session/use-session';

export function AvatarMenu({ usuario, onSair }: { usuario: Usuario; onSair: () => void }) {
  const [excluindo, setExcluindo] = useState(false);
  return (
    <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={copy.accountMenu}
          className="flex size-11 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {iniciais(usuario.nome)}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="font-normal">
          <span className="block font-semibold text-foreground">{usuario.nome}</span>
          <span className="block text-sm text-muted-foreground">{usuario.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onSair} className="min-h-11">
          <LogOut aria-hidden="true" />
          {copy.signOut}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setExcluindo(true)} className="min-h-11 text-destructive">
          <Trash2 aria-hidden="true" />
          Excluir minha conta
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <ExcluirConta aberto={excluindo} aoMudar={setExcluindo} />
    </>
  );
}
