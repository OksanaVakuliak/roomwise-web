import { defineConfig, devices } from '@playwright/test';

const port = 3001;
const baseURL = `http://localhost:${port}`;
const reports = 'e2e/.reports';
const phone = { width: 390, height: 844 };

export default defineConfig({
  testDir: 'e2e',
  outputDir: `${reports}/results`,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: `${reports}/html`, open: 'never' }],
  ],
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'en',
      use: { ...devices['Desktop Chrome'], viewport: phone, locale: 'en-US' },
    },
    {
      name: 'uk',
      use: { ...devices['Desktop Chrome'], viewport: phone, locale: 'uk-UA' },
    },
  ],
  webServer: {
    command: 'pnpm --filter web run dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { API_ORIGIN: process.env.API_ORIGIN ?? 'http://localhost:4000' },
  },
});
