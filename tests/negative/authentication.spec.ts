import { expect, test } from '@playwright/test';

import { nairobi } from '../../src/test-data/locations.js';
import { validateSafeErrorBody } from '../../src/validators/error.validator.js';

const query = {
  lat: nairobi.latitude,
  lon: nairobi.longitude,
  days: 1,
  ai: false,
} as const;

test.describe('Authentication failures @negative @security', () => {
  const scenarios = [
    { name: 'missing Authorization header', headers: {} },
    { name: 'empty Bearer token', headers: { Authorization: 'Bearer ' } },
    { name: 'malformed authorization scheme', headers: { Authorization: 'Basic invalid' } },
    { name: 'invalid WeatherAI key', headers: { Authorization: 'Bearer wai_invalid_test_key' } },
  ] as const;

  for (const scenario of scenarios) {
    test(`rejects ${scenario.name}`, async ({ request }) => {
      const response = await request.get('/v1/weather', {
        params: query,
        headers: scenario.headers,
      });

      await test.step('Validate documented unauthorized behavior', async () => {
        expect(response.status()).toBe(401);
        expect(response.headers()['content-type']).toContain('application/json');
        const body: unknown = await response.json();
        const error = validateSafeErrorBody(body);
        expect(error.error).toBeTruthy();
        expect(JSON.stringify(body)).not.toContain('wai_invalid_test_key');
      });
    });
  }
});
