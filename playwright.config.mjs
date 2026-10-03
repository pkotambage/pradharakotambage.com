import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './scripts/browser-tests',
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:8765', browserName: 'chromium' },
  webServer: {
    command: 'python3 -m http.server 8765 --bind 127.0.0.1',
    url: 'http://127.0.0.1:8765/legal-guides/all/',
    reuseExistingServer: false,
    timeout: 15000,
    stdout: 'ignore',
    stderr: 'ignore'
  }
});
