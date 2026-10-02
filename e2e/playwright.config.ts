import { defineConfig, devices } from '@playwright/test';

/**
 * Tests end-to-end de MySchoolMyParents.
 *
 * Apuntan al stack de desarrollo ya levantado; esta suite NO arranca ni para
 * nada por su cuenta (sin `webServer`), para no interferir con el proyecto:
 *
 *   docker compose --env-file .env.dev up -d
 *   cd e2e && npm test
 *
 * Contra otro entorno: E2E_BASE_URL=https://… npm test
 */
export default defineConfig({
  testDir: './tests',
  // Comparten la misma base de datos y el mismo cubo de rate limit, así que
  // se ejecutan en serie: es una suite pequeña y la determinación importa
  // más que los segundos que se ahorrarían.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }], ['github']]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:6060',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
