import { sleep } from 'k6';

import {
  candidateThresholds,
  checkWeatherResponse,
  requestWeather,
  requireAuthorizedLoad,
} from './common.ts';

export const options = {
  stages: [
    { duration: '10s', target: 1 },
    { duration: '10s', target: 10 },
    { duration: '15s', target: 10 },
    { duration: '10s', target: 0 },
  ],
  thresholds: candidateThresholds,
};

export function setup(): void {
  requireAuthorizedLoad();
}

export default function (): void {
  checkWeatherResponse(requestWeather());
  sleep(1);
}
