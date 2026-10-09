import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { messages as copy } from './i18n/messages';
import { PlaceholderPage } from './pages/PlaceholderPage';

export default function App() {
  return (
    <div className="app-shell">
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
          <Route
            path="/turmas"
            element={<PlaceholderPage title={copy.classes} description={copy.classesDescription} />}
          />
          <Route
            path="/atividades"
            element={<PlaceholderPage title={copy.activities} description={copy.activitiesDescription} />}
          />
          <Route
            path="/entrar"
            element={<PlaceholderPage title={copy.signIn} description={copy.signInDescription} />}
          />
          <Route path="*" element={<Navigate to="/turmas" replace />} />
        </Routes>
      </main>
    </div>
  );
}
