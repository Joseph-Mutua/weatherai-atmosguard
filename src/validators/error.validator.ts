import { isWeatherApiError, type WeatherApiError } from '../models/error.types.js';

const INTERNAL_DETAIL_PATTERNS = [
  /\b(stack|stacktrace)\b/i,
  /\bat\s+[\w$.<>]+\s*\([^)]*:\d+:\d+\)/,
  /node_modules/i,
  /firebase[_-]?admin/i,
  /private[_-]?key/i,
  /wai_[A-Za-z0-9_-]+/,
];

export function validateSafeErrorBody(value: unknown): WeatherApiError {
  if (!isWeatherApiError(value) || value.error.trim().length === 0) {
    throw new Error('Error response must contain a non-empty error string.');
  }

  const serialized = JSON.stringify(value);
  const violation = INTERNAL_DETAIL_PATTERNS.find((pattern) => pattern.test(serialized));
  if (violation) {
    throw new Error(
      `Error response exposed a prohibited implementation or secret pattern: ${violation}`,
    );
  }

  return value;
}
