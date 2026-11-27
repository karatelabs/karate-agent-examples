import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: process.env.POLICY_API_URL ?? 'http://localhost:8080',
    extraHTTPHeaders: { Accept: 'application/json' },
  },
});
