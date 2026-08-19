import type { APIRequestContext } from '@playwright/test';

import { environment } from '../../config/environments.js';
import type { TimedApiResponse } from '../models/weather.types.js';
import { measureDuration } from '../utils/response-time.js';

export interface ReferenceCurrent {
  readonly time: string;
  readonly interval: number;
  readonly temperature_2m: number;
  readonly relative_humidity_2m: number;
  readonly wind_speed_10m: number;
}

export interface ReferenceWeatherResponse {
  readonly latitude: number;
  readonly longitude: number;
  readonly timezone: string;
  readonly current: ReferenceCurrent;
  readonly current_units: Readonly<Record<string, string>>;
}

export class ReferenceWeatherClient {
  readonly #request: APIRequestContext;
  readonly #baseUrl: string;

  constructor(request: APIRequestContext, baseUrl = environment.referenceWeatherBaseUrl) {
    this.#request = request;
    this.#baseUrl = baseUrl.replace(/\/$/, '');
  }

  async getCurrent(latitude: number, longitude: number): Promise<TimedApiResponse> {
    const measured = await measureDuration(() =>
      this.#request.get(`${this.#baseUrl}/v1/forecast`, {
        params: {
          latitude,
          longitude,
          current: 'temperature_2m,relative_humidity_2m,wind_speed_10m',
          wind_speed_unit: 'kmh',
          timezone: 'auto',
        },
      }),
    );

    return { response: measured.value, durationMs: measured.durationMs, attempts: 1 };
  }
}
