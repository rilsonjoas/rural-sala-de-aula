import { GraduationCap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { messages as copy } from '@/i18n/messages';
import type { Usuario } from '@/features/session/use-session';
import { AvatarMenu } from './avatar-menu';
import { MainNav } from './main-nav';

export function Header({ usuario, onSair }: { usuario: Usuario; onSair: () => void }) {
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-8">
          <h1 className="text-xl font-semibold text-primary">
            <Link
              to="/turmas"
              className="flex items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <GraduationCap aria-hidden="true" className="size-6" />
              {copy.appName}
            </Link>
          </h1>
          <MainNav />
        </div>
        <AvatarMenu usuario={usuario} onSair={onSair} />
      </div>
    </header>
  );
}
