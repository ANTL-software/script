import { defineConfig, devices } from '@playwright/test';

const browserPort = Number.parseInt(process.env.SCRIPT_BROWSER_PORT ?? '5173', 10);
const browserBaseUrl = `http://127.0.0.1:${browserPort}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: browserBaseUrl,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: `npm run dev -- --host 127.0.0.1 --port ${browserPort}`,
    url: browserBaseUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
