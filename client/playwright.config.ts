import { defineConfig, devices } from '@playwright/test'

const CLIENT_URL = 'http://localhost:5173'
const SERVER_HEALTH_URL = 'http://localhost:3001/api/health'
const isCI = Boolean(process.env.CI)

/**
 * Pruebas E2E: levantan el servidor y el cliente reales y los recorren con un navegador.
 * Cada prueba corre en su propio contexto de navegador, con su propio localStorage,
 * así que pueden ejecutarse en paralelo sin compartir usuarios ni sesiones.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  // En CI, un `test.only` olvidado haría pasar la suite ejecutando una sola prueba.
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: isCI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: CLIENT_URL,
    locale: 'es-MX',
    timezoneId: 'America/Mexico_City',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'pnpm --filter @snailbet/server dev',
      url: SERVER_HEALTH_URL,
      // Todas las peticiones llegan desde la misma IP por el proxy de Vite; con el límite
      // normal (20 cobros por minuto) la suite completa lo alcanzaría.
      env: { PAYMENT_RATE_LIMIT_PER_MINUTE: '1000' },
      // En local se reutiliza un servidor ya levantado. Ojo: entonces no aplica `env`.
      reuseExistingServer: !isCI,
      timeout: 60_000,
    },
    {
      command: 'pnpm --filter @snailbet/client dev',
      url: CLIENT_URL,
      reuseExistingServer: !isCI,
      timeout: 60_000,
    },
  ],
})
