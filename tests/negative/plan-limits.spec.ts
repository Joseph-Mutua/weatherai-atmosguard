import { environment } from '../../config/environments.js';
import { expect, test } from '../../src/fixtures/api.fixture.js';
import { nairobi } from '../../src/test-data/locations.js';
import { validateSafeErrorBody } from '../../src/validators/error.validator.js';
import { expectSuccessfulWeather } from '../support/weather.assertions.js';

test('enforces plan-aware forecast14 authorization @negative @security', async ({
  weatherClient,
}) => {
  const result = await weatherClient.getForecast14({
    lat: nairobi.latitude,
    lon: nairobi.longitude,
    days: 14,
    ai: false,
  });

  if (environment.plan === 'free') {
    expect(result.response.status()).toBe(403);
    const body: unknown = await result.response.json();
    const error = validateSafeErrorBody(body);
    expect(error.error.trim().length).toBeGreaterThan(0);
    return;
  }

  await expectSuccessfulWeather(result, { days: 14, aiDisabled: true });
});
