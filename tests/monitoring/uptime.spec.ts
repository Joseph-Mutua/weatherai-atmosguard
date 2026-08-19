import { thresholds } from '../../config/thresholds.js';
import { expect, test } from '../../src/fixtures/api.fixture.js';
import { nairobi } from '../../src/test-data/locations.js';
import { expectSuccessfulWeather } from '../support/weather.assertions.js';

test('minimal WeatherAI synthetic check @monitoring', async ({ weatherClient }, testInfo) => {
  const result = await test.step('Make one quota-conscious reachability request', () =>
    weatherClient.getWeather({
      lat: nairobi.latitude,
      lon: nairobi.longitude,
      days: 1,
      ai: false,
    }));

  await test.step('Validate availability and minimal JSON response', () =>
    expectSuccessfulWeather(result, { days: 1, aiDisabled: true }));

  await test.step('Validate candidate-defined monitoring latency budget', () => {
    expect(
      result.durationMs,
      `Response exceeded the candidate-defined ${thresholds.monitoringResponseMs} ms monitoring budget`,
    ).toBeLessThan(thresholds.monitoringResponseMs);
  });

  testInfo.annotations.push({
    type: 'monitoring-duration-ms',
    description: String(Math.round(result.durationMs)),
  });
});
