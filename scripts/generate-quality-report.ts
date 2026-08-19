import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { percentile } from '../src/utils/response-time.js';

interface JsonResult {
  readonly status?: string;
  readonly duration?: number;
  readonly errors?: readonly { readonly message?: string }[];
  readonly attachments?: readonly { readonly name?: string }[];
}

interface JsonTest {
  readonly results?: readonly JsonResult[];
}

interface JsonSpec {
  readonly title?: string;
  readonly tests?: readonly JsonTest[];
}

interface JsonSuite {
  readonly title?: string;
  readonly file?: string;
  readonly suites?: readonly JsonSuite[];
  readonly specs?: readonly JsonSpec[];
}

interface PlaywrightJsonReport {
  readonly suites?: readonly JsonSuite[];
}

interface ObservedTest {
  readonly title: string;
  readonly file: string;
  readonly result: JsonResult;
}

const endpointByFile: Readonly<Record<string, readonly string[]>> = {
  'weather.smoke.spec.ts': ['/v1/weather'],
  'weather.spec.ts': ['/v1/weather', '/v1/forecast'],
  'weather-geo.spec.ts': ['/v1/weather-geo'],
  'current.spec.ts': ['/v1/current'],
  'daily.spec.ts': ['/v1/daily'],
  'hourly.spec.ts': ['/v1/hourly'],
  'weather.contract.spec.ts': [
    '/v1/weather',
    '/v1/forecast',
    '/v1/current',
    '/v1/daily',
    '/v1/hourly',
    '/v1/usage',
  ],
  'authentication.spec.ts': ['/v1/weather'],
  'parameters.spec.ts': ['/v1/weather'],
  'plan-limits.spec.ts': ['/v1/forecast14'],
  'endpoint-consistency.spec.ts': ['/v1/weather', '/v1/forecast', '/v1/current'],
  'forecast-quality.spec.ts': ['/v1/weather'],
  'forecast-comparison.spec.ts': ['/v1/weather', 'Open-Meteo /v1/forecast'],
  'uptime.spec.ts': ['/v1/weather'],
};

function collectTests(
  suite: JsonSuite,
  parents: readonly string[] = [],
  parentFile = '',
): ObservedTest[] {
  const titles = suite.title ? [...parents, suite.title] : [...parents];
  const file = suite.file ?? parentFile;
  const ownTests = (suite.specs ?? []).flatMap((spec) =>
    (spec.tests ?? []).flatMap((test) => {
      const result = test.results?.at(-1);
      return result
        ? [{ title: [...titles, spec.title ?? 'unnamed test'].join(' › '), file, result }]
        : [];
    }),
  );
  return [
    ...ownTests,
    ...(suite.suites ?? []).flatMap((child) => collectTests(child, titles, file)),
  ];
}

async function main(): Promise<void> {
  const input = resolve(process.env.PLAYWRIGHT_JSON_REPORT ?? 'test-results/results.json');
  const output = resolve(process.env.QUALITY_REPORT_OUTPUT ?? 'quality-report.json');
  const report = JSON.parse(await readFile(input, 'utf8')) as PlaywrightJsonReport;
  const tests = (report.suites ?? []).flatMap((suite) => collectTests(suite));
  const statuses = tests.map(({ result }) => result.status ?? 'unknown');
  const durations = tests
    .map(({ result }) => result.duration)
    .filter((duration): duration is number => typeof duration === 'number');
  const executedFiles = new Set(
    tests
      .filter(({ result }) => result.status !== 'skipped')
      .map(({ file }) => file.replaceAll('\\', '/').split('/').at(-1) ?? ''),
  );
  const endpointsTested = [
    ...new Set([...executedFiles].flatMap((file) => endpointByFile[file] ?? [])),
  ].sort();
  const knownLocations = ['Nairobi', 'London', 'New York', 'Singapore', 'Sydney'];
  const locationsTested = knownLocations.filter((location) =>
    tests.some(({ title, result }) => result.status === 'passed' && title.includes(location)),
  );
  const errors = tests.flatMap(({ result }) => result.errors ?? []);

  const summary = {
    generatedAt: new Date().toISOString(),
    source: input,
    totalTests: tests.length,
    passed: statuses.filter((status) => status === 'passed').length,
    failed: statuses.filter((status) => status === 'failed' || status === 'timedOut').length,
    skipped: statuses.filter((status) => status === 'skipped').length,
    averageTestDurationMs:
      durations.length > 0
        ? Math.round(durations.reduce((sum, duration) => sum + duration, 0) / durations.length)
        : null,
    p95TestDurationMs: percentile(durations, 95) ?? null,
    endpointsTested,
    locationsTested,
    schemaViolations: errors.filter(({ message }) =>
      message?.includes('Contract validation failed'),
    ).length,
    dataQualityViolations: errors.filter(({ message }) =>
      message?.includes('Weather data-quality validation failed'),
    ).length,
    crossProviderComparisons: tests.reduce(
      (count, { result }) =>
        count +
        (result.attachments ?? []).filter(({ name }) => name === 'cross-provider-comparison.json')
          .length,
      0,
    ),
  };

  await writeFile(output, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  console.info(`Quality summary generated at ${output}`);
}

await main();
