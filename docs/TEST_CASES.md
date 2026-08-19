# WeatherAI Automated Test Cases

“Observed” expectations are based on low-volume calls made on 2026-08-19. “Opt-in” cases are
implemented but skipped by the safe default. “Manual” k6 profiles require explicit authorization.

| ID      | Category      | Endpoint                      | Test scenario                          | Expected result                                                | Priority | Automated status            |
| ------- | ------------- | ----------------------------- | -------------------------------------- | -------------------------------------------------------------- | -------- | --------------------------- |
| WAI-001 | Smoke         | `/v1/weather`                 | Nairobi, 1 day, `ai=false`             | 200, JSON, stable critical fields, candidate latency budget    | P0       | Yes                         |
| WAI-002 | Headers       | `/v1/weather`                 | Rate-limit headers when exposed        | Complete numeric set; remaining within limit; Unix reset valid | P1       | Yes, conditional            |
| WAI-003 | Functional    | `/v1/weather`                 | Five global coordinates                | 200 and echoed coordinates/metric response                     | P0       | Yes                         |
| WAI-004 | Functional    | `/v1/weather`                 | `days=1`                               | One daily record and response days 1                           | P0       | Yes                         |
| WAI-005 | Functional    | `/v1/weather`                 | `days=7`                               | Seven daily records and response days 7                        | P0       | Yes                         |
| WAI-006 | Functional    | `/v1/forecast`                | Valid Nairobi request                  | 200 with common weather shape                                  | P0       | Yes                         |
| WAI-007 | Functional    | `/v1/current`                 | Nairobi/New York/Sydney                | 200 with current conditions                                    | P0       | Yes                         |
| WAI-008 | Functional    | `/v1/daily`                   | 1- and 7-day horizons                  | 200 with requested daily count                                 | P0       | Yes                         |
| WAI-009 | Functional    | `/v1/hourly`                  | 1- and 7-day requests                  | Non-empty chronological hourly records                         | P0       | Yes                         |
| WAI-010 | Units         | `/v1/weather`                 | Metric vs imperial current temperature | Fahrenheit approximately equals C × 9/5 + 32                   | P1       | Yes                         |
| WAI-011 | AI/language   | `/v1/weather`                 | `ai=true`, `lang=en`                   | 200 and non-null AI summary                                    | P2       | Opt-in                      |
| WAI-012 | AI/language   | `/v1/weather`                 | `ai=true`, `lang=sw`                   | 200 and non-null AI summary                                    | P2       | Opt-in                      |
| WAI-013 | Security      | `/v1/weather`                 | Missing Authorization                  | 401 with safe error body                                       | P0       | Yes                         |
| WAI-014 | Security      | `/v1/weather`                 | Empty Bearer token                     | 401 with safe error body                                       | P0       | Yes                         |
| WAI-015 | Security      | `/v1/weather`                 | Malformed scheme                       | 401 with safe error body                                       | P0       | Yes                         |
| WAI-016 | Security      | `/v1/weather`                 | Invalid key                            | 401; response does not echo token or internals                 | P0       | Yes                         |
| WAI-017 | Authorization | `/v1/forecast14`              | Free-plan key                          | Documented 403 and safe Pro/Scale message                      | P0       | Yes, plan-aware             |
| WAI-018 | Authorization | `/v1/forecast14`              | Pro/Scale key                          | 200 and 14-day common contract                                 | P1       | Yes, plan-aware             |
| WAI-019 | Boundary      | `/v1/weather`                 | Latitude -90, 0, 90                    | 200                                                            | P1       | Yes                         |
| WAI-020 | Boundary      | `/v1/weather`                 | Longitude -180, 0, 180                 | 200                                                            | P1       | Yes                         |
| WAI-021 | Negative      | `/v1/weather`                 | Latitude below/above bounds            | Observed 502 generic upstream error                            | P1       | Yes                         |
| WAI-022 | Negative      | `/v1/weather`                 | Longitude below/above bounds           | Observed 502 generic upstream error                            | P1       | Yes                         |
| WAI-023 | Negative      | `/v1/weather`                 | Alphabetic/missing coordinate          | 400 safe validation error                                      | P0       | Yes                         |
| WAI-024 | Boundary      | `/v1/weather`                 | Empty coordinate                       | Observed coercion to zero and 200                              | P1       | Yes                         |
| WAI-025 | Boundary      | `/v1/weather`                 | Days 0, -1, 999, text                  | Observed normalization to 7, 1, 7, 7                           | P1       | Yes                         |
| WAI-026 | Contract      | Weather handlers              | Main/delegated observed schema         | Ajv validation passes; additions tolerated                     | P0       | Yes                         |
| WAI-027 | Contract      | `/v1/usage`                   | Usage shape                            | Plan/count/limit/remaining/unlimited types valid               | P1       | Yes                         |
| WAI-028 | Contract      | `/v1/weather`                 | Unauthorized error shape               | Non-empty error string contract                                | P0       | Yes                         |
| WAI-029 | Data quality  | `/v1/weather`                 | Five global 7-day forecasts            | Finite values and applicable domain invariants hold            | P0       | Yes                         |
| WAI-030 | Data quality  | `/v1/weather`                 | Daily temperature range                | `temp_min <= temp_max` for every day                           | P0       | Yes                         |
| WAI-031 | Data quality  | `/v1/weather`                 | Timestamp ordering                     | Dates/hours parse, are chronological, and share horizon        | P0       | Yes                         |
| WAI-032 | Consistency   | `/v1/weather`, `/v1/forecast` | Identical parameters                   | Stable structures/values agree within small tolerances         | P0       | Yes                         |
| WAI-033 | Consistency   | `/v1/weather`, `/v1/current`  | Identical location                     | Relevant current values agree within small tolerances          | P0       | Yes                         |
| WAI-034 | Accuracy      | WeatherAI + Open-Meteo        | Nairobi/London/Sydney current values   | Absolute deviations calculated; anomaly tolerances applied     | P1       | Yes                         |
| WAI-035 | Monitoring    | `/v1/weather`                 | Daily minimal synthetic                | Reachable, valid, within candidate monitoring budget           | P0       | Yes, daily                  |
| WAI-036 | Performance   | `/v1/weather`                 | One k6 iteration                       | Checks pass; failure/p95/p99 gates pass                        | P1       | Yes, automatic              |
| WAI-037 | Performance   | `/v1/weather`                 | Bounded load profile                   | Checks and thresholds under low concurrency                    | P2       | Manual + guard              |
| WAI-038 | Performance   | `/v1/weather`                 | Bounded stress profile                 | Controlled ramp exposes degradation point                      | P2       | Manual + guard              |
| WAI-039 | Performance   | `/v1/weather`                 | Bounded spike profile                  | Short spike behavior measured                                  | P2       | Manual + guard              |
| WAI-040 | Quota safety  | `/v1/weather`                 | Exhaust quota to obtain 429            | Not executed against shared/public API                         | P1       | Intentionally not automated |
