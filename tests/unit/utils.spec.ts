import { expect, test } from '@playwright/test';

import { percentile } from '../../src/utils/response-time.js';
import { withExponentialBackoff } from '../../src/utils/retry.js';

test.describe('framework utilities', () => {
  test('calculates nearest-rank percentiles without mutating input', () => {
    const values = [40, 10, 30, 20];

    expect(percentile(values, 95)).toBe(40);
    expect(percentile(values, 50)).toBe(20);
    expect(values).toEqual([40, 10, 30, 20]);
  });

  test('retries a bounded transient result and returns the attempt count', async () => {
    const statuses = [503, 500, 200];

    const result = await withExponentialBackoff(
      async (attempt) => Promise.resolve(statuses[attempt - 1] ?? 200),
      {
        maxAttempts: 3,
        initialDelayMs: 1,
        shouldRetry: (status) => status === 500 || status === 503,
      },
    );

    expect(result).toEqual({ value: 200, attempts: 3 });
  });

  test('does not retry a client error', async () => {
    const result = await withExponentialBackoff(async () => Promise.resolve(400), {
      maxAttempts: 3,
      initialDelayMs: 1,
      shouldRetry: (status) => status === 500 || status === 503,
    });

    expect(result).toEqual({ value: 400, attempts: 1 });
  });
});
