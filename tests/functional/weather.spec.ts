import { expect, test } from '../../src/fixtures/api.fixture.js';
import { locations, nairobi } from '../../src/test-data/locations.js';
import { expectSuccessfulWeather } from '../support/weather.assertions.js';

test.describe('Weather and forecast endpoints @functional', () => {
  for (const location of locations) {
    test(`returns one-day metric weather for ${location.name}`, async ({ weatherClient }) => {
      const result = await test.step('Request weather with AI disabled', () =>
        weatherClient.getWeather({
          lat: location.latitude,
          lon: location.longitude,
          days: 1,
          ai: false,
          units: 'metric',
        }));

      await test.step('Validate the functional response', () =>
        expectSuccessfulWeather(result, {
          latitude: location.latitude,
          longitude: location.longitude,
          days: 1,
          units: 'metric',
          aiDisabled: true,
        }));
    });
  }

  test('supports the Free-plan seven-day horizon', async ({ weatherClient }) => {
    const result = await weatherClient.getWeather({
      lat: nairobi.latitude,
      lon: nairobi.longitude,
      days: 7,
      ai: false,
    });
    const weather = await expectSuccessfulWeather(result, { days: 7, aiDisabled: true });
    expect(weather.daily).toHaveLength(7);
  });

  test('serves the documented forecast alias', async ({ weatherClient }) => {
    const result = await weatherClient.getForecast({
      lat: nairobi.latitude,
      lon: nairobi.longitude,
      days: 1,
      ai: false,
    });
    await expectSuccessfulWeather(result, { days: 1, aiDisabled: true });
  });

  test('converts matching current temperature fields between units', async ({ weatherClient }) => {
    const query = { lat: nairobi.latitude, lon: nairobi.longitude, days: 1, ai: false } as const;

    const [metricResult, imperialResult] = await Promise.all([
      weatherClient.getWeather({ ...query, units: 'metric' }),
      weatherClient.getWeather({ ...query, units: 'imperial' }),
    ]);
    const metric = await expectSuccessfulWeather(metricResult, { units: 'metric' });
    const imperial = await expectSuccessfulWeather(imperialResult, { units: 'imperial' });

    const convertedTemperature = (metric.current.temperature * 9) / 5 + 32;
    expect(imperial.current.temperature).toBeCloseTo(convertedTemperature, 0);
  });

  for (const language of ['en', 'sw'] as const) {
    test(`returns an AI summary for documented language example ${language}`, async ({
      weatherClient,
    }) => {
      test.skip(
        process.env.RUN_AI_TESTS !== 'true',
        'AI validation is opt-in to protect the finite WeatherAI AI quota.',
      );

      const result = await weatherClient.getWeather({
        lat: nairobi.latitude,
        lon: nairobi.longitude,
        days: 1,
        ai: true,
        lang: language,
      });
      const weather = await expectSuccessfulWeather(result, { days: 1 });
      expect(weather.ai_summary).not.toBeNull();
    });
  }
});
