import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.e2e.ts',
  timeout: 45_000,
  fullyParallel: false,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5193/2026-UIABD3-lecture/',
    channel: 'chrome',
    headless: true,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5193 --strictPort',
    url: 'http://127.0.0.1:5193/2026-UIABD3-lecture/',
    reuseExistingServer: false,
    timeout: 120_000,
  },
})

