// Playwright configuration for CRM functional tests.
//
// The app is a single-file static HTML at ../index.html. We serve the repo
// root via Python's built-in HTTP server so relative asset paths resolve
// exactly like on GitHub Pages / any future backend server.

import { defineConfig, devices } from '@playwright/test';

const PORT = process.env.CRM_TEST_PORT || 8123;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,          // tests share localStorage state per session; keep serial
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    viewport: { width: 1400, height: 900 },
    // Auto-accept confirm() dialogs unless a specific test overrides
    // via page.on('dialog', ...). We set it per test.
  },
  webServer: {
    command: `python3 -m http.server ${PORT}`,
    cwd: '..',
    port: Number(PORT),
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'pipe',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Allow the sandbox to point at a pre-installed Chromium instead of
        // downloading one. Playwright will honor PLAYWRIGHT_BROWSERS_PATH
        // or an explicit executablePath override via CRM_TEST_CHROMIUM env.
        ...(process.env.CRM_TEST_CHROMIUM ? { launchOptions: { executablePath: process.env.CRM_TEST_CHROMIUM } } : {}),
      },
    },
  ],
});
