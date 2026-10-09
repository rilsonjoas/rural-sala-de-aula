import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { PublicOnly, RequireAuth, RequireRole } from './features/session/guards';
import { SessionWatcher } from './features/session/session-watcher';
import { messages as copy } from './i18n/messages';
import { EntrarPage } from './pages/EntrarPage';
import { PlaceholderPage } from './pages/PlaceholderPage';

export default function App() {
  return (
    <div className="app-shell">
      <SessionWatcher />
      <header className="app-header">
        <h1>{copy.appName}</h1>
      </header>

      <nav className="app-nav" aria-label={copy.navigationLabel}>
        <NavLink to="/turmas">{copy.classes}</NavLink>
        <NavLink to="/atividades">{copy.activities}</NavLink>
        <NavLink to="/entrar">{copy.signIn}</NavLink>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/turmas" replace />} />

          <Route element={<PublicOnly />}>
            <Route path="/entrar" element={<EntrarPage />} />
          </Route>

          <Route element={<RequireAuth />}>
            <Route path="/turmas" element={<PlaceholderPage title={copy.classes} description={copy.classesDescription} />} />
            <Route
              path="/turmas/:turmaId"
              element={<PlaceholderPage title={copy.classDetail} description={copy.classDetailDescription} />}
            />

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
          </Route>

          <Route path="*" element={<Navigate to="/turmas" replace />} />
        </Routes>
      </main>
    </div>
  );
}
