import { expect, test } from '../../src/fixtures/api.fixture.js';
import type { WeatherResponse } from '../../src/models/weather.types.js';
import { weatherSchema } from '../../src/schemas/weather.schema.js';
import { nairobi } from '../../src/test-data/locations.js';
import { validateContract } from '../../src/validators/contract.validator.js';

const query = {
  lat: nairobi.latitude,
  lon: nairobi.longitude,
  days: 3,
  ai: false,
  units: 'metric',
} as const;

function readContractResponse(value: unknown): WeatherResponse {
  validateContract<WeatherResponse>(weatherSchema, value);
  return value;
}

test.describe('Endpoint consistency @consistency', () => {
  test('/v1/forecast is a stable alias of /v1/weather', async ({ weatherClient }) => {
    const weatherResult = await test.step('Request /v1/weather', () =>
      weatherClient.getWeather(query));
    const forecastResult = await test.step('Request /v1/forecast with identical parameters', () =>
      weatherClient.getForecast(query));
    expect(weatherResult.response.status()).toBe(200);
    expect(forecastResult.response.status()).toBe(200);
    const weatherBody: unknown = await weatherResult.response.json();
    const forecastBody: unknown = await forecastResult.response.json();
    validateContract<WeatherResponse>(weatherSchema, weatherBody);
    validateContract<WeatherResponse>(weatherSchema, forecastBody);

    await test.step('Compare stable alias fields without brittle whole-payload equality', () => {
      expect(forecastBody.lat).toBe(weatherBody.lat);
      expect(forecastBody.lon).toBe(weatherBody.lon);
      expect(forecastBody.units).toBe(weatherBody.units);
      expect(forecastBody.days).toBe(weatherBody.days);
      expect(forecastBody.daily.map(({ date }) => date)).toEqual(
        weatherBody.daily.map(({ date }) => date),
      );
      expect(forecastBody.hourly.map(({ time }) => time)).toEqual(
        weatherBody.hourly.map(({ time }) => time),
      );

      for (const [index, weatherDay] of weatherBody.daily.entries()) {
        const forecastDay = forecastBody.daily[index];
        expect(forecastDay).toBeDefined();
        if (!forecastDay) continue;
        expect(forecastDay.temp_min).toBeCloseTo(weatherDay.temp_min, 1);
        expect(forecastDay.temp_max).toBeCloseTo(weatherDay.temp_max, 1);
        expect(forecastDay.weathercode).toBe(weatherDay.weathercode);
      }
    });
  });

  test('/v1/current agrees with relevant /v1/weather current fields', async ({ weatherClient }) => {
    const currentQuery = { ...query, days: 1 };
    const weatherResult = await weatherClient.getWeather(currentQuery);
    const currentResult = await weatherClient.getCurrent(currentQuery);
    expect(weatherResult.response.status()).toBe(200);
    expect(currentResult.response.status()).toBe(200);
    const weatherBody = readContractResponse(await weatherResult.response.json());
    const currentBody = readContractResponse(await currentResult.response.json());

    await test.step('Compare relevant current-condition values', () => {
      expect(currentBody.current.temperature).toBeCloseTo(weatherBody.current.temperature, 1);
      expect(currentBody.current.windspeed).toBeCloseTo(weatherBody.current.windspeed, 1);
      expect(currentBody.current.winddirection).toBeCloseTo(weatherBody.current.winddirection, 1);
      expect(currentBody.current.weathercode).toBe(weatherBody.current.weathercode);
      expect(currentBody.current.is_day).toBe(weatherBody.current.is_day);
    });
  });
});
