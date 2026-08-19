# WeatherAI AtmosGuard Test Strategy

## Objectives

Provide fast evidence that WeatherAI's documented REST surface is reachable, correctly protected,
structurally stable, meteorologically plausible, internally consistent, and sufficiently responsive
for candidate-defined quality gates. Preserve shared API and AI quota while keeping higher-volume
tools available for explicitly authorized use.

## Scope

In scope: `/v1/weather`, `/v1/forecast`, `/v1/current`, `/v1/daily`, `/v1/hourly`,
`/v1/forecast14`, `/v1/usage`, WeatherClient support for `/v1/weather-geo`, authentication,
plan-aware authorization, coordinates, days, units, documented language examples, contracts,
weather-domain data quality, endpoint consistency, Open-Meteo comparison, latency, monitoring,
reporting, and controlled k6 profiles.

Out of scope: browser UI, dashboard flows, destructive quota exhaustion, billing callables, SMS,
webhooks, forestry image analysis, and production-scale load without authorization.

## System under test

- Base URL: `https://api.weather-ai.co`
- Authentication: `Authorization: Bearer <WeatherAI key>`
- Plans: Free, Pro, Scale; test behavior is selected by `WEATHER_AI_PLAN`
- Reference service: Open-Meteo current fields, queried independently with location-local timezone

## Functional test approach

Playwright `APIRequestContext` is wrapped by one typed `WeatherClient` and supplied by an extended
fixture. Nairobi, London, New York, Singapore, and Sydney drive parameterized coverage. The default
is `ai=false`, metric units, and low forecast horizons. The suite checks 1- and 7-day requests,
imperial conversion, the forecast alias, current/daily/hourly handlers, and optional AI language
examples. Candidate-defined response budgets are configuration, not statements about provider SLA.

## Contract test approach

Ajv validates schemas modeled from documented and sampled responses. Required stable fields and
primitive constraints are enforced; additional properties remain allowed. `ai_summary` is required
but its value shape is deliberately open because the documentation does not guarantee one. Main,
delegated, usage, and error responses are covered. Contract errors include all Ajv violations.

## Negative testing

Missing, empty, malformed, and invalid authorization values must return documented `401` behavior.
Error bodies must not contain stack traces, credential-shaped values, node paths, or obvious backend
implementation detail. `/v1/forecast14` expects `403` only for a configured Free key and expects
success for Pro/Scale, avoiding a plan-invalid assumption.

## Boundary testing

Exact latitude values -90, 0, and 90 and longitude values -180, 0, and 180 are accepted. Missing
and alphabetic coordinates are rejected. Out-of-range and empty values, plus zero/negative/text/
oversized day values, assert observed behavior documented in the README. Valid `days=1` and
`days=7` are covered functionally.

## Weather data-quality approach

After schema validation, pure domain rules check:

- every nested numeric value is finite;
- echoed coordinates and valid requested horizon are consistent;
- daily record count matches the valid requested horizon;
- min temperature does not exceed max;
- precipitation and wind speed are non-negative;
- humidity/cloud/probability ranges and positive pressure apply only when fields exist;
- current/hourly/daily timestamps parse and series are chronological;
- returned hourly dates fall within the returned daily range.

The suite does not assert volatile weather values exactly or invent fields absent from the API.

## Independent accuracy comparison

WeatherAI and Open-Meteo are queried concurrently at identical coordinates, metric units, and local
timezone. Absolute deviations are calculated for temperature and wind; humidity is conditional on a
matching WeatherAI field. Candidate-defined tolerances identify divergence worth investigation.
Open-Meteo is an independent signal, not authoritative truth, and model disagreement can be valid.

## Performance approach

k6 owns performance execution. The automatic smoke uses one VU and exactly one iteration with
status/integrity checks, failure-rate threshold, and p95/p99 budgets. Load, stress, and spike are
short, bounded profiles but require `ALLOW_HIGH_VOLUME=true` in addition to a key. They must be run
only with owner approval and quota. No automatic `429` test intentionally spends the monthly quota.

## Availability and monitoring approach

A daily cron at 05:17 UTC invokes only `tests/monitoring/uptime.spec.ts`. It makes one Nairobi,
one-day, non-AI request and checks reachability, minimal response integrity, and the monitoring
budget. This is synthetic availability evidence, not a contractual SLA measurement.

## CI/CD and reporting

Pushes to `main`, pull requests, and manual dispatch run npm deterministic install, lint, strict
type checking, separate safe suites, merged Playwright reporting, evidence-based summary generation,
and k6 smoke. HTML, JUnit XML, JSON, and the summary are artifacts. Main publishes HTML through
GitHub Pages. Forks without secrets execute static checks and skip live calls without printing a key.

## Risks and mitigations

| Risk                          | Mitigation                                                                  |
| ----------------------------- | --------------------------------------------------------------------------- |
| Shared quota exhaustion       | `ai=false`, small datasets, daily single-call monitoring, guarded load      |
| Dynamic forecast flakiness    | invariants, stable-field comparison, explicit tolerances                    |
| Provider transient failures   | bounded retry only for 500/503; attempts recorded                           |
| Contract brittleness          | stable required fields; additional properties allowed                       |
| Secret disclosure             | ignored `.env`, GitHub Secrets, no request-header logging, redacting logger |
| Plan-dependent false failures | explicit `WEATHER_AI_PLAN` branch                                           |
| Reference-provider outage     | clear independent-call failure, no claim of ground truth                    |
| Public PR secret absence      | static checks run; live steps are safely skipped                            |

## Assumptions

- The configured key is valid and its plan matches `WEATHER_AI_PLAN`.
- Echoed coordinates use sufficient precision for 0.0001-degree comparison.
- Open-Meteo and WeatherAI metric wind speed can be aligned as km/h.
- Provider-local timestamp strings can be aligned after requesting `timezone=auto` from Open-Meteo.

## Limitations

There is no destructive 429 proof, no default AI-quota consumption, no long-running accuracy
baseline, no dedicated multi-plan CI matrix, and no guarantee that an external weather model will
match WeatherAI. Observed inconsistencies are evidence dated 2026-08-19 and should be re-evaluated
when the API publishes a versioned contract.
