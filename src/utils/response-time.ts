import { performance } from 'node:perf_hooks';

export async function measureDuration<T>(operation: () => Promise<T>): Promise<{
  readonly value: T;
  readonly durationMs: number;
}> {
  const startedAt = performance.now();
  const value = await operation();
  return { value, durationMs: performance.now() - startedAt };
}

export function percentile(values: readonly number[], percentileValue: number): number | undefined {
  if (values.length === 0) return undefined;
  if (percentileValue < 0 || percentileValue > 100) {
    throw new Error('Percentile must be between 0 and 100.');
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.ceil((percentileValue / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}
