const SECRET_PATTERN = /\bwai_[A-Za-z0-9_-]+\b/g;
const SENSITIVE_KEYS = /^(authorization|api[-_]?key|token|secret)$/i;

function sanitize(value: unknown, key?: string): unknown {
  if (key && SENSITIVE_KEYS.test(key)) return '[REDACTED]';
  if (typeof value === 'string') return value.replace(SECRET_PATTERN, '[REDACTED]');
  if (Array.isArray(value)) return value.map((item) => sanitize(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([entryKey, entryValue]) => [
        entryKey,
        sanitize(entryValue, entryKey),
      ]),
    );
  }
  return value;
}

export interface Logger {
  info(message: string, context?: Readonly<Record<string, unknown>>): void;
  warn(message: string, context?: Readonly<Record<string, unknown>>): void;
}

function write(
  level: 'info' | 'warn',
  message: string,
  context?: Readonly<Record<string, unknown>>,
) {
  const event = sanitize({ level, message, ...(context ? { context } : {}) });
  const output = JSON.stringify(event);
  if (level === 'warn') console.warn(output);
  else console.info(output);
}

export const logger: Logger = {
  info: (message, context) => write('info', message, context),
  warn: (message, context) => write('warn', message, context),
};
