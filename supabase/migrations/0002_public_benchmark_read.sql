-- CoralCake — allow reading a run and its run_outputs through a public benchmark.
--
-- The initial schema only lets owners read their runs. That breaks /b/[slug]
-- for anyone who isn't the owner: the benchmark row itself was readable
-- (public read policy on benchmarks), but the linked run/metrics and the
-- per-model outputs came back empty because RLS denied the cross-table read.
--
-- This migration adds SELECT policies on runs and run_outputs that allow a
-- read when a benchmark with the matching run_id has is_public = TRUE.
-- Existing owner policies are preserved.

DROP POLICY IF EXISTS "runs: read via public benchmark" ON runs;
CREATE POLICY "runs: read via public benchmark" ON runs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM benchmarks b
      WHERE b.run_id = runs.id AND b.is_public = TRUE
    )
  );

DROP POLICY IF EXISTS "run_outputs: read via public benchmark" ON run_outputs;
CREATE POLICY "run_outputs: read via public benchmark" ON run_outputs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM benchmarks b
      WHERE b.run_id = run_outputs.run_id AND b.is_public = TRUE
    )
  );
