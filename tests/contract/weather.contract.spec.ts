import { errorSchema } from '../../src/schemas/error.schema.js';
import { usageSchema, weatherSchema } from '../../src/schemas/weather.schema.js';
import { expect, test } from '../../src/fixtures/api.fixture.js';
import type { UsageResponse, WeatherResponse } from '../../src/models/weather.types.js';
import { nairobi } from '../../src/test-data/locations.js';
import { validateContract } from '../../src/validators/contract.validator.js';
import type { WeatherApiError } from '../../src/models/error.types.js';

const query = {
  lat: nairobi.latitude,
  lon: nairobi.longitude,
  days: 1,
  ai: false,
} as const;

test.describe('WeatherAI contracts @contract', () => {
  test('validates the main weather response contract', async ({ weatherClient }) => {
    const result = await test.step('Request observed WeatherAI shape', () =>
      weatherClient.getWeather(query));
    expect(result.response.status()).toBe(200);
    const body: unknown = await result.response.json();

    await test.step('Validate tolerant JSON Schema contract', () => {
      validateContract<WeatherResponse>(weatherSchema, body);
    });
  });

  for (const endpoint of ['forecast', 'current', 'daily', 'hourly'] as const) {
    test(`validates the delegated ${endpoint} response contract`, async ({ weatherClient }) => {
      const requestByEndpoint = {
        forecast: () => weatherClient.getForecast(query),
        current: () => weatherClient.getCurrent(query),
        daily: () => weatherClient.getDaily(query),
        hourly: () => weatherClient.getHourly(query),
      } as const;
      const result = await requestByEndpoint[endpoint]();
      expect(result.response.status()).toBe(200);
      const body: unknown = await result.response.json();
      validateContract<WeatherResponse>(weatherSchema, body);
    });
  }

  test('validates the usage response contract', async ({ weatherClient }) => {
    const result = await weatherClient.getUsage();
    expect(result.response.status()).toBe(200);
    const body: unknown = await result.response.json();
    validateContract<UsageResponse>(usageSchema, body);
  });

  test('validates the documented unauthorized error contract', async ({ request }) => {
    const response = await request.get('/v1/weather', { params: query });
    expect(response.status()).toBe(401);
    const body: unknown = await response.json();
    validateContract<WeatherApiError>(errorSchema, body);
  });
});
