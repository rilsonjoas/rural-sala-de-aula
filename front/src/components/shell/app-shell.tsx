import { Outlet } from 'react-router-dom';
import { useSession } from '@/features/session/use-session';
import { messages as copy } from '@/i18n/messages';
import { Header } from './header';
import { MainNav } from './main-nav';

export function AppShell() {
  const { usuario, logout } = useSession();
  if (!usuario) return null; // as guardas garantem que há usuário; isto só satisfaz o tipo

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:text-primary"
      >
        {copy.skipToContent}
      </a>
      <Header usuario={usuario} onSair={() => void logout()} />
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-7xl">
        <MainNav papel={usuario.papel} />
        <main id="conteudo" tabIndex={-1} className="min-w-0 flex-1 px-4 pb-24 pt-6 lg:px-8 lg:pb-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
