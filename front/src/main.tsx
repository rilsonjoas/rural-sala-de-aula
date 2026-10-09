import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import App from './App';
import { queryClient } from './lib/query-client';
import './styles.css';

async function iniciarApiSimulada() {
  if (import.meta.env.VITE_API_MOCK !== 'true') return;
  const { worker } = await import('./mocks/browser');
  const { abrirSessaoDeTeste } = await import('./mocks/db');
  await worker.start({ onUnhandledRequest: 'bypass' });
  const usuarioDeTeste =
    new URLSearchParams(window.location.search).get('mockUser') ?? (import.meta.env.VITE_API_MOCK_USER as string | undefined);
  if (usuarioDeTeste) abrirSessaoDeTeste(usuarioDeTeste);
}

async function iniciar() {
  await iniciarApiSimulada();

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
        <Toaster position="top-center" />
      </QueryClientProvider>
    </StrictMode>,
  );
}

void iniciar();
