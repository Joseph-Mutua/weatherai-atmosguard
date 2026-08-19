import { sleep } from 'k6';

import {
  candidateThresholds,
  checkWeatherResponse,
  requestWeather,
  requireAuthorizedLoad,
} from './common.ts';

export const options = {
  stages: [
    { duration: '20s', target: 2 },
    { duration: '30s', target: 5 },
    { duration: '30s', target: 10 },
    { duration: '20s', target: 0 },
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
