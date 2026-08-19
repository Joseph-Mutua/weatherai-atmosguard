function positiveNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number.`);
  }
  return value;
}

/** Candidate-defined quality gates. These values are not WeatherAI production SLAs. */
export const thresholds = {
  smokeResponseMs: positiveNumber('SMOKE_RESPONSE_BUDGET_MS', 5_000),
  functionalResponseMs: positiveNumber('FUNCTIONAL_RESPONSE_BUDGET_MS', 8_000),
  monitoringResponseMs: positiveNumber('MONITORING_RESPONSE_BUDGET_MS', 5_000),
  retry: {
    maxAttempts: positiveNumber('TRANSIENT_MAX_ATTEMPTS', 3),
    initialDelayMs: positiveNumber('TRANSIENT_INITIAL_DELAY_MS', 500),
  },
  accuracy: {
    temperatureCelsius: positiveNumber('ACCURACY_TEMPERATURE_TOLERANCE_C', 8),
    humidityPercentagePoints: positiveNumber('ACCURACY_HUMIDITY_TOLERANCE', 30),
    windSpeedKmh: positiveNumber('ACCURACY_WIND_SPEED_TOLERANCE_KMH', 25),
  },
} as const;
