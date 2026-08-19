import { expect, test } from '../../src/fixtures/api.fixture.js';
import { nairobi } from '../../src/test-data/locations.js';
import { expectSuccessfulWeather } from '../support/weather.assertions.js';

test.describe('Weather geolocation endpoint @functional', () => {
  test('honors explicit coordinate overrides without depending on runner IP', async ({
    weatherClient,
  }) => {
    const result = await test.step('Request weather-geo with deterministic coordinates', () =>
      weatherClient.getWeatherGeo({
        lat: nairobi.latitude,
        lon: nairobi.longitude,
        days: 1,
        ai: false,
        units: 'metric',
      }));

    await test.step('Validate the explicit coordinates and weather response', async () => {
      const weather = await expectSuccessfulWeather(result, {
        latitude: nairobi.latitude,
        longitude: nairobi.longitude,
        days: 1,
        units: 'metric',
        aiDisabled: true,
      });

      expect(weather.daily).toHaveLength(1);
    });
  });
});
