export interface WeatherApiError {
  readonly error: string;
  readonly code?: string;
}

export function isWeatherApiError(value: unknown): value is WeatherApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof value.error === 'string'
  );
}
