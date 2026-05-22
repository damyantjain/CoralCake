-- CoralCake — initial schema (v0.2).
--
-- Apply once to a fresh Supabase project via the SQL editor in Supabase Studio.
-- Idempotent: every CREATE / ALTER uses IF NOT EXISTS, every policy is dropped
-- before being re-created, so re-running this file is safe.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1) runs
--    One row per LLM comparison execution. `benchmark_id` is added later in
--    this same file because `benchmarks.run_id` references this table.
CREATE TABLE IF NOT EXISTS runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  models TEXT[] NOT NULL,
  metrics JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_runs_user_id ON runs(user_id);
CREATE INDEX IF NOT EXISTS idx_runs_created_at ON runs(created_at DESC);

-- 2) run_outputs
--    Per-model response text for a run. Kept separate from runs because the
--    bodies can be large and we sometimes want metrics without text.
CREATE TABLE IF NOT EXISTS run_outputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  output TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_run_outputs_run_id ON run_outputs(run_id);
CREATE INDEX IF NOT EXISTS idx_run_outputs_user_id ON run_outputs(user_id);

-- 3) feedback
--    Optional thumbs / stars / comment per (user, run, model).
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  thumbs TEXT CHECK (thumbs IN ('up', 'down')),
  stars INTEGER CHECK (stars >= 1 AND stars <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, run_id, model)
);
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_run_id ON feedback(run_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedback(created_at DESC);

-- 4) benchmarks
--    A re-openable snapshot of a run with a stable URL slug. Created
--    automatically by /api/run; future Phase 2b adds the publish toggle.
CREATE TABLE IF NOT EXISTS benchmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  system_prompt TEXT,
  models TEXT[] NOT NULL,
  disagreement_score INTEGER CHECK (disagreement_score >= 0 AND disagreement_score <= 100),
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_benchmarks_slug ON benchmarks(slug);
CREATE INDEX IF NOT EXISTS idx_benchmarks_owner_id ON benchmarks(owner_id);
CREATE INDEX IF NOT EXISTS idx_benchmarks_created_at ON benchmarks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_benchmarks_is_public ON benchmarks(is_public) WHERE is_public = TRUE;

-- 5) runs.benchmark_id (back-link, added after benchmarks exists)
ALTER TABLE runs ADD COLUMN IF NOT EXISTS benchmark_id UUID REFERENCES benchmarks(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_runs_benchmark_id ON runs(benchmark_id);

-- ============================================================
-- Row-Level Security
-- ============================================================

ALTER TABLE runs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "runs: owner reads"  ON runs;
DROP POLICY IF EXISTS "runs: owner writes" ON runs;
DROP POLICY IF EXISTS "runs: owner update" ON runs;
DROP POLICY IF EXISTS "runs: owner delete" ON runs;
CREATE POLICY "runs: owner reads"  ON runs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "runs: owner writes" ON runs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "runs: owner update" ON runs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "runs: owner delete" ON runs FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE run_outputs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "run_outputs: owner reads"  ON run_outputs;
DROP POLICY IF EXISTS "run_outputs: owner writes" ON run_outputs;
DROP POLICY IF EXISTS "run_outputs: owner delete" ON run_outputs;
CREATE POLICY "run_outputs: owner reads"  ON run_outputs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "run_outputs: owner writes" ON run_outputs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "run_outputs: owner delete" ON run_outputs FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "feedback: owner reads"  ON feedback;
DROP POLICY IF EXISTS "feedback: owner writes" ON feedback;
DROP POLICY IF EXISTS "feedback: owner update" ON feedback;
DROP POLICY IF EXISTS "feedback: owner delete" ON feedback;
CREATE POLICY "feedback: owner reads"  ON feedback FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "feedback: owner writes" ON feedback FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feedback: owner update" ON feedback FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "feedback: owner delete" ON feedback FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE benchmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "benchmarks: owner and public read" ON benchmarks;
DROP POLICY IF EXISTS "benchmarks: owner insert" ON benchmarks;
DROP POLICY IF EXISTS "benchmarks: owner update" ON benchmarks;
DROP POLICY IF EXISTS "benchmarks: owner delete" ON benchmarks;
-- Owners can always read their own; anyone (auth or not) can read public ones.
CREATE POLICY "benchmarks: owner and public read" ON benchmarks FOR SELECT USING (auth.uid() = owner_id OR is_public = TRUE);
CREATE POLICY "benchmarks: owner insert" ON benchmarks FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "benchmarks: owner update" ON benchmarks FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "benchmarks: owner delete" ON benchmarks FOR DELETE USING (auth.uid() = owner_id);
