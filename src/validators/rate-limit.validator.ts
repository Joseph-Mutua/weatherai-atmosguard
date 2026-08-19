const HEADER_NAMES = ['x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset'] as const;

export interface RateLimitObservation {
  readonly exposed: boolean;
  readonly limit?: number;
  readonly remaining?: number;
  readonly reset?: number;
}

function parseNonNegativeInteger(name: string, value: string): number {
  if (!/^\d+$/.test(value)) throw new Error(`${name} must contain an integer.`);
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(`${name} must contain a non-negative safe integer.`);
  }
  return parsed;
}

export function validateRateLimitHeaders(
  headers: Readonly<Record<string, string>>,
): RateLimitObservation {
  const values = HEADER_NAMES.map((name) => headers[name]);
  const exposedCount = values.filter((value) => value !== undefined).length;

  if (exposedCount === 0) return { exposed: false };
  if (exposedCount !== HEADER_NAMES.length) {
    throw new Error('WeatherAI returned an incomplete rate-limit header set.');
  }

  const [limitValue, remainingValue, resetValue] = values;
  if (limitValue === undefined || remainingValue === undefined || resetValue === undefined) {
    throw new Error('Rate-limit header validation invariant failed.');
  }

  const limit = parseNonNegativeInteger('X-RateLimit-Limit', limitValue);
  const remaining = parseNonNegativeInteger('X-RateLimit-Remaining', remainingValue);
  const reset = parseNonNegativeInteger('X-RateLimit-Reset', resetValue);

  if (remaining > limit) throw new Error('X-RateLimit-Remaining cannot exceed the limit.');
  if (Number.isNaN(new Date(reset * 1_000).getTime())) {
    throw new Error('X-RateLimit-Reset is not a valid Unix timestamp.');
  }

  return { exposed: true, limit, remaining, reset };
}
