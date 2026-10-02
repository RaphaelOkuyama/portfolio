import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  fullyParallel: false,
  // Cada worker renderiza WebGL em software: com 8 em paralelo as animações atrasam e os testes de
  // navegação estouram o tempo. 4 deixa a suíte estável sem ficar lenta
  workers: process.env.CI ? 2 : 4,
  // O site abre no idioma do navegador: a suíte roda em português
  use: { baseURL: 'http://localhost:3100', locale: 'pt-BR' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build && npm run start -- -p 3100',
    url: 'http://localhost:3100',
    reuseExistingServer: !process.env.CI,
    timeout: 240_000,
  },
});
