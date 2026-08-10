# GitHub Product Stats to DB Sync

A Ballerina scheduled task that captures a daily snapshot of GitHub
product statistics into the `github_statistics` MySQL database — the data source
for the [GitHub Product Download Stats Dashboard](../../apps/gh-product-download-stats-dashboard).
The schedule is supplied externally by a Choreo Scheduled Task; the program runs
once per invocation via `public function main()`.

All GitHub data is read through the **Engineering Entity REST service** — the
cron makes zero direct GitHub API calls.

## How it works

Each run:

1. Opens a job entry in `sync_job_logs` (status `STARTED`).
2. Reads every active repository from `tracked_repositories` (`is_active = 1`).
3. For each repository, independently:
   - Fetches repo stats (forks/stars/watchers/open issues) and all releases with
     their assets, paginating until done (bounded by `MAX_RELEASE_PAGES`).
   - Fetches clone traffic (soft dependency — see below).
   - Filters release assets by the repo's `asset_prefixes` and sums their
     download counts.
   - Upserts one repo-level row and one row per matching asset, in a single
     transaction.
4. Finalizes the job entry with `SUCCESS`, `PARTIAL_FAILURE`, or `FAILED`, the
   synced/failed counts, and any per-repo error messages.

One repository failing does **not** stop the others — its error is recorded and
the run continues. The process exits non-zero only when the run itself cannot
start (e.g. the repo list cannot be read); a `PARTIAL_FAILURE` still exits zero,
so monitor `sync_job_logs.status` (also surfaced on the dashboard's Overview
page) rather than the task's exit code alone.

## What gets written

| Table | Contents |
| ----- | -------- |
| `repository_daily_snapshots` | One row per repo per day: total filtered download count, forks/stars/watchers/open-issues counts, clone count/uniques. |
| `release_asset_daily_snapshots` | One row per matching release asset per day: tag, name, size, content type, and that asset's own cumulative download count. |
| `sync_job_logs` | One row per run: status, repos synced/failed, timestamps, aggregated error message. |

Writes are idempotent — re-running on the same day updates that day's rows via
`ON DUPLICATE KEY UPDATE` instead of duplicating them, so a failed or repeated
run is always safe to retry.

## Date semantics (read this before consuming the data)

- `snapshot_date` is stamped with the **cron's run date (today)**, matching the
  convention used by the migrated historical data (`resources/migrations` stamps
  legacy rows with `DATE(created_at)`, i.e. the legacy sync date).
- The captured totals are **cumulative counters** as reported by GitHub — and
  since the cron runs early in the UTC day, they effectively represent the state
  as of the **end of the previous day**. GitHub never reports a same-day delta,
  so downstream consumers must treat each row's day-over-day delta as
  "yesterday's real activity, labeled with today's date." (The dashboard backend
  compensates by shifting dates back one day at read time.)
- **Clone traffic** is the one non-cumulative metric: GitHub reports it per-day,
  and the current day's figure is partial until the day closes. The sync
  therefore stores **yesterday's** (the most recent complete day's) clone
  count/uniques. **Caveat:** GitHub's traffic rollup lags UTC midnight by
  several hours, so a run shortly after midnight typically finds no bucket for
  the just-ended day and stores 0 for it. To compensate, every run also
  **backfills** earlier days' snapshot rows from the up-to-14 daily buckets the
  API returns (bucket for day D updates the row with `snapshot_date = D + 1`) —
  whatever one run misses, the next day's run self-heals. Backfill failures are
  soft (logged, never fail the repo sync), and updates target only existing
  rows.

## Asset prefix filtering

`tracked_repositories.asset_prefixes` is a JSON array of filename prefixes
(e.g. `["wso2am-", "wso2apim-"]`). An asset is counted if its name starts with
**any** listed prefix; an empty array `[]` means *count every asset*.

This exists because a single GitHub release often carries files that should not
be counted as one product — sub-distributions, companion components, checksums.
Beware: matching is exact `startsWith()` with **no fallback** — a wrong prefix
silently records 0 downloads forever, with no error anywhere. Verify prefixes
against the repo's real release asset names (across its full history, not just
the latest release) before seeding.

## Failure model

| Fetch | On failure |
| ----- | ---------- |
| Repo stats (`getRepository`) | Fails that repo's sync for this run. |
| Releases + assets (`getAllReleases`) | Fails that repo's sync for this run. |
| Clone traffic (`getClonesTraffic`) | Soft — logs a warning, stores 0 (requires `Administration:read` on the PAT). |

## Project structure

| Path | Description |
| ---- | ----------- |
| `main.bal` | Entry point and sync orchestration (`run`, `syncRepository`, date/prefix helpers). |
| `modules/database` | MySQL client (TLS required), query builders, upsert functions, and types. |
| `modules/entity` | Engineering Entity REST client and the GitHub stats fetch functions. |
| `resources/database/base_schema_v1.0.0.sql` | Baseline schema (legacy tables). |
| `resources/database/table_update_v1.0.1.sql` | Current snapshot tables (`tracked_repositories`, `repository_daily_snapshots`, `release_asset_daily_snapshots`, `sync_job_logs`). |
| `resources/migrations/000001_seed_tracked_repositories.sql` | Seeds the tracked repo list with verified asset prefixes (idempotent). |
| `resources/migrations/000002_migrate_legacy_data.sql` | Full legacy-data migration into the snapshot tables, with diagnostics and validation queries. |
| `resources/migrations/000003_pilot_migrate_legacy_data.sql` | Date-range-scoped variant of 000002 for batched/pilot migration runs. |

## Configuration

Copy `Config.toml.local` to `Config.toml` and fill in the values (`Config.toml`
is git-ignored — never commit real credentials):

| Key group | Purpose |
| --------- | ------- |
| `gh_product_stats_db_sync.database` | Connect timeout. |
| `...database.databaseConfig` | MySQL host, port, user, password, database. |
| `...database.databaseConfig.connectionPool` | Pool sizing (max open, min idle, max lifetime). |
| `gh_product_stats_db_sync.entity` | Engineering Entity base URL. |
| `...entity.oauthConfig` | OAuth2 client credentials + token URL (Choreo Connection). |
| `...entity.retryConfig` | HTTP retry count/interval/backoff for Entity calls. |

The MySQL client connects with `SSL_REQUIRED` — the target server must support
TLS.

## Build and run

```bash
bal build
bal run
```

> **Note:** This package builds on Ballerina distribution `2201.13.4`. Run
> `bal dist use 2201.13.4` before building if a different distribution is active.

## Deployment

Deployed as a **Choreo Scheduled Task**. Schedule it **once daily, early in the
UTC day** (e.g. ~00:30 UTC) — the date semantics above assume this: running
early keeps the cumulative totals coherent with the snapshot date. Clone
figures for the just-ended day are usually not yet published by GitHub at that
hour; they arrive via the next run's backfill (see Date semantics above). Configuration values come from Choreo's
Configs & Secrets, mirroring `Config.toml.local`; ensure the database user is
granted access from Choreo's egress IP range.
