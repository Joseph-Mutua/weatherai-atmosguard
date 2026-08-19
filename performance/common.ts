import { check } from 'k6';
import http, { type RefinedResponse, type ResponseType } from 'k6/http';

declare const __ENV: Readonly<Record<string, string | undefined>>;

const baseUrl = (__ENV.WEATHER_AI_BASE_URL ?? 'https://api.weather-ai.co').replace(/\/$/, '');

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
  return http.get(`${baseUrl}/v1/weather?lat=-1.2921&lon=36.8219&days=1&ai=false`, {
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

  check(response, {
    'HTTP status is 200': ({ status }) => status === 200,
    'response is JSON': ({ headers }) => String(headers['Content-Type'] ?? '').includes('json'),
    'response has current conditions': () =>
      typeof body === 'object' && body !== null && 'current' in body,
    'response has forecast arrays': () =>
      typeof body === 'object' && body !== null && 'daily' in body && 'hourly' in body,
  });
}

export const candidateThresholds = {
  http_req_failed: ['rate<0.01'],
  http_req_duration: ['p(95)<5000', 'p(99)<8000'],
  checks: ['rate>0.99'],
} as const;
