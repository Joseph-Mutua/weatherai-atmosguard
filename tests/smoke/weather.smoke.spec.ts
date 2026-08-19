import { thresholds } from '../../config/thresholds.js';
import { expect, test } from '../../src/fixtures/api.fixture.js';
import { nairobi } from '../../src/test-data/locations.js';
import { validateRateLimitHeaders } from '../../src/validators/rate-limit.validator.js';

test('Nairobi weather response is healthy @smoke', async ({ weatherClient }, testInfo) => {
  const result = await test.step('Request a minimal non-AI forecast', () =>
    weatherClient.getWeather({
      lat: nairobi.latitude,
      lon: nairobi.longitude,
      days: 1,
      ai: false,
    }));

  const body = await test.step('Validate HTTP and minimal response integrity', async () => {
    expect(result.response.status()).toBe(200);
    expect(result.response.headers()['content-type']).toContain('application/json');

    const json: unknown = await result.response.json();
    expect(json).toBeTruthy();
    expect(JSON.stringify(json).length).toBeGreaterThan(2);
    expect(json).toEqual(
      expect.objectContaining({
        lat: expect.any(Number),
        lon: expect.any(Number),
        units: expect.any(String),
        days: expect.any(Number),
        current: expect.any(Object),
        daily: expect.any(Array),
        hourly: expect.any(Array),
      }),
    );
    return json;
  });

  await test.step('Validate candidate-defined latency budget', () => {
    expect(
      result.durationMs,
      `Response exceeded the candidate-defined ${thresholds.smokeResponseMs} ms smoke budget`,
    ).toBeLessThan(thresholds.smokeResponseMs);
  });

  const rateLimit = await test.step('Validate rate-limit headers when exposed', () =>
    validateRateLimitHeaders(result.response.headers()));

  await testInfo.attach('weatherai-smoke-observation.json', {
    body: Buffer.from(
      JSON.stringify(
        {
          status: result.response.status(),
          durationMs: Math.round(result.durationMs),
          attempts: result.attempts,
          rateLimit,
          responseKeys: typeof body === 'object' && body !== null ? Object.keys(body) : [],
        },
        null,
        2,
      ),
    ),
    contentType: 'application/json',
  });
});
