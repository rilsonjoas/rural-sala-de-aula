import { QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '@/App';
import { createQueryClient } from '@/lib/query-client';

export function renderApp(caminho = '/') {
  return render(
    <QueryClientProvider client={createQueryClient({ semEspera: true })}>
      <MemoryRouter initialEntries={[caminho]}>
        <App />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
