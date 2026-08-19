import { expect, test } from '../../src/fixtures/api.fixture.js';
import type { WeatherClient } from '../../src/clients/weather.client.js';
import type { WeatherQuery } from '../../src/models/weather.types.js';

const oneDay = { days: 1, ai: false } as const;

async function expectStatusAndError(
  weatherClient: WeatherClient,
  query: WeatherQuery,
  status: number,
) {
  const result = await weatherClient.getWeather(query);
  expect(result.response.status()).toBe(status);
  const body: unknown = await result.response.json();
  expect(body).toEqual(expect.objectContaining({ error: expect.any(String) }));
}

test.describe('Coordinate boundaries @negative', () => {
  for (const latitude of [-90, 0, 90]) {
    test(`accepts latitude boundary ${latitude}`, async ({ weatherClient }) => {
      const result = await weatherClient.getWeather({ lat: latitude, lon: 0, ...oneDay });
      expect(result.response.status()).toBe(200);
    });
  }

  for (const longitude of [-180, 0, 180]) {
    test(`accepts longitude boundary ${longitude}`, async ({ weatherClient }) => {
      const result = await weatherClient.getWeather({ lat: 0, lon: longitude, ...oneDay });
      expect(result.response.status()).toBe(200);
    });
  }

  for (const scenario of [
    { name: 'latitude below -90', query: { lat: -91, lon: 0, ...oneDay }, status: 502 },
    { name: 'latitude above 90', query: { lat: 91, lon: 0, ...oneDay }, status: 502 },
    { name: 'alphabetic latitude', query: { lat: 'abc', lon: 0, ...oneDay }, status: 400 },
    { name: 'missing latitude', query: { lon: 0, ...oneDay }, status: 400 },
    { name: 'longitude below -180', query: { lat: 0, lon: -181, ...oneDay }, status: 502 },
    { name: 'longitude above 180', query: { lat: 0, lon: 181, ...oneDay }, status: 502 },
    { name: 'alphabetic longitude', query: { lat: 0, lon: 'abc', ...oneDay }, status: 400 },
    { name: 'missing longitude', query: { lat: 0, ...oneDay }, status: 400 },
  ] satisfies readonly { name: string; query: WeatherQuery; status: number }[]) {
    test(`handles observed ${scenario.name} behavior`, async ({ weatherClient }) => {
      await expectStatusAndError(weatherClient, scenario.query, scenario.status);
    });
  }

  for (const scenario of [
    { name: 'empty latitude', query: { lat: '', lon: 0, ...oneDay } },
    { name: 'empty longitude', query: { lat: 0, lon: '', ...oneDay } },
  ] satisfies readonly { name: string; query: WeatherQuery }[]) {
    test(`coerces an ${scenario.name} to zero (observed)`, async ({ weatherClient }) => {
      const result = await weatherClient.getWeather(scenario.query);
      expect(result.response.status()).toBe(200);
      const body: unknown = await result.response.json();
      expect(body).toEqual(expect.objectContaining({ lat: 0, lon: 0 }));
    });
  }
});

test.describe('Forecast-day boundaries @negative', () => {
  for (const scenario of [
    { name: 'zero', value: 0, observedDays: 7 },
    { name: 'negative', value: -1, observedDays: 1 },
    { name: 'excessively large', value: 999, observedDays: 7 },
    { name: 'invalid text', value: 'abc', observedDays: 7 },
  ] as const) {
    test(`normalizes ${scenario.name} days input (observed)`, async ({ weatherClient }) => {
      const result = await weatherClient.getWeather({
        lat: 0,
        lon: 0,
        days: scenario.value,
        ai: false,
      });
      expect(result.response.status()).toBe(200);
      const body: unknown = await result.response.json();
      expect(body).toEqual(expect.objectContaining({ days: scenario.observedDays }));
    });
  }
});
