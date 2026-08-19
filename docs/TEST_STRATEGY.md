# WeatherAI AtmosGuard Test Strategy

## Objectives

Provide fast evidence that WeatherAI's documented REST surface is reachable, correctly protected,
structurally stable, meteorologically plausible, internally consistent, and sufficiently responsive
for candidate-defined quality gates. Preserve shared API and AI quota while keeping higher-volume
tools available for explicitly authorized use.

## Scope

In scope: `/v1/weather`, `/v1/forecast`, `/v1/current`, `/v1/daily`, `/v1/hourly`,
`/v1/forecast14`, `/v1/usage`, `/v1/weather-geo`, authentication, plan-aware authorization,
coordinates, days, units, documented language examples, contracts, weather-domain data quality,
endpoint consistency, Open-Meteo comparison, latency, monitoring, reporting, and controlled k6
profiles.

Out of scope: browser UI, dashboard flows, destructive quota exhaustion, billing callables, SMS,
webhooks, forestry image analysis, and production-scale load without authorization.

## System under test

- Base URL: `https://api.weather-ai.co`
- Authentication: `Authorization: Bearer <WeatherAI key>`
- Plans: Free, Pro, Scale; test behavior is selected by `WEATHER_AI_PLAN`
- Reference service: Open-Meteo current fields queried with location-local timezone

## Functional test approach

Playwright `APIRequestContext` is wrapped by one typed `WeatherClient` and supplied by an extended
fixture. Nairobi, London, New York, Singapore, and Sydney drive parameterized coverage. The default
is `ai=false`, metric units, and low forecast horizons. Coverage includes 1- and 7-day requests,
imperial conversion, the forecast alias, current/daily/hourly handlers, a deterministic
`weather-geo` coordinate override, usage semantics, and opt-in AI language examples.
Candidate-defined response budgets are configuration, not provider SLAs.
They are deliberately conservative regression guards that separate severe degradation from normal
Internet and shared-runner variance rather than reproducing plan-specific marketing thresholds.

## Contract test approach

Ajv validates schemas modeled from documented and sampled responses. Required stable fields and
primitive constraints are enforced; additional properties remain allowed. `ai_summary` is required
but its value shape is open because the documentation does not guarantee one. Main, delegated,
usage, and error responses are covered. Usage checks additionally require the returned plan to match
`WEATHER_AI_PLAN`, non-negative counters, and `remaining <= limit` for a limited plan. Contract
errors include every Ajv violation.

## Negative testing

Missing, empty, malformed, and invalid authorization values must return documented `401` behavior.
All authentication, parameter-error, upstream-error, and plan-error bodies pass the common safe
error validator. It rejects empty errors, stack traces, credential-shaped values, node paths, and
obvious backend implementation detail. `/v1/forecast14` expects `403` only for a configured Free
key and success for Pro/Scale; it does not depend on brittle prose in the error message.

## Boundary testing

Exact latitude values -90, 0, and 90 and longitude values -180, 0, and 180 are accepted. Missing
and alphabetic coordinates are rejected. Out-of-range and empty values, plus zero, negative, text,
and oversized day values assert dated observed behavior. Valid `days=1` and `days=7` are covered
functionally. Discrepancies remain visible in [KNOWN_ISSUES.md](KNOWN_ISSUES.md).

## Weather data-quality approach

After schema validation, pure domain rules check:

- every nested numeric value is finite;
- echoed coordinates and requested horizon are consistent;
- daily record count matches a valid requested horizon;
- minimum temperature does not exceed maximum;
- precipitation and wind speed are non-negative;
- humidity, cloud, probability, and pressure constraints apply only when fields exist;
- current, hourly, and daily timestamps parse and series are chronological;
- returned hourly dates fall within the returned daily range.

The suite does not assert volatile weather values exactly or invent fields absent from the API.

## Independent accuracy comparison

WeatherAI and Open-Meteo are queried concurrently at identical coordinates, metric units, and local
timezone. Absolute deviations are calculated for temperature and wind; humidity is conditional on a
matching WeatherAI field. Candidate-defined tolerances identify divergence worth investigation.
Open-Meteo is an independent signal, not authoritative truth, and model disagreement can be valid.

## Performance approach

k6 owns performance execution. The automatic smoke uses one VU and one iteration with status,
request-echo, finite-value, wind, and forecast-array checks plus a one-sample maximum-latency gate.
Load, stress, and spike retain p95/p99 budgets and require `ALLOW_HIGH_VOLUME=true` in addition to a
key. Every executed profile emits a profile-specific JSON summary. Manual profiles require API-owner
approval and sufficient quota. The main quality pipeline owns the only automatic k6 request; the
standalone performance workflow is manual-only to prevent duplicate quota use. No automatic `429`
test intentionally spends monthly quota.

## Availability and monitoring approach

A daily cron at 05:17 UTC invokes only `tests/monitoring/uptime.spec.ts`; a path-filtered push trigger
also validates changes to that workflow or test. It makes one Nairobi, one-day, non-AI request and
checks reachability, minimal response integrity, the monitoring budget, and `attempts === 1`. A
recovered `500` or `503` therefore remains a monitoring failure instead of being hidden by the
functional client's retry behavior. This is synthetic evidence, not an SLA.

## CI/CD and reporting

Pushes to `main`, pull requests, and manual dispatch run deterministic installation, formatting,
lint, strict type checking, unit tests, separate safe suites, exact blob-set verification, merged
Playwright reporting, evidence-based summary generation, and k6 smoke. With a key, eight blob files
must exist: unit plus seven live suite reports. Without a secret, CI still merges and uploads unit
evidence. HTML, JUnit XML, Playwright JSON, quality JSON, and k6 JSON are artifacts.

Playwright retries once in CI for diagnostic evidence, but `failOnFlakyTests` makes every recovered
retry fail the workflow. The custom summary classifies passed, flaky, failed, and skipped tests,
counts retry attempts, and includes errors and attachments from every attempt. Report merging is not
error-suppressed, while downstream evidence publication remains guarded with `always()` conditions.

Main publishes every successfully generated HTML report through GitHub Pages, including reports
containing failed API assertions. The manual `run_ai_tests` checkbox is the only CI path that enables
AI checks.

## Risks and mitigations

| Risk                          | Mitigation                                                          |
| ----------------------------- | ------------------------------------------------------------------- |
| Shared quota exhaustion       | `ai=false`, small datasets, one-call monitoring, guarded load       |
| Dynamic forecast flakiness    | Invariants, stable-field comparison, explicit tolerances            |
| Provider transient failures   | Bounded retry for functional calls; monitoring requires one attempt |
| Contract brittleness          | Stable required fields; additional properties allowed               |
| Secret disclosure             | Ignored `.env`, GitHub Secrets, no header logging, redacting logger |
| Plan-dependent false failures | Explicit `WEATHER_AI_PLAN` branch and semantic usage check          |
| Reference-provider outage     | Clear independent-call failure; no ground-truth claim               |
| Public PR secret absence      | Static/unit checks and unit report still run                        |
| Known provider discrepancies  | Dated evidence and an explicit known-issues register                |

## Assumptions

- The configured key is valid and its plan matches `WEATHER_AI_PLAN`.
- Echoed coordinates retain sufficient precision for a 0.0001-degree comparison.
- Open-Meteo and WeatherAI metric wind speed can be aligned as km/h.
- Provider-local timestamp strings can be aligned after requesting `timezone=auto` from Open-Meteo.

## Limitations

There is no destructive `429` proof, no default AI-quota consumption, no long-running accuracy
baseline, no dedicated multi-plan CI matrix, and no guarantee that an external weather model will
match WeatherAI. Observed inconsistencies are dated 2026-08-19 and should be re-evaluated when the
API publishes a versioned contract. See [KNOWN_ISSUES.md](KNOWN_ISSUES.md).
