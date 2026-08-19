import { expect, test } from '../../src/fixtures/api.fixture.js';
import { nairobi } from '../../src/test-data/locations.js';
import { expectSuccessfulWeather } from '../support/weather.assertions.js';

test.describe('Hourly forecasts @functional', () => {
  for (const days of [1, 7]) {
    test(`returns chronological hourly data when days=${days}`, async ({ weatherClient }) => {
      const result = await weatherClient.getHourly({
        lat: nairobi.latitude,
        lon: nairobi.longitude,
        days,
        ai: false,
      });
      const weather = await expectSuccessfulWeather(result, { days, aiDisabled: true });

      expect(weather.hourly.length).toBeGreaterThan(0);
      const timestamps = weather.hourly.map(({ time }) => Date.parse(time));
      expect(timestamps.every(Number.isFinite)).toBe(true);
      expect(timestamps).toEqual([...timestamps].sort((left, right) => left - right));
    });
  }
});
