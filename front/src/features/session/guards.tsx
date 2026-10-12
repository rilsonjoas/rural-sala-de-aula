import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ErrorState } from '@/components/error-state';
import { PageSkeleton } from '@/components/page-skeleton';
import { messages as copy } from '@/i18n/messages';
import { useSession, type Usuario } from './use-session';

export function RequireAuth() {
  const { usuario, isLoading, isError, recarregar } = useSession();
  const location = useLocation();

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState mensagem={copy.loadError} onRetry={recarregar} />;
  if (!usuario) return <Navigate to="/entrar" replace state={{ de: location.pathname }} />;
  return <Outlet />;
}

export function RequireRole({ papel }: { papel: Usuario['papel'] }) {
  const { usuario, isLoading } = useSession();

  if (isLoading) return <PageSkeleton />;
  if (usuario?.papel !== papel) return <Navigate to="/turmas" replace />;
  return <Outlet />;
}

export function PublicOnly() {
  const { usuario, isLoading, isError, recarregar } = useSession();
  const destino = (useLocation().state as { de?: string } | null)?.de ?? '/turmas';

  if (isLoading) return <PageSkeleton />;
  if (isError) return <ErrorState mensagem={copy.loadError} onRetry={recarregar} />;
  if (usuario) return <Navigate to={destino} replace />;
  return <Outlet />;
}
