# API Reference

Complete API reference for CoralCake endpoints.

## Authentication

All API endpoints require authentication via Supabase auth. The authentication cookie is automatically included in requests from the browser.

**Error Response** (401 Unauthorized):
```json
{
  "error": "Unauthorized"
}
```

---

## Evaluation Endpoints

### POST /api/evaluate

Evaluate response quality using built-in scoring system.

**Request**:
```json
{
  "prompt": "string",
  "response": "string"
}
```

**Response**:
```json
{
  "metrics": {
    "qualityScore": {
      "relevance": 85,
      "coherence": 78,
      "readability": 72,
      "overall": 80
    },
    "sentenceCount": 5,
    "avgSentenceLength": 18.4,
    "wordCount": 92,
    "grammarIssues": []
  }
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid payload
- `401`: Unauthorized
- `500`: Server error

---

### GET /api/evaluate-custom

List available custom evaluation scripts.

**Response**:
```json
{
  "scripts": [
    {
      "id": "lengthCheck",
      "name": "Response Length Check",
      "description": "Checks if response length is appropriate"
    },
    {
      "id": "sentimentPositivity",
      "name": "Sentiment Positivity",
      "description": "Checks if response uses positive language"
    },
    {
      "id": "codePresence",
      "name": "Code Presence Detector",
      "description": "Detects if response contains code snippets"
    }
  ]
}
```

**Status Codes**:
- `200`: Success

---

### POST /api/evaluate-custom

Run custom evaluation script(s) on a response.

**Request** (single script):
```json
{
  "prompt": "string",
  "response": "string",
  "scriptName": "lengthCheck"
}
```

**Request** (all scripts):
```json
{
  "prompt": "string",
  "response": "string"
}
```

**Response** (single script):
```json
{
  "scriptName": "lengthCheck",
  "result": {
    "score": 100,
    "metrics": {
      "responseWords": 45,
      "promptWords": 8,
      "ratio": "5.63"
    },
    "notes": "Length is appropriate"
  }
}
```

**Response** (all scripts):
```json
{
  "results": {
    "lengthCheck": {
      "score": 100,
      "metrics": { ... },
      "notes": "..."
    },
    "sentimentPositivity": {
      "score": 85,
      "metrics": { ... }
    },
    "codePresence": {
      "score": 0,
      "metrics": { ... },
      "notes": "No code detected"
    }
  }
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid payload or unknown script
- `401`: Unauthorized
- `500`: Server error

---

## Feedback Endpoints

### POST /api/feedback

Save or update human feedback for a specific run/model combination.

**Request**:
```json
{
  "runId": "uuid",
  "model": "gpt-4o",
  "thumbs": "up",
  "stars": 5,
  "comment": "Great response!"
}
```

**Fields**:
- `runId` (required): UUID of the run
- `model` (required): Model name
- `thumbs` (optional): "up" or "down"
- `stars` (optional): 1-5
- `comment` (optional): Text comment

**Response** (new feedback):
```json
{
  "ok": true,
  "created": true
}
```

**Response** (existing feedback updated):
```json
{
  "ok": true,
  "updated": true
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid payload or database error
- `401`: Unauthorized
- `500`: Server error

**Constraints**:
- Only one feedback entry per user/run/model combination
- `thumbs` must be "up" or "down"
- `stars` must be 1-5
- Updates existing feedback if already exists

---

### GET /api/feedback

Get all feedback for a specific run.

**Query Parameters**:
- `runId` (required): UUID of the run

**Example**:
```
GET /api/feedback?runId=123e4567-e89b-12d3-a456-426614174000
```

**Response**:
```json
{
  "feedback": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "run_id": "uuid",
      "model": "gpt-4o",
      "thumbs": "up",
      "stars": 5,
      "comment": "Great response!",
      "created_at": "2025-01-15T12:00:00Z",
      "updated_at": "2025-01-15T12:00:00Z"
    }
  ]
}
```

**Status Codes**:
- `200`: Success
- `400`: Missing runId or database error
- `401`: Unauthorized
- `500`: Server error

---

## Validation Endpoints

### GET /api/validate

List available third-party validators and their status.

**Response**:
```json
{
  "validators": [
    {
      "name": "ragas",
      "available": true,
      "mode": "service"
    },
    {
      "name": "trulens",
      "available": false,
      "mode": "demo"
    }
  ]
}
```

**Fields**:
- `name`: Validator identifier
- `available`: Whether service endpoint is configured
- `mode`: "service" (real) or "demo" (simulated)

**Status Codes**:
- `200`: Success
- `500`: Server error

---

### POST /api/validate

Run third-party validation on a response.

**Request** (single validator):
```json
{
  "prompt": "What is quantum computing?",
  "response": "Quantum computing uses quantum bits...",
  "context": ["Quantum mechanics is...", "Superposition allows..."],
  "validator": "ragas"
}
```

**Request** (all validators):
```json
{
  "prompt": "What is quantum computing?",
  "response": "Quantum computing uses quantum bits...",
  "context": ["Quantum mechanics is...", "Superposition allows..."]
}
```

**Fields**:
- `prompt` (required): The question or instruction
- `response` (required): The model's response
- `context` (optional): String or array of context strings (for RAG evaluation)
- `validator` (optional): Specific validator to use

**Response** (single validator):
```json
{
  "validator": "ragas",
  "result": {
    "validator": "ragas",
    "overall_score": 85,
    "metrics": {
      "faithfulness": 0.92,
      "answer_relevancy": 0.88,
      "context_precision": 0.75
    },
    "timestamp": "2025-01-15T12:00:00Z",
    "notes": "Demo mode - using simulated RAGAS metrics"
  }
}
```

**Response** (all validators):
```json
{
  "results": {
    "ragas": {
      "validator": "ragas",
      "overall_score": 85,
      "metrics": {
        "faithfulness": 0.92,
        "answer_relevancy": 0.88,
        "context_precision": 0.75
      },
      "timestamp": "2025-01-15T12:00:00Z",
      "notes": "Demo mode"
    },
    "trulens": {
      "validator": "trulens",
      "overall_score": 82,
      "metrics": {
        "groundedness": 0.90,
        "answer_relevance": 0.85,
        "context_relevance": 0.78,
        "toxicity": 0.02,
        "bias": 0.05,
        "coherence": 0.88
      },
      "timestamp": "2025-01-15T12:00:00Z",
      "notes": "Demo mode"
    }
  }
}
```

**Validator Metrics**:

**RAGAS** (0-1 scale):
- `faithfulness`: Factual accuracy relative to context
- `answer_relevancy`: Relevance of answer to question
- `context_precision`: Relevance of retrieved context
- `context_recall`: Coverage of ground truth
- `context_entity_recall`: Entity recall from context
- `answer_similarity`: Semantic similarity to reference
- `answer_correctness`: Overall correctness

**TruLens** (0-1 scale):
- `groundedness`: Is response grounded in context?
- `answer_relevance`: Relevance to the question
- `context_relevance`: Relevance of retrieved context
- `toxicity`: Toxicity score (lower is better)
- `bias`: Bias detection (lower is better)
- `coherence`: Response coherence

**Status Codes**:
- `200`: Success
- `400`: Invalid payload or unknown validator
- `401`: Unauthorized
- `500`: Server error or validator service error

---

## Run Endpoints

### POST /api/run

Run prompts across multiple LLM models.

**Request**:
```json
{
  "prompt": "Explain quantum computing in simple terms",
  "models": ["gpt-4o", "gpt-4o-mini", "mistral-small"]
}
```

**Response**:
```json
{
  "runId": "uuid",
  "results": [
    {
      "model": "gpt-4o",
      "text": "Quantum computing is...",
      "latency_ms": 1250,
      "usage": {
        "prompt_tokens": 15,
        "completion_tokens": 120,
        "total_tokens": 135
      },
      "cost_usd": 0.0023,
      "evaluation": {
        "qualityScore": {
          "relevance": 92,
          "coherence": 88,
          "readability": 75,
          "overall": 87
        },
        "sentenceCount": 6,
        "avgSentenceLength": 18.5,
        "wordCount": 111
      }
    }
  ]
}
```

**Status Codes**:
- `200`: Success
- `400`: Invalid payload
- `401`: Unauthorized
- `500`: Server error or LLM API error

---

### GET /api/runs

Get recent runs for the authenticated user.

**Response**:
```json
{
  "runs": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "prompt": "Explain quantum computing",
      "models": ["gpt-4o", "gpt-4o-mini"],
      "metrics": { ... },
      "created_at": "2025-01-15T12:00:00Z"
    }
  ]
}
```

**Status Codes**:
- `200`: Success
- `401`: Unauthorized
- `400`: Database error

---

## Error Responses

All endpoints follow a consistent error format:

**Client Errors** (4xx):
```json
{
  "error": "Invalid payload: missing required field"
}
```

**Server Errors** (5xx):
```json
{
  "error": "Internal server error: database connection failed"
}
```

**Common Status Codes**:
- `400`: Bad Request - Invalid input or validation error
- `401`: Unauthorized - Missing or invalid authentication
- `404`: Not Found - Resource doesn't exist
- `500`: Internal Server Error - Server-side error

---

## Rate Limiting

Currently no rate limiting is implemented. Consider:
- Using Vercel's edge config for rate limiting
- Implementing per-user quotas
- Adding request throttling for expensive operations (validation, LLM calls)

---

## CORS

All API routes are server-side and don't require CORS headers for same-origin requests. For cross-origin access, configure Next.js middleware.

---

## Pagination

Currently not implemented for list endpoints. Consider adding for:
- `/api/runs` - Many historical runs
- `/api/feedback` - Large feedback datasets

Example future implementation:
```
GET /api/runs?page=1&perPage=20
```

---

## Versioning

API is currently unversioned (v1 implicit). Future versions may use:
- Path-based: `/api/v2/...`
- Header-based: `Accept: application/vnd.coralcake.v2+json`

---

## Best Practices

1. **Always handle errors**: Check response status before parsing JSON
2. **Use TypeScript types**: Import types from API route files
3. **Validate input client-side**: Reduce unnecessary API calls
4. **Show loading states**: All endpoints can take 100ms-2s+
5. **Cache when appropriate**: Evaluation results rarely change
6. **Batch when possible**: Future batch endpoints will be more efficient

---

## Support

- GitHub Issues: https://github.com/damyantjain/CoralCake/issues
- Documentation: See `/docs` directory
- Examples: Check `src/app/runner/page.tsx` for usage examples
