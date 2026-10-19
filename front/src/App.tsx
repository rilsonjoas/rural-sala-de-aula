import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppShell } from './components/shell/app-shell';
import { PublicLayout } from './components/shell/public-layout';
import { PublicOnly, RequireAuth, RequireRole } from './features/session/guards';
import { SessionWatcher } from './features/session/session-watcher';
import { AuthPage } from './features/auth/auth-page';
import { NotFoundPage } from './pages/NotFoundPage';
import { DetalheAtividadePage } from './features/entregas/detalhe-page';
import { EntregasPage } from './features/entregas/entregas-page';
import { MinhasAtividadesPage } from './features/atividades/minhas-page';
import { TurmaPage } from './features/atividades/turma-page';
import { TurmasPage } from './features/turmas/turmas-page';

export default function App() {
  return (
    <>
      <SessionWatcher />
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<Navigate to="/turmas" replace />} />

        <Route element={<PublicOnly />}>
          <Route element={<PublicLayout />}>
            <Route path="/entrar" element={<AuthPage />} />
          </Route>
        </Route>

        <Route element={<RequireAuth />}>
          <Route element={<AppShell />}>
            <Route path="/turmas" element={<TurmasPage />} />
            <Route path="/turmas/:turmaId" element={<TurmaPage />} />

            <Route path="/atividades" element={<MinhasAtividadesPage />} />
            <Route path="/atividades/:atividadeId" element={<DetalheAtividadePage />} />
            <Route path="/atividades/:atividadeId/entregas" element={<EntregasPage />} />

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}
