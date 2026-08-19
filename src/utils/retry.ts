export interface RetryOptions<T> {
  readonly maxAttempts: number;
  readonly initialDelayMs: number;
  readonly shouldRetry: (value: T) => boolean;
  readonly onRetry?: (details: { attempt: number; delayMs: number }) => void;
}

export interface RetryResult<T> {
  readonly value: T;
  readonly attempts: number;
}

export async function withExponentialBackoff<T>(
  operation: (attempt: number) => Promise<T>,
  options: RetryOptions<T>,
): Promise<RetryResult<T>> {
  if (!Number.isInteger(options.maxAttempts) || options.maxAttempts < 1) {
    throw new Error('maxAttempts must be a positive integer.');
  }

  let attempt = 1;
  while (true) {
    const value = await operation(attempt);
    if (attempt >= options.maxAttempts || !options.shouldRetry(value)) {
      return { value, attempts: attempt };
    }

    const delayMs = options.initialDelayMs * 2 ** (attempt - 1);
    options.onRetry?.({ attempt, delayMs });
    await new Promise<void>((resolve) => setTimeout(resolve, delayMs));
    attempt += 1;
  }
}
