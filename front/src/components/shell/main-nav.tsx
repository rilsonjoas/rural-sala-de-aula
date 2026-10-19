import { ClipboardList, Users, type LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { messages as copy } from '@/i18n/messages';
import { cn } from '@/lib/utils';

type Item = { para: string; rotulo: string; Icone: LucideIcon };

const TURMAS: Item = { para: '/turmas', rotulo: copy.classes, Icone: Users };
const ATIVIDADES: Item = { para: '/atividades', rotulo: copy.activities, Icone: ClipboardList };

const ITENS: Item[] = [TURMAS, ATIVIDADES];

/**
 * Navegação única que se adapta: barra inferior no mobile e links no cabeçalho a partir de 1024 px.
 */
export function MainNav() {
  return (
    <nav
      aria-label={copy.navigationLabel}
      className={cn(
        'fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] shadow-xs',
        'lg:static lg:inset-auto lg:border-t-0 lg:bg-transparent lg:pb-0 lg:shadow-none',
      )}
    >
      <ul className="flex lg:flex-row lg:gap-1">
        {ITENS.map(({ para, rotulo, Icone }) => (
          <li key={para} className="flex-1 lg:flex-none">
            <NavLink
              to={para}
              className={({ isActive }) =>
                cn(
                  'flex min-h-13 py-1.5 flex-col items-center justify-center gap-1 border-t-2 text-xs sm:text-sm font-medium text-muted-foreground transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                  'lg:min-h-11 lg:flex-row lg:justify-start lg:gap-2 lg:rounded-md lg:border-t-0 lg:px-4 lg:py-2',
                  isActive
                    ? 'border-primary font-semibold text-primary lg:bg-secondary'
                    : 'border-transparent hover:text-primary lg:hover:bg-accent',
                )
              }
            >
              <Icone aria-hidden="true" className="size-4.5 sm:size-5" />
              {rotulo}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
