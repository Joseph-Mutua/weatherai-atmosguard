import type { WeatherResponse } from '../models/weather.types.js';

export interface WeatherDataValidationContext {
  readonly requestedLatitude: number;
  readonly requestedLongitude: number;
  readonly requestedDays: number;
}

export interface WeatherDataQualitySummary {
  readonly dailyRecords: number;
  readonly hourlyRecords: number;
  readonly numericValuesChecked: number;
}

export class WeatherDataValidationError extends Error {
  readonly violations: readonly string[];

  constructor(violations: readonly string[]) {
    super(`Weather data-quality validation failed: ${violations.join('; ')}`);
    this.name = 'WeatherDataValidationError';
    this.violations = violations;
  }
}

function checkPercentage(value: number | undefined, path: string, violations: string[]) {
  if (value !== undefined && (value < 0 || value > 100)) {
    violations.push(`${path} must be between 0 and 100`);
  }
}

function parseTimestamp(value: string, path: string, violations: string[]): number {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) violations.push(`${path} is not a parseable timestamp`);
  return timestamp;
}

function checkChronological(values: readonly number[], path: string, violations: string[]) {
  for (let index = 1; index < values.length; index += 1) {
    const previous = values[index - 1];
    const current = values[index];
    if (previous !== undefined && current !== undefined && current < previous) {
      violations.push(`${path} is not chronological at index ${index}`);
      return;
    }
  }
}

function checkFiniteNumbers(value: unknown, path: string, violations: string[]): number {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) violations.push(`${path} is not finite`);
    return 1;
  }
  if (Array.isArray(value)) {
    const items: readonly unknown[] = value;
    return items.reduce<number>(
      (count, item, index) => count + checkFiniteNumbers(item, `${path}[${index}]`, violations),
      0,
    );
  }
  if (value && typeof value === 'object') {
    const record = value as Readonly<Record<string, unknown>>;
    return Object.entries(record).reduce<number>(
      (count, [key, item]) => count + checkFiniteNumbers(item, `${path}.${key}`, violations),
      0,
    );
  }
  return 0;
}

export function validateWeatherData(
  weather: WeatherResponse,
  context: WeatherDataValidationContext,
): WeatherDataQualitySummary {
  const violations: string[] = [];
  const numericValuesChecked = checkFiniteNumbers(weather, '$', violations);

  if (Math.abs(weather.lat - context.requestedLatitude) > 0.0001) {
    violations.push(`response latitude ${weather.lat} does not match requested latitude`);
  }
  if (Math.abs(weather.lon - context.requestedLongitude) > 0.0001) {
    violations.push(`response longitude ${weather.lon} does not match requested longitude`);
  }
  if (weather.days !== context.requestedDays) {
    violations.push(`response days ${weather.days} does not match requested days`);
  }
  if (weather.daily.length !== context.requestedDays) {
    violations.push(`daily record count ${weather.daily.length} does not match requested horizon`);
  }

  if (weather.current.windspeed < 0) violations.push('current.windspeed must be non-negative');
  if (weather.current.pressure !== undefined && weather.current.pressure <= 0) {
    violations.push('current.pressure must be positive');
  }
  checkPercentage(weather.current.humidity, 'current.humidity', violations);
  checkPercentage(weather.current.cloudcover, 'current.cloudcover', violations);
  parseTimestamp(weather.current.time, 'current.time', violations);

  const dailyTimestamps = weather.daily.map((day, index) => {
    if (day.temp_min > day.temp_max) {
      violations.push(`daily[${index}].temp_min exceeds temp_max`);
    }
    if (day.precipitation < 0) {
      violations.push(`daily[${index}].precipitation must be non-negative`);
    }
    checkPercentage(
      day.precipitation_probability,
      `daily[${index}].precipitation_probability`,
      violations,
    );
    return parseTimestamp(day.date, `daily[${index}].date`, violations);
  });
  checkChronological(dailyTimestamps, 'daily dates', violations);

  const hourlyTimestamps = weather.hourly.map((hour, index) => {
    if (hour.precipitation < 0) {
      violations.push(`hourly[${index}].precipitation must be non-negative`);
    }
    if (hour.windspeed !== undefined && hour.windspeed < 0) {
      violations.push(`hourly[${index}].windspeed must be non-negative`);
    }
    checkPercentage(hour.humidity, `hourly[${index}].humidity`, violations);
    checkPercentage(
      hour.precipitation_probability,
      `hourly[${index}].precipitation_probability`,
      violations,
    );
    return parseTimestamp(hour.time, `hourly[${index}].time`, violations);
  });
  checkChronological(hourlyTimestamps, 'hourly timestamps', violations);

  const firstDailyDate = weather.daily[0]?.date;
  const lastDailyDate = weather.daily.at(-1)?.date;
  for (const [index, hour] of weather.hourly.entries()) {
    const hourlyDate = hour.time.slice(0, 10);
    if (
      firstDailyDate !== undefined &&
      lastDailyDate !== undefined &&
      (hourlyDate < firstDailyDate || hourlyDate > lastDailyDate)
    ) {
      violations.push(`hourly[${index}] falls outside the returned daily horizon`);
      break;
    }
  }

  if (violations.length > 0) throw new WeatherDataValidationError(violations);
  return {
    dailyRecords: weather.daily.length,
    hourlyRecords: weather.hourly.length,
    numericValuesChecked,
  };
}
