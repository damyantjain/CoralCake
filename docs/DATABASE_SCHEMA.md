# Database Schema Documentation

This document describes the required database schema for CoralCake's Phase 2 features.

## Tables

### `feedback` (NEW - Phase 2)

Stores human feedback for LLM responses.

**Purpose**: Persist user ratings and feedback for specific run/model combinations to enable feedback analytics and quality tracking over time.

**Schema**:

```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  model TEXT NOT NULL,
  thumbs TEXT CHECK (thumbs IN ('up', 'down')),
  stars INTEGER CHECK (stars >= 1 AND stars <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, run_id, model)
);

-- Index for efficient queries
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_run_id ON feedback(run_id);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);
```

**Row-Level Security (RLS)**:

```sql
-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users can only read their own feedback
CREATE POLICY "Users can read own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own feedback
CREATE POLICY "Users can update own feedback"
  ON feedback FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own feedback
CREATE POLICY "Users can delete own feedback"
  ON feedback FOR DELETE
  USING (auth.uid() = user_id);
```

**Column Descriptions**:

- `id`: Primary key (UUID)
- `user_id`: Foreign key to auth.users table, identifies who gave the feedback
- `run_id`: Foreign key to runs table, identifies which run this feedback is for
- `model`: The specific model being rated (e.g., "gpt-4o", "mistral-small")
- `thumbs`: Optional thumbs up/down rating ('up' or 'down')
- `stars`: Optional 1-5 star rating
- `comment`: Optional text comment (for future use)
- `created_at`: Timestamp when feedback was first created
- `updated_at`: Timestamp when feedback was last updated

**Constraints**:

- Unique constraint on (user_id, run_id, model) ensures only one feedback entry per user/run/model combination
- `thumbs` can only be 'up' or 'down'
- `stars` must be between 1 and 5
- Foreign key cascade on DELETE ensures feedback is removed when user or run is deleted

## Existing Tables (Reference)

### `runs`

Stores metadata about each LLM comparison run.

```sql
-- Simplified schema (existing)
CREATE TABLE runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  prompt TEXT NOT NULL,
  models TEXT[] NOT NULL,
  metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `run_outputs`

Stores the actual text responses from each model.

```sql
-- Simplified schema (existing)
CREATE TABLE run_outputs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  model TEXT NOT NULL,
  output TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Migration Instructions

To apply these schema changes to your Supabase project:

1. **Via Supabase Dashboard**:
   - Go to SQL Editor in your Supabase project
   - Copy the CREATE TABLE and RLS policy SQL from above
   - Execute the SQL commands

2. **Via Supabase CLI** (if using migration files):
   ```bash
   supabase migration new add_feedback_table
   # Add the SQL from above to the generated migration file
   supabase db push
   ```

3. **Verification**:
   After applying the migration, verify:
   ```sql
   -- Check table exists
   SELECT * FROM information_schema.tables WHERE table_name = 'feedback';
   
   -- Check RLS is enabled
   SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'feedback';
   
   -- Check policies exist
   SELECT * FROM pg_policies WHERE tablename = 'feedback';
   ```

## API Integration

The following API endpoints work with this schema:

- `POST /api/feedback` - Save or update feedback
- `GET /api/feedback?runId={runId}` - Retrieve feedback for a specific run

See the API route implementations in `src/app/api/feedback/route.ts` for details.

## Future Enhancements

Potential schema additions for future phases:

1. **Feedback aggregation view**:
   ```sql
   CREATE VIEW feedback_stats AS
   SELECT 
     model,
     COUNT(*) as total_ratings,
     AVG(stars) as avg_stars,
     SUM(CASE WHEN thumbs = 'up' THEN 1 ELSE 0 END) as thumbs_up,
     SUM(CASE WHEN thumbs = 'down' THEN 1 ELSE 0 END) as thumbs_down
   FROM feedback
   WHERE stars IS NOT NULL OR thumbs IS NOT NULL
   GROUP BY model;
   ```

2. **Third-party validator results table**:
   ```sql
   CREATE TABLE validator_results (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID NOT NULL REFERENCES auth.users(id),
     run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
     model TEXT NOT NULL,
     validator_name TEXT NOT NULL, -- 'ragas', 'trulens', etc.
     metrics JSONB NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

## Notes

- All tables use RLS (Row-Level Security) to ensure users can only access their own data
- Timestamps are stored in UTC with timezone support (TIMESTAMPTZ)
- JSONB is used for flexible metric storage
- UUIDs are used for all primary keys for security and scalability
