import type { ReferenceWeatherResponse } from '../clients/reference-weather.client.js';
import type { WeatherResponse } from '../models/weather.types.js';

export interface AccuracyTolerances {
  readonly temperatureCelsius: number;
  readonly humidityPercentagePoints: number;
  readonly windSpeedKmh: number;
}

export interface DeviationMetric {
  readonly field: 'temperature' | 'humidity' | 'windSpeed';
  readonly unit: string;
  readonly weatherAiValue: number;
  readonly referenceValue: number;
  readonly absoluteDeviation: number;
  readonly tolerance: number;
}

export interface AccuracyComparison {
  readonly weatherAiTime: string;
  readonly referenceTime: string;
  readonly timeDifferenceMinutes: number;
  readonly metrics: readonly DeviationMetric[];
}

export class AccuracyValidationError extends Error {
  readonly comparison: AccuracyComparison;

  constructor(message: string, comparison: AccuracyComparison) {
    super(message);
    this.name = 'AccuracyValidationError';
    this.comparison = comparison;
  }
}

function metric(
  field: DeviationMetric['field'],
  unit: string,
  weatherAiValue: number,
  referenceValue: number,
  tolerance: number,
): DeviationMetric {
  return {
    field,
    unit,
    weatherAiValue,
    referenceValue,
    absoluteDeviation: Math.abs(weatherAiValue - referenceValue),
    tolerance,
  };
}

export function compareWithReference(
  weatherAi: WeatherResponse,
  reference: ReferenceWeatherResponse,
  tolerances: AccuracyTolerances,
): AccuracyComparison {
  const weatherAiTimestamp = Date.parse(weatherAi.current.time);
  const referenceTimestamp = Date.parse(reference.current.time);
  if (!Number.isFinite(weatherAiTimestamp) || !Number.isFinite(referenceTimestamp)) {
    throw new Error('Cannot align providers because a current timestamp is invalid.');
  }

  const metrics: DeviationMetric[] = [
    metric(
      'temperature',
      '°C',
      weatherAi.current.temperature,
      reference.current.temperature_2m,
      tolerances.temperatureCelsius,
    ),
    metric(
      'windSpeed',
      'km/h',
      weatherAi.current.windspeed,
      reference.current.wind_speed_10m,
      tolerances.windSpeedKmh,
    ),
  ];
  if (weatherAi.current.humidity !== undefined) {
    metrics.push(
      metric(
        'humidity',
        'percentage points',
        weatherAi.current.humidity,
        reference.current.relative_humidity_2m,
        tolerances.humidityPercentagePoints,
      ),
    );
  }

  const comparison: AccuracyComparison = {
    weatherAiTime: weatherAi.current.time,
    referenceTime: reference.current.time,
    timeDifferenceMinutes: Math.abs(weatherAiTimestamp - referenceTimestamp) / 60_000,
    metrics,
  };

  if (comparison.timeDifferenceMinutes > 60) {
    throw new AccuracyValidationError(
      'Provider observations differ by more than 60 minutes.',
      comparison,
    );
  }
  const anomaly = comparison.metrics.find(
    ({ absoluteDeviation, tolerance }) => absoluteDeviation > tolerance,
  );
  if (anomaly) {
    throw new AccuracyValidationError(
      `${anomaly.field} deviation ${anomaly.absoluteDeviation.toFixed(2)} ${anomaly.unit} exceeds the candidate-defined anomaly tolerance.`,
      comparison,
    );
  }
  return comparison;
}
