import type { APIRequestContext, APIResponse } from '@playwright/test';

import { thresholds } from '../../config/thresholds.js';
import type { QueryValue, TimedApiResponse, WeatherQuery } from '../models/weather.types.js';
import { logger } from '../utils/logger.js';
import { measureDuration } from '../utils/response-time.js';
import { withExponentialBackoff } from '../utils/retry.js';

type QueryParameters = Readonly<Record<string, QueryValue>>;

function toQueryParameters(parameters: object): QueryParameters {
  return Object.fromEntries(
    Object.entries(parameters).filter((entry): entry is [string, QueryValue] => {
      const value: unknown = entry[1];
      return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
    }),
  );
}

export interface WeatherClientOptions {
  readonly maxAttempts?: number;
  readonly initialDelayMs?: number;
}

export class WeatherClient {
  readonly #request: APIRequestContext;
  readonly #authorization: string;
  readonly #maxAttempts: number;
  readonly #initialDelayMs: number;

  constructor(request: APIRequestContext, apiKey: string, options: WeatherClientOptions = {}) {
    this.#request = request;
    this.#authorization = `Bearer ${apiKey}`;
    this.#maxAttempts = options.maxAttempts ?? thresholds.retry.maxAttempts;
    this.#initialDelayMs = options.initialDelayMs ?? thresholds.retry.initialDelayMs;
  }

  getWeather(parameters: WeatherQuery): Promise<TimedApiResponse> {
    return this.#get('/v1/weather', parameters);
  }

  getForecast(parameters: WeatherQuery): Promise<TimedApiResponse> {
    return this.#get('/v1/forecast', parameters);
  }

  getCurrent(parameters: WeatherQuery): Promise<TimedApiResponse> {
    return this.#get('/v1/current', parameters);
  }

  getDaily(parameters: WeatherQuery): Promise<TimedApiResponse> {
    return this.#get('/v1/daily', parameters);
  }

  getHourly(parameters: WeatherQuery): Promise<TimedApiResponse> {
    return this.#get('/v1/hourly', parameters);
  }

  getWeatherGeo(
    parameters: WeatherQuery & { readonly ip?: QueryValue },
  ): Promise<TimedApiResponse> {
    return this.#get('/v1/weather-geo', parameters);
  }

  getUsage(): Promise<TimedApiResponse> {
    return this.#get('/v1/usage');
  }

  getForecast14(parameters: WeatherQuery): Promise<TimedApiResponse> {
    return this.#get('/v1/forecast14', parameters);
  }

  async #get(path: string, parameters?: object): Promise<TimedApiResponse> {
    const measured = await measureDuration(() =>
      withExponentialBackoff(
        async () => {
          const options = {
            headers: { Authorization: this.#authorization },
            ...(parameters ? { params: toQueryParameters(parameters) } : {}),
          };
          return this.#request.get(path, options);
        },
        {
          maxAttempts: this.#maxAttempts,
          initialDelayMs: this.#initialDelayMs,
          shouldRetry: (response: APIResponse) =>
            response.status() === 500 || response.status() === 503,
          onRetry: ({ attempt, delayMs }) =>
            logger.warn('Retrying transient WeatherAI response', { path, attempt, delayMs }),
        },
      ),
    );

    return {
      response: measured.value.value,
      durationMs: measured.durationMs,
      attempts: measured.value.attempts,
    };
  }
}
