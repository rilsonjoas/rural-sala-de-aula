import { ClipboardList, Users, type LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { messages as copy } from '@/i18n/messages';
import { cn } from '@/lib/utils';
import type { Usuario } from '@/features/session/use-session';

type Item = { para: string; rotulo: string; Icone: LucideIcon };

const TURMAS: Item = { para: '/turmas', rotulo: copy.classes, Icone: Users };
const ATIVIDADES: Item = { para: '/atividades', rotulo: copy.activities, Icone: ClipboardList };

const ITENS: Record<Usuario['papel'], Item[]> = {
  ALUNO: [TURMAS, ATIVIDADES],
  PROFESSOR: [TURMAS],
};

/**
 * Navegação única que se adapta: barra inferior no mobile e menu lateral a partir de 1024 px.
 * O professor tem um só item, então no mobile não há barra (só o cabeçalho).
 */
export function MainNav({ papel }: { papel: Usuario['papel'] }) {
  return (
    <nav
      aria-label={copy.navigationLabel}
      className={cn(
        'fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card',
        'lg:static lg:w-60 lg:shrink-0 lg:border-r lg:border-t-0 lg:pt-4',
        papel === 'PROFESSOR' && 'hidden lg:block',
      )}
    >
      <ul className="flex lg:flex-col lg:gap-1 lg:px-3">
        {ITENS[papel].map(({ para, rotulo, Icone }) => (
          <li key={para} className="flex-1 lg:flex-none">
            <NavLink
              to={para}
              className={({ isActive }) =>
                cn(
                  'flex min-h-14 flex-col items-center justify-center gap-1 border-t-2 text-sm font-medium text-muted-foreground',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                  'lg:min-h-11 lg:flex-row lg:justify-start lg:gap-3 lg:rounded-md lg:border-t-0 lg:px-3',
                  isActive
                    ? 'border-primary font-semibold text-primary lg:bg-secondary'
                    : 'border-transparent hover:text-primary lg:hover:bg-accent',
                )
              }
            >
              <Icone aria-hidden="true" className="size-5" />
              {rotulo}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
