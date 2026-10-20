import { defineConfig, devices } from '@playwright/test';

// Jornadas contra o stack real (nginx -> API -> Postgres), sem API simulada.
// Local: `docker compose up -d` na raiz e `npm run test:e2e:real`.
// Outro ambiente: E2E_BASE_URL=https://rural-sala-de-aula.narniano.com (cria usuarios descartaveis).
export default defineConfig({
  testDir: './e2e-real',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  timeout: 60_000,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8081',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
