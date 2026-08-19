import { expect, test } from '../../src/fixtures/api.fixture.js';
import { nairobi } from '../../src/test-data/locations.js';
import { expectSuccessfulWeather } from '../support/weather.assertions.js';

test.describe('Daily forecasts @functional', () => {
  for (const days of [1, 7]) {
    test(`returns ${days} daily forecast record(s)`, async ({ weatherClient }) => {
      const result = await weatherClient.getDaily({
        lat: nairobi.latitude,
        lon: nairobi.longitude,
        days,
        ai: false,
      });
      const weather = await expectSuccessfulWeather(result, { days, aiDisabled: true });

      expect(weather.daily).toHaveLength(days);
    });
  }
});
