import { test } from '../../src/fixtures/api.fixture.js';
import { locations } from '../../src/test-data/locations.js';
import { expectSuccessfulWeather } from '../support/weather.assertions.js';

test.describe('Current conditions @functional', () => {
  for (const location of [locations[0], locations[2], locations[4]]) {
    test(`returns current conditions for ${location.name}`, async ({ weatherClient }) => {
      const result = await weatherClient.getCurrent({
        lat: location.latitude,
        lon: location.longitude,
        ai: false,
        units: 'metric',
      });

      await expectSuccessfulWeather(result, {
        latitude: location.latitude,
        longitude: location.longitude,
        units: 'metric',
        aiDisabled: true,
      });
    });
  }
});
