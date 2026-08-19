import { checkWeatherResponse, jsonSummary, requestWeather } from './common.ts';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['max<5000'],
    checks: ['rate>0.99'],
  },
};

export function handleSummary(data: unknown): Record<string, string> {
  return jsonSummary('smoke', data);
}

export default function (): void {
  checkWeatherResponse(requestWeather());
}
