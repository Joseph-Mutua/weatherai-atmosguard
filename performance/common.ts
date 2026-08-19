import { check } from 'k6';
import http, { type RefinedResponse, type ResponseType } from 'k6/http';

declare const __ENV: Readonly<Record<string, string | undefined>>;

const baseUrl = (__ENV.WEATHER_AI_BASE_URL ?? 'https://api.weather-ai.co').replace(/\/$/, '');
const requestExpectation = {
  latitude: -1.2921,
  longitude: 36.8219,
  days: 1,
  units: 'metric',
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function approximatelyEqual(actual: unknown, expected: number): boolean {
  return isFiniteNumber(actual) && Math.abs(actual - expected) < 0.0001;
}

function requireApiKey(): string {
  const apiKey = __ENV.WEATHER_AI_API_KEY;
  if (!apiKey) throw new Error('WEATHER_AI_API_KEY is required for k6 execution.');
  return apiKey;
}

export function requireAuthorizedLoad(): void {
  if (__ENV.ALLOW_HIGH_VOLUME !== 'true') {
    throw new Error(
      'Set ALLOW_HIGH_VOLUME=true only after confirming authorization and sufficient API quota.',
    );
  }
}

export function requestWeather(): RefinedResponse<ResponseType> {
  const query = [
    `lat=${requestExpectation.latitude}`,
    `lon=${requestExpectation.longitude}`,
    `days=${requestExpectation.days}`,
    `units=${requestExpectation.units}`,
    'ai=false',
  ].join('&');

  return http.get(`${baseUrl}/v1/weather?${query}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${requireApiKey()}`,
    },
    tags: { endpoint: 'GET /v1/weather' },
  });
}

export function checkWeatherResponse(response: RefinedResponse<ResponseType>): void {
  let body: unknown;
  try {
    body = typeof response.body === 'string' ? JSON.parse(response.body) : undefined;
  } catch {
    body = undefined;
  }

  const weather = isRecord(body) ? body : undefined;
  const current = isRecord(weather?.current) ? weather.current : undefined;
  const daily = Array.isArray(weather?.daily) ? weather.daily : undefined;
  const hourly = Array.isArray(weather?.hourly) ? weather.hourly : undefined;

  check(response, {
    'HTTP status is 200': ({ status }) => status === 200,
    'response is JSON': ({ headers }) => String(headers['Content-Type'] ?? '').includes('json'),
    'latitude matches request': () => approximatelyEqual(weather?.lat, requestExpectation.latitude),
    'longitude matches request': () =>
      approximatelyEqual(weather?.lon, requestExpectation.longitude),
    'forecast horizon matches request': () => weather?.days === requestExpectation.days,
    'units match request': () => weather?.units === requestExpectation.units,
    'current temperature is finite': () => isFiniteNumber(current?.temperature),
    'current wind speed is finite and non-negative': () =>
      isFiniteNumber(current?.windspeed) && current.windspeed >= 0,
    'daily forecast is non-empty': () => daily !== undefined && daily.length > 0,
    'hourly forecast is non-empty': () => hourly !== undefined && hourly.length > 0,
  });
}

export function jsonSummary(
  profile: 'smoke' | 'load' | 'stress' | 'spike',
  data: unknown,
): Record<string, string> {
  return {
    [`k6-results/${profile}-summary.json`]: `${JSON.stringify(data, null, 2)}\n`,
  };
}

export const candidateThresholds = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(95)<5000', 'p(99)<8000'],
  checks: ['rate>0.99'],
} as const;
