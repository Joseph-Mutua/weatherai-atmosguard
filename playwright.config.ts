import 'dotenv/config';
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  ...(process.env.CI ? { retries: 1, workers: 1 } : { retries: 0 }),
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['json', { outputFile: 'test-results/results.json' }],
  ],
  use: {
    baseURL: process.env.WEATHER_AI_BASE_URL ?? 'https://api.weather-ai.co',
    extraHTTPHeaders: { Accept: 'application/json' },
  },
});
