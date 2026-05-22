# Database Schema

The canonical schema lives in [`supabase/migrations/0001_initial_schema.sql`](../supabase/migrations/0001_initial_schema.sql). To bootstrap a new Supabase project, paste that file into the SQL editor in Supabase Studio and run it once. The file is idempotent — safe to re-run if you only got partway through.

This document describes what's in that file, table by table, and is updated whenever the migration changes.

## Tables

### `runs`

One row per LLM comparison executed via `/api/run`.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID | PK |
| `user_id` | UUID | FK → `auth.users(id)`, cascade delete |
| `prompt` | TEXT | The prompt text |
| `models` | TEXT[] | Models selected for the run |
| `metrics` | JSONB | Per-model latency, tokens, cost, evaluation scores |
| `benchmark_id` | UUID | FK → `benchmarks(id)`, nullable, `ON DELETE SET NULL`. Back-link to the benchmark created at save time. |
| `created_at` | TIMESTAMPTZ | Default `NOW()` |

Indexed on `user_id`, `created_at DESC`, and `benchmark_id`. RLS: owner-only for all operations.

### `run_outputs`

Per-model response text. Kept separate from `runs.metrics` because the bodies can be large.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID | PK |
| `run_id` | UUID | FK → `runs(id)`, cascade delete |
| `user_id` | UUID | FK → `auth.users(id)`, cascade delete. Held redundantly for RLS. |
| `model` | TEXT | Model identifier (e.g. `gpt-4o-mini`) |
| `output` | TEXT | Response text |
| `created_at` | TIMESTAMPTZ | Default `NOW()` |

Indexed on `run_id`, `user_id`. RLS: owner-only for all operations.

### `feedback`

Optional thumbs / star / comment per `(user, run, model)`.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID | PK |
| `user_id` | UUID | FK → `auth.users(id)`, cascade delete |
| `run_id` | UUID | FK → `runs(id)`, cascade delete |
| `model` | TEXT | Which model the feedback is for |
| `thumbs` | TEXT | `'up'` or `'down'` (CHECK constraint) |
| `stars` | INTEGER | 1–5 (CHECK constraint) |
| `comment` | TEXT | Optional free text |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

Unique constraint on `(user_id, run_id, model)` — one feedback row per user/run/model. RLS: owner-only.

### `benchmarks`

A re-openable, shareable snapshot of a run. Created automatically by `/api/run`. Phase 2b will add the `is_public` publish toggle UI; the column already exists.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | UUID | PK |
| `slug` | TEXT | Unique, ~10-char URL-safe. Used in `/b/[slug]`. |
| `owner_id` | UUID | FK → `auth.users(id)`, cascade delete |
| `run_id` | UUID | FK → `runs(id)`, cascade delete |
| `prompt` / `system_prompt` / `models` | snapshot | Cached at save time so the benchmark page doesn't need to join through `runs` for the basics. |
| `disagreement_score` | INTEGER | 0–100, computed by `src/lib/evaluation/disagreement.ts`. NULL when fewer than two non-errored responses. |
| `is_public` | BOOLEAN | Default `FALSE`. Phase 2b adds the publish flow. |
| `created_at` | TIMESTAMPTZ | Default `NOW()` |

Indexed on `slug`, `owner_id`, `created_at DESC`, and a partial index on `is_public` where it's `TRUE`. RLS: owner can do anything; anyone can read rows where `is_public = TRUE` (including unauthenticated visitors).

## Applying the schema

1. Open your Supabase project → SQL Editor → New query.
2. Paste the contents of `supabase/migrations/0001_initial_schema.sql`.
3. Run. You should see four tables created in the Table editor: `runs`, `run_outputs`, `feedback`, `benchmarks`.

To verify RLS is on:

```sql
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' AND tablename IN ('runs','run_outputs','feedback','benchmarks');
```

All four should report `rowsecurity = true`.

## Notes

- All primary keys are UUIDs.
- Timestamps are TIMESTAMPTZ (UTC with offset).
- Every table has Row-Level Security enabled. The app's auth identity (`auth.uid()`) is the boundary that every policy compares against.
- The bootstrap file uses `ON DELETE CASCADE` aggressively — deleting a user wipes their runs, outputs, feedback, and benchmarks. Deleting a run wipes its outputs, feedback rows, and benchmark.
