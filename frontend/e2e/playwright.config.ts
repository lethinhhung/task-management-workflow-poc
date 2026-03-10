import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  webServer: [
    {
      command: 'npm run start:dev',
      cwd: '../../backend',
      port: 3000,
      reuseExistingServer: true,
    },
    {
      command: 'npm run dev',
      cwd: '..',
      port: 5173,
      reuseExistingServer: true,
    },
  ],
});
