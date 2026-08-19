import { expect } from '@playwright/test';

import { thresholds } from '../../config/thresholds.js';
import type {
  TimedApiResponse,
  WeatherResponse,
  WeatherUnits,
} from '../../src/models/weather.types.js';

export interface ExpectedWeatherResponse {
  readonly latitude?: number;
  readonly longitude?: number;
  readonly days?: number;
  readonly units?: WeatherUnits;
  readonly aiDisabled?: boolean;
}

export async function expectSuccessfulWeather(
  result: TimedApiResponse,
  expected: ExpectedWeatherResponse = {},
): Promise<WeatherResponse> {
  expect(result.response.status()).toBe(200);
  expect(result.response.headers()['content-type']).toContain('application/json');
  expect(result.durationMs).toBeLessThan(thresholds.functionalResponseMs);

  const body: unknown = await result.response.json();
  expect(body).toEqual(
    expect.objectContaining({
      lat: expect.any(Number),
      lon: expect.any(Number),
      units: expect.stringMatching(/^(metric|imperial)$/),
      days: expect.any(Number),
      current: expect.objectContaining({
        time: expect.any(String),
        temperature: expect.any(Number),
        windspeed: expect.any(Number),
        weathercode: expect.any(Number),
      }),
      daily: expect.any(Array),
      hourly: expect.any(Array),
    }),
  );

  const weather = body as WeatherResponse;
  if (expected.latitude !== undefined) expect(weather.lat).toBeCloseTo(expected.latitude, 4);
  if (expected.longitude !== undefined) expect(weather.lon).toBeCloseTo(expected.longitude, 4);
  if (expected.days !== undefined) expect(weather.days).toBe(expected.days);
  if (expected.units !== undefined) expect(weather.units).toBe(expected.units);
  if (expected.aiDisabled) expect(weather.ai_summary).toBeNull();
  return weather;
}
