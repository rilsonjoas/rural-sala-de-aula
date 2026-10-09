import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Skeleton } from '@/components/skeleton';
import { useSession, type Usuario } from './use-session';

export function RequireAuth() {
  const { usuario, isLoading } = useSession();
  const location = useLocation();

  if (isLoading) return <Skeleton />;
  if (!usuario) return <Navigate to="/entrar" replace state={{ de: location.pathname }} />;
  return <Outlet />;
}

export function RequireRole({ papel }: { papel: Usuario['papel'] }) {
  const { usuario, isLoading } = useSession();

  if (isLoading) return <Skeleton />;
  if (usuario?.papel !== papel) return <Navigate to="/turmas" replace />;
  return <Outlet />;
}

export function PublicOnly() {
  const { usuario, isLoading } = useSession();

  if (isLoading) return <Skeleton />;
  if (usuario) return <Navigate to="/turmas" replace />;
  return <Outlet />;
}
