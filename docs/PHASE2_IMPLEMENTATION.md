# Phase 2 Implementation Guide

This document provides a complete guide to the Phase 2 features implemented in CoralCake.

## Overview

Phase 2 completes the Response Quality Evaluation system with:

1. ✅ **Feedback Persistence** - Save user ratings to database
2. ✅ **Third-Party Validators** - RAGAS and TruLens integration
3. ✅ **API Endpoints** - RESTful endpoints for feedback and validation
4. ✅ **Documentation** - Complete schema and usage docs

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CoralCake                             │
│                                                               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │   Runner UI  │───▶│   /api/run   │───▶│   Supabase   │  │
│  │   (Client)   │    │   (Server)   │    │   Database   │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│         │                                          ▲          │
│         │ Feedback                                 │          │
│         ▼                                          │          │
│  ┌──────────────┐    ┌──────────────┐            │          │
│  │  Feedback    │───▶│ /api/feedback│────────────┘          │
│  │   Buttons    │    │              │                        │
│  └──────────────┘    └──────────────┘                        │
│         │                                                     │
│         │ Validation                                          │
│         ▼                                                     │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Validator   │───▶│ /api/validate│───▶│    RAGAS     │  │
│  │  Component   │    │              │    │   Service    │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                           ┌──────────────┐  │
│                                           │   TruLens    │  │
│                                           │   Service    │  │
│                                           └──────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Component Changes

### 1. Feedback Persistence

#### API Endpoint: `/api/feedback`

**POST** - Save or update feedback

```typescript
// Request
{
  runId: string;      // UUID of the run
  model: string;      // Model name (e.g., "gpt-4o")
  thumbs?: 'up' | 'down';
  stars?: number;     // 1-5
  comment?: string;   // Optional text
}

// Response
{
  ok: true,
  created?: boolean,  // true if new feedback
  updated?: boolean   // true if existing feedback updated
}
```

**GET** - Retrieve feedback for a run

```typescript
// Query: ?runId={uuid}
// Response
{
  feedback: Array<{
    id: string;
    run_id: string;
    model: string;
    thumbs?: 'up' | 'down';
    stars?: number;
    comment?: string;
    created_at: string;
    updated_at: string;
  }>
}
```

#### Database Schema

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

-- RLS policies ensure users only see their own feedback
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
```

See `docs/DATABASE_SCHEMA.md` for complete schema and RLS policies.

#### UI Integration

**Before** (runner page):
```typescript
function handleFeedback(model: string, thumbs: 'up' | 'down', stars?: number) {
  console.log(`Feedback for ${model}:`, { thumbs, stars });
}
```

**After** (runner page):
```typescript
const [runId, setRunId] = useState<string | null>(null);

async function handleFeedback(model: string, thumbs: 'up' | 'down', stars?: number) {
  if (!runId) return;
  
  await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ runId, model, thumbs, stars }),
  });
}
```

**Key Changes**:
1. Track `runId` returned from `/api/run`
2. Pass `runId` to `FeedbackButtons` component
3. Call `/api/feedback` API on user interaction
4. Handle errors gracefully

### 2. Third-Party Validators

#### Validator Framework

Located in `src/lib/validators/`:

```
validators/
├── types.ts          # TypeScript interfaces
├── ragas.ts          # RAGAS integration
├── trulens.ts        # TruLens integration
├── index.ts          # Registry and utilities
└── README.md         # Usage documentation
```

#### API Endpoint: `/api/validate`

**GET** - List available validators

```typescript
// Response
{
  validators: Array<{
    name: string;           // "ragas", "trulens"
    available: boolean;     // true if service configured
    mode: "service" | "demo"
  }>
}
```

**POST** - Run validation

```typescript
// Request (single validator)
{
  prompt: string;
  response: string;
  context?: string | string[];  // Optional context for RAG
  validator: "ragas" | "trulens"
}

// Request (all validators)
{
  prompt: string;
  response: string;
  context?: string | string[];
}

// Response
{
  results: {
    ragas: {
      validator: "ragas",
      overall_score: 85,       // 0-100
      metrics: {
        faithfulness: 0.92,
        answer_relevancy: 0.88,
        context_precision: 0.75
      },
      timestamp: "2025-01-15T12:00:00Z",
      notes: "Demo mode | Evaluated by RAGAS service"
    },
    trulens: { ... }
  }
}
```

#### Validator Modes

**Demo Mode** (Default):
- No external dependencies
- Simulated metrics based on heuristics
- Useful for development and testing
- Automatically used if no endpoint configured

**Production Mode**:
- Calls real RAGAS/TruLens services
- Accurate evaluation metrics
- Requires service endpoint configuration
- Set via environment variables

#### Integration Examples

**Using Demo Mode** (No setup required):

```typescript
import { runValidation } from '@/lib/validators';

const result = await runValidation(
  'ragas',
  'What is quantum computing?',
  'Quantum computing uses quantum bits...'
);

console.log(`Score: ${result.overall_score}/100`);
// Output: Score: 78/100 (demo mode)
```

**Using Production Mode**:

```bash
# .env.local
RAGAS_ENDPOINT=http://localhost:8000/evaluate
RAGAS_API_KEY=your_api_key_here
```

```typescript
const result = await runValidation(
  'ragas',
  'What is quantum computing?',
  'Quantum computing uses quantum bits...',
  ['Context about quantum mechanics...'],
  { apiKey: process.env.RAGAS_API_KEY }
);

console.log(`Score: ${result.overall_score}/100`);
// Output: Score: 92/100 (real evaluation)
```

## Deployment Guide

### Step 1: Database Migration

Apply the feedback table schema:

```sql
-- Via Supabase Dashboard SQL Editor
-- Copy SQL from docs/DATABASE_SCHEMA.md and execute
```

Or use Supabase CLI:

```bash
supabase migration new add_feedback_table
# Add SQL to generated migration file
supabase db push
```

### Step 2: Environment Variables (Optional)

For production validator integration:

```bash
# .env.local or deployment environment
RAGAS_ENDPOINT=https://your-ragas-service.com/evaluate
RAGAS_API_KEY=your_ragas_api_key

TRULENS_ENDPOINT=https://your-trulens-service.com/evaluate
TRULENS_API_KEY=your_trulens_api_key
```

### Step 3: Validator Service Setup (Optional)

See `src/lib/validators/README.md` for detailed setup instructions:

- Python microservice deployment
- Docker container setup
- Cloud service configuration

### Step 4: Deploy CoralCake

```bash
npm run build
npm run start
```

Or deploy to Vercel/other platforms as usual.

## Testing

### Manual Testing

1. **Test Feedback Persistence**:
   ```bash
   # Run a prompt comparison
   # Click thumbs up/down on a result
   # Check network tab for POST /api/feedback
   # Verify 200 response with {ok: true}
   ```

2. **Test Validators (Demo Mode)**:
   ```bash
   curl -X POST http://localhost:3000/api/validate \
     -H "Content-Type: application/json" \
     -H "Cookie: auth-token=..." \
     -d '{
       "prompt": "What is AI?",
       "response": "AI is artificial intelligence...",
       "validator": "ragas"
     }'
   ```

3. **Test Validator Availability**:
   ```bash
   curl http://localhost:3000/api/validate
   # Should return list of validators and their availability
   ```

### Integration Testing

```typescript
// Test feedback API
const feedbackRes = await fetch('/api/feedback', {
  method: 'POST',
  body: JSON.stringify({
    runId: 'test-run-id',
    model: 'gpt-4o',
    thumbs: 'up',
    stars: 5
  })
});
expect(feedbackRes.ok).toBe(true);

// Test validation API
const validateRes = await fetch('/api/validate', {
  method: 'POST',
  body: JSON.stringify({
    prompt: 'test',
    response: 'test response',
    validator: 'ragas'
  })
});
const data = await validateRes.json();
expect(data.result.overall_score).toBeGreaterThan(0);
```

## Monitoring

### Feedback Metrics

Query feedback statistics:

```sql
-- Average ratings per model
SELECT 
  model,
  AVG(stars) as avg_stars,
  COUNT(*) as total_ratings,
  SUM(CASE WHEN thumbs = 'up' THEN 1 ELSE 0 END) as thumbs_up,
  SUM(CASE WHEN thumbs = 'down' THEN 1 ELSE 0 END) as thumbs_down
FROM feedback
WHERE stars IS NOT NULL OR thumbs IS NOT NULL
GROUP BY model;
```

### Validator Usage

Monitor validator API calls:

- Check response times for `/api/validate`
- Track demo vs. production mode usage
- Monitor error rates for validator services

## Troubleshooting

### Issue: Feedback not saving

**Symptoms**: No error, but feedback not persisted

**Solutions**:
1. Check RLS policies are correctly applied
2. Verify user is authenticated
3. Check `runId` is valid UUID
4. Check database logs for constraint violations

### Issue: Validators always in demo mode

**Symptoms**: Notes field says "Demo mode"

**Solutions**:
1. Verify environment variables are set:
   ```bash
   echo $RAGAS_ENDPOINT
   echo $TRULENS_ENDPOINT
   ```
2. Check validator service is running:
   ```bash
   curl http://localhost:8000/health
   ```
3. Check network connectivity from CoralCake to validator

### Issue: Validation takes too long

**Symptoms**: Requests timeout or take >10s

**Solutions**:
1. Use async validation and show loading state
2. Cache validation results
3. Optimize validator service performance
4. Run validators in parallel for bulk requests

## Performance Considerations

### Feedback API

- **Upsert logic**: Checks for existing feedback before insert
- **RLS overhead**: Minimal impact with proper indexing
- **Latency**: ~50-100ms for POST request

### Validation API

- **Demo mode**: ~10-50ms (heuristic calculation)
- **Production mode**: ~500-2000ms (depends on validator service)
- **Recommendation**: Run validation async, show results when ready

### Database Queries

Ensure proper indexes exist:

```sql
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_run_id ON feedback(run_id);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);
```

## Future Enhancements

### Feedback Analytics Dashboard

```typescript
// GET /api/feedback/stats
{
  byModel: {
    "gpt-4o": { avg_stars: 4.5, thumbs_up: 120, thumbs_down: 10 },
    "gpt-4o-mini": { avg_stars: 4.2, thumbs_up: 95, thumbs_down: 15 }
  },
  trends: [
    { date: "2025-01-01", avg_stars: 4.3 },
    { date: "2025-01-02", avg_stars: 4.5 }
  ]
}
```

### Batch Validation

```typescript
// POST /api/validate/batch
{
  items: [
    { prompt: "...", response: "..." },
    { prompt: "...", response: "..." }
  ],
  validator: "ragas"
}
```

### Validator Result Persistence

Store validation results in database for historical analysis:

```sql
CREATE TABLE validator_results (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  run_id UUID REFERENCES runs(id),
  model TEXT,
  validator_name TEXT,
  metrics JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Support

- **Database Issues**: Check `docs/DATABASE_SCHEMA.md`
- **Validator Setup**: Check `src/lib/validators/README.md`
- **API Reference**: Check `docs/EVALUATION_GUIDE.md`
- **General Help**: Open GitHub issue

## References

- [Database Schema Documentation](./DATABASE_SCHEMA.md)
- [Validator Integration Guide](../src/lib/validators/README.md)
- [Evaluation User Guide](./EVALUATION_GUIDE.md)
- [RAGAS Documentation](https://docs.ragas.io/)
- [TruLens Documentation](https://www.trulens.org/)
