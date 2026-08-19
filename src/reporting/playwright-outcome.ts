export type QualityTestOutcome = 'passed' | 'flaky' | 'failed' | 'skipped' | 'unknown';

export interface PlaywrightAttemptLike {
  readonly status?: string;
}

export interface PlaywrightTestLike {
  readonly status?: string;
  readonly results?: readonly PlaywrightAttemptLike[];
}

const FAILURE_STATUSES = new Set(['failed', 'timedOut', 'interrupted']);

export function classifyPlaywrightOutcome(test: PlaywrightTestLike): QualityTestOutcome {
  if (test.status === 'flaky') return 'flaky';
  if (test.status === 'unexpected') return 'failed';
  if (test.status === 'skipped') return 'skipped';
  if (test.status === 'expected') return 'passed';

  const statuses = (test.results ?? []).map(({ status }) => status ?? 'unknown');
  const finalStatus = statuses.at(-1);
  if (finalStatus === 'skipped') return 'skipped';
  if (finalStatus === 'passed') {
    return statuses.slice(0, -1).some((status) => FAILURE_STATUSES.has(status))
      ? 'flaky'
      : 'passed';
  }
  if (finalStatus !== undefined && FAILURE_STATUSES.has(finalStatus)) return 'failed';
  return 'unknown';
}
