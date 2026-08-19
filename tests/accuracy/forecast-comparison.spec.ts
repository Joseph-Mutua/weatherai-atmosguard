import type { TestInfo } from '@playwright/test';

import { thresholds } from '../../config/thresholds.js';
import {
  ReferenceWeatherClient,
  type ReferenceWeatherResponse,
} from '../../src/clients/reference-weather.client.js';
import { expect, test } from '../../src/fixtures/api.fixture.js';
import { locations } from '../../src/test-data/locations.js';
import {
  AccuracyValidationError,
  compareWithReference,
  type AccuracyComparison,
} from '../../src/validators/accuracy.validator.js';
import { expectSuccessfulWeather } from '../support/weather.assertions.js';

async function attachComparison(
  testInfo: TestInfo,
  location: string,
  comparison: AccuracyComparison,
): Promise<void> {
  await testInfo.attach('cross-provider-comparison.json', {
    body: Buffer.from(JSON.stringify({ location, ...comparison }, null, 2)),
    contentType: 'application/json',
  });
}

test.describe('Independent provider comparison @accuracy', () => {
  for (const location of [locations[0], locations[1], locations[4]]) {
    test(`detects material current-condition divergence for ${location.name}`, async ({
      request,
      weatherClient,
    }, testInfo) => {
      const referenceClient = new ReferenceWeatherClient(request);
      const [weatherAiResult, referenceResult] =
        await test.step('Request WeatherAI and Open-Meteo independently', () =>
          Promise.all([
            weatherClient.getWeather({
              lat: location.latitude,
              lon: location.longitude,
              days: 1,
              ai: false,
              units: 'metric',
            }),
            referenceClient.getCurrent(location.latitude, location.longitude),
          ]));

      const weatherAi = await expectSuccessfulWeather(weatherAiResult, {
        latitude: location.latitude,
        longitude: location.longitude,
        units: 'metric',
        aiDisabled: true,
      });
      expect(referenceResult.response.status()).toBe(200);
      const reference = (await referenceResult.response.json()) as ReferenceWeatherResponse;
      expect(reference.current).toEqual(
        expect.objectContaining({
          time: expect.any(String),
          temperature_2m: expect.any(Number),
          relative_humidity_2m: expect.any(Number),
          wind_speed_10m: expect.any(Number),
        }),
      );

      try {
        const comparison =
          await test.step('Calculate deviations and apply anomaly tolerances', () =>
            compareWithReference(weatherAi, reference, thresholds.accuracy));
        await attachComparison(testInfo, location.name, comparison);
      } catch (error: unknown) {
        if (error instanceof AccuracyValidationError) {
          await attachComparison(testInfo, location.name, error.comparison);
        }
        throw error;
      }
    });
  }
});
