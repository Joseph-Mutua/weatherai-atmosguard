import { sleep } from 'k6';

import {
  candidateThresholds,
  checkWeatherResponse,
  jsonSummary,
  requestWeather,
  requireAuthorizedLoad,
} from './common.ts';

export const options = {
  stages: [
    { duration: '20s', target: 1 },
    { duration: '40s', target: 3 },
    { duration: '20s', target: 0 },
  ],
  thresholds: candidateThresholds,
};

export function setup(): void {
  requireAuthorizedLoad();
}

export function handleSummary(data: unknown): Record<string, string> {
  return jsonSummary('load', data);
}

export default function (): void {
  checkWeatherResponse(requestWeather());
  sleep(1);
}
