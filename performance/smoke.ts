import { checkWeatherResponse, requestWeather } from './common.ts';

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<5000', 'p(99)<8000'],
    checks: ['rate>0.99'],
  },
};

export default function (): void {
  checkWeatherResponse(requestWeather());
}
