import type { APIResponse } from '@playwright/test';

export type WeatherUnits = 'metric' | 'imperial';
export type QueryValue = string | number | boolean;

export interface WeatherQuery {
  readonly lat?: QueryValue;
  readonly lon?: QueryValue;
  readonly days?: QueryValue;
  readonly ai?: QueryValue;
  readonly units?: QueryValue;
  readonly lang?: QueryValue;
}

export interface WeatherCurrent {
  readonly time: string;
  readonly interval: number;
  readonly temperature: number;
  readonly windspeed: number;
  readonly winddirection: number;
  readonly is_day: number;
  readonly weathercode: number;
  readonly humidity?: number;
  readonly pressure?: number;
  readonly cloudcover?: number;
}

export interface WeatherDaily {
  readonly date: string;
  readonly temp_max: number;
  readonly temp_min: number;
  readonly precipitation: number;
  readonly weathercode: number;
  readonly precipitation_probability?: number;
}

export interface WeatherHourly {
  readonly time: string;
  readonly temp: number;
  readonly precipitation: number;
  readonly weathercode: number;
  readonly humidity?: number;
  readonly windspeed?: number;
  readonly precipitation_probability?: number;
}

export interface WeatherResponse {
  readonly lat: number;
  readonly lon: number;
  readonly units: WeatherUnits;
  readonly days: number;
  readonly current: WeatherCurrent;
  readonly daily: readonly WeatherDaily[];
  readonly hourly: readonly WeatherHourly[];
  readonly ai_summary: unknown;
}

export interface UsageResponse {
  readonly plan: string;
  readonly used: number;
  readonly limit: number;
  readonly remaining: number;
  readonly unlimited: boolean;
}

export interface TimedApiResponse {
  readonly response: APIResponse;
  readonly durationMs: number;
  readonly attempts: number;
}
