-- CoralCake — consolidate SELECT policies on runs and run_outputs.
--
-- 0002 layered a "read via public benchmark" SELECT policy on top of the
-- existing "owner reads" policy. Postgres evaluates every permissive policy
-- per row, so two policies for the same (role, action) is a known
-- performance anti-pattern (Supabase advisor `multiple_permissive_policies`).
--
-- This migration drops both and replaces them with a single OR'd policy on
-- each table. While we're touching them, wrap auth.uid() in a SELECT
-- subquery so Postgres caches the value once per query instead of
-- re-evaluating per row (`auth_rls_initplan` advisor).
--
-- Functional behavior is identical: a row is readable if you own it OR
-- there's a public benchmark referencing it.

DROP POLICY IF EXISTS "runs: owner reads" ON runs;
DROP POLICY IF EXISTS "runs: read via public benchmark" ON runs;
CREATE POLICY "runs: select" ON runs
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM benchmarks b
      WHERE b.run_id = runs.id AND b.is_public = TRUE
    )
  );

DROP POLICY IF EXISTS "run_outputs: owner reads" ON run_outputs;
DROP POLICY IF EXISTS "run_outputs: read via public benchmark" ON run_outputs;
CREATE POLICY "run_outputs: select" ON run_outputs
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
    OR EXISTS (
      SELECT 1 FROM benchmarks b
      WHERE b.run_id = run_outputs.run_id AND b.is_public = TRUE
    )
  );
