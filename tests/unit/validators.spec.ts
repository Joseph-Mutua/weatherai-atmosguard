import { expect, test } from '@playwright/test';

import type { ReferenceWeatherResponse } from '../../src/clients/reference-weather.client.js';
import type { WeatherResponse } from '../../src/models/weather.types.js';
import { classifyPlaywrightOutcome } from '../../src/reporting/playwright-outcome.js';
import {
  AccuracyValidationError,
  compareWithReference,
} from '../../src/validators/accuracy.validator.js';
import { validateSafeErrorBody } from '../../src/validators/error.validator.js';
import { validateGeoMetadataHeaders } from '../../src/validators/geo-metadata.validator.js';
import { validateRateLimitHeaders } from '../../src/validators/rate-limit.validator.js';
import {
  validateWeatherData,
  WeatherDataValidationError,
} from '../../src/validators/weather-data.validator.js';

const weather: WeatherResponse = {
  lat: -1.2921,
  lon: 36.8219,
  units: 'metric',
  days: 1,
  current: {
    time: '2026-08-19T12:00:00Z',
    interval: 900,
    temperature: 20,
    windspeed: 5,
    winddirection: 180,
    is_day: 1,
    weathercode: 0,
    humidity: 60,
  },
  daily: [
    {
      date: '2026-08-19',
      temp_max: 25,
      temp_min: 15,
      precipitation: 0,
      weathercode: 0,
    },
  ],
  hourly: [
    {
      time: '2026-08-19T12:00:00Z',
      temp: 20,
      precipitation: 0,
      weathercode: 0,
      windspeed: 5,
    },
  ],
  ai_summary: null,
};

const reference: ReferenceWeatherResponse = {
  latitude: -1.2921,
  longitude: 36.8219,
  timezone: 'Africa/Nairobi',
  current: {
    time: '2026-08-19T12:00:00Z',
    interval: 900,
    temperature_2m: 21,
    relative_humidity_2m: 62,
    wind_speed_10m: 6,
  },
  current_units: {},
};

test.describe('framework validators @unit', () => {
  test('classifies a recovered retry as flaky evidence', () => {
    expect(
      classifyPlaywrightOutcome({
        results: [{ status: 'failed' }, { status: 'passed' }],
      }),
    ).toBe('flaky');
    expect(classifyPlaywrightOutcome({ status: 'unexpected' })).toBe('failed');
    expect(classifyPlaywrightOutcome({ status: 'skipped' })).toBe('skipped');
  });

  test('validates complete optional response-header sets', () => {
    expect(validateRateLimitHeaders({})).toEqual({ exposed: false });
    expect(
      validateRateLimitHeaders({
        'x-ratelimit-limit': '1000',
        'x-ratelimit-remaining': '900',
        'x-ratelimit-reset': '1787184000',
      }),
    ).toEqual({ exposed: true, limit: 1000, remaining: 900, reset: 1787184000 });
    expect(() => validateRateLimitHeaders({ 'x-ratelimit-limit': '1000' })).toThrow(
      'incomplete rate-limit header set',
    );
    expect(() =>
      validateRateLimitHeaders({
        'x-ratelimit-limit': '10',
        'x-ratelimit-remaining': '11',
        'x-ratelimit-reset': '1787184000',
      }),
    ).toThrow('cannot exceed the limit');

    expect(validateGeoMetadataHeaders({})).toEqual({ exposed: false });
    expect(
      validateGeoMetadataHeaders({
        'x-country': 'KE',
        'x-region': 'Nairobi County',
        'x-city': 'Nairobi',
      }),
    ).toEqual({
      exposed: true,
      country: 'KE',
      region: 'Nairobi County',
      city: 'Nairobi',
    });
    expect(() => validateGeoMetadataHeaders({ 'x-country': 'KE' })).toThrow(
      'incomplete geo-metadata header set',
    );
    expect(() =>
      validateGeoMetadataHeaders({ 'x-country': 'KE', 'x-region': '', 'x-city': 'Nairobi' }),
    ).toThrow('empty geo-metadata header value');
  });

  test('rejects unsafe API error details', () => {
    expect(validateSafeErrorBody({ error: 'Invalid request' })).toEqual({
      error: 'Invalid request',
    });
    expect(() =>
      validateSafeErrorBody({ error: 'Unexpected failure', detail: 'node_modules/service.js' }),
    ).toThrow('prohibited implementation or secret pattern');
  });

  test('retains comparison evidence when accuracy tolerance fails', () => {
    const divergentReference: ReferenceWeatherResponse = {
      ...reference,
      current: { ...reference.current, temperature_2m: 40 },
    };

    try {
      compareWithReference(weather, divergentReference, {
        temperatureCelsius: 2,
        humidityPercentagePoints: 10,
        windSpeedKmh: 5,
      });
      throw new Error('Expected accuracy validation to fail.');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(AccuracyValidationError);
      if (!(error instanceof AccuracyValidationError)) throw error;
      expect(error.comparison.metrics.find(({ field }) => field === 'temperature')).toEqual(
        expect.objectContaining({ absoluteDeviation: 20, tolerance: 2 }),
      );
    }
  });

  test('aggregates deterministic weather-domain violations', () => {
    const invalidWeather: WeatherResponse = {
      ...weather,
      current: { ...weather.current, humidity: 101 },
      daily: [{ ...weather.daily[0]!, temp_min: 30, temp_max: 20 }],
      hourly: [{ ...weather.hourly[0]!, windspeed: -1 }],
    };

    try {
      validateWeatherData(invalidWeather, {
        requestedLatitude: weather.lat,
        requestedLongitude: weather.lon,
        requestedDays: weather.days,
      });
      throw new Error('Expected weather data validation to fail.');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(WeatherDataValidationError);
      if (!(error instanceof WeatherDataValidationError)) throw error;
      expect(error.violations).toEqual(
        expect.arrayContaining([
          'current.humidity must be between 0 and 100',
          'daily[0].temp_min exceeds temp_max',
          'hourly[0].windspeed must be non-negative',
        ]),
      );
    }
  });
});
