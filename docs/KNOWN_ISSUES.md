# WeatherAI Observed Issues Register

These items record low-volume observations from 2026-08-19 against the public WeatherAI API. They
are evidence, not invented requirements, and should be rechecked when the provider publishes a
versioned contract or announces a fix. No response body, credential, or account identifier is
stored here.

| ID         | Observed behavior                                                                   | Documented or domain expectation                                                | Risk                                                           | Automated evidence                                                              | Status               |
| ---------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------- |
| WAI-KI-001 | Successful responses omitted all three `X-RateLimit-*` headers.                     | Documentation shows limit, remaining, and Unix reset headers.                   | Consumers cannot monitor quota or reset timing from responses. | Smoke validation requires a complete valid set when any header appears.         | Open                 |
| WAI-KI-002 | Coordinates outside geographic bounds returned `502` with a generic upstream error. | Invalid client coordinates should not surface as an upstream/server failure.    | Callers may trigger inappropriate retries or service alerts.   | Parameter tests assert the dated status and safe error body.                    | Open                 |
| WAI-KI-003 | Empty latitude or longitude was coerced to zero and returned `200`.                 | Coordinates are documented as floats; an empty value is not a valid coordinate. | Silent coercion can return weather for the wrong location.     | Parameter tests assert the observed zero-coordinate response.                   | Open                 |
| WAI-KI-004 | `days=0`, `-1`, `999`, and text normalized to `7`, `1`, `7`, and `7`.               | The documented plan range starts at one and expects an integer.                 | Silent normalization can conceal integration defects.          | Parameter tests preserve every observed normalization.                          | Open                 |
| WAI-KI-005 | A seven-day response contained seven daily rows but only 48 hourly rows.            | The hourly endpoint accepts `days`, but docs do not define exact row count.     | Consumers may incorrectly assume `24 × days`.                  | Quality checks require chronology and horizon inclusion, not an invented count. | Clarification needed |

## Triage guidance

- Reproduce with `ai=false` and the smallest safe request count.
- Do not loosen unrelated assertions to accommodate a known issue.
- When behavior changes, attach a real test result, update the relevant expectation, and record the
  verification date.
- Do not deliberately exhaust quota to reproduce `429` in the shared/public environment.
