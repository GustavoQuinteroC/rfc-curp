import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  use: { baseURL: 'http://127.0.0.1:4179/', acceptDownloads: true },
  webServer: {
    command: 'npm run sitio && python3 -m http.server 4179 --bind 127.0.0.1 --directory dist',
    url: 'http://127.0.0.1:4179/',
    reuseExistingServer: false,
  },
});
