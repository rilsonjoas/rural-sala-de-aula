import { Outlet } from 'react-router-dom';

/** Telas sem sessão (Entrar / Criar conta): sem cabeçalho nem navegação. */
export function PublicLayout() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8 text-foreground">
      <div className="w-full max-w-md">
        <Outlet />
      </div>
    </main>
  );
}
