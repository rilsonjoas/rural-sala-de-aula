import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppShell } from './components/shell/app-shell';
import { PublicLayout } from './components/shell/public-layout';
import { PublicOnly, RequireAuth, RequireRole } from './features/session/guards';
import { SessionWatcher } from './features/session/session-watcher';
import { messages as copy } from './i18n/messages';
import { AuthPage } from './features/auth/auth-page';
import { NotFoundPage } from './pages/NotFoundPage';
import { TurmaPage } from './features/atividades/turma-page';
import { TurmasPage } from './features/turmas/turmas-page';
import { PlaceholderPage } from './pages/PlaceholderPage';

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

            <Route element={<RequireRole papel="ALUNO" />}>
              <Route
                path="/atividades"
                element={<PlaceholderPage title={copy.activities} description={copy.activitiesDescription} />}
              />
              <Route
                path="/atividades/:atividadeId"
                element={<PlaceholderPage title={copy.activityDetail} description={copy.activityDetailDescription} />}
              />
            </Route>

            <Route element={<RequireRole papel="PROFESSOR" />}>
              <Route
                path="/atividades/:atividadeId/entregas"
                element={<PlaceholderPage title={copy.deliveries} description={copy.deliveriesDescription} />}
              />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}
