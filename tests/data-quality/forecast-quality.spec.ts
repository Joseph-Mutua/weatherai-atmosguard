import { expect, test } from '../../src/fixtures/api.fixture.js';
import type { WeatherResponse } from '../../src/models/weather.types.js';
import { weatherSchema } from '../../src/schemas/weather.schema.js';
import { locations } from '../../src/test-data/locations.js';
import { validateContract } from '../../src/validators/contract.validator.js';
import { validateWeatherData } from '../../src/validators/weather-data.validator.js';

test.describe('Global forecast data quality @data-quality', () => {
  for (const location of locations) {
    test(`validates seven-day forecast quality for ${location.name}`, async ({
      weatherClient,
    }, testInfo) => {
      const result = await test.step('Request a seven-day non-AI forecast', () =>
        weatherClient.getWeather({
          lat: location.latitude,
          lon: location.longitude,
          days: 7,
          ai: false,
          units: 'metric',
        }));
      expect(result.response.status()).toBe(200);
      const body: unknown = await result.response.json();

      await test.step('Validate the response contract', () => {
        validateContract<WeatherResponse>(weatherSchema, body);
      });

      const summary = await test.step('Validate weather-domain invariants', () =>
        validateWeatherData(body as WeatherResponse, {
          requestedLatitude: location.latitude,
          requestedLongitude: location.longitude,
          requestedDays: 7,
        }));

      await testInfo.attach('data-quality-summary.json', {
        body: Buffer.from(
          JSON.stringify({ location: location.name, durationMs: result.durationMs, ...summary }),
        ),
        contentType: 'application/json',
      });
    });
  }
});
