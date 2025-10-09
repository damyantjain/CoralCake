# Third-Party Validators Integration

This directory contains integrations for third-party LLM evaluation frameworks like RAGAS and TruLens.

## Overview

CoralCake supports integration with external validators to provide additional quality metrics beyond the built-in scoring system. These validators are particularly useful for:

- **RAG applications**: Evaluate retrieval quality and answer grounding
- **Production monitoring**: Track quality metrics over time
- **A/B testing**: Compare evaluation frameworks
- **Compliance**: Use established evaluation standards

## Supported Validators

### RAGAS (Retrieval-Augmented Generation Assessment)

**Purpose**: Evaluate RAG (Retrieval-Augmented Generation) pipelines

**Metrics**:
- `context_precision`: Relevance of retrieved context (0-1)
- `context_recall`: Coverage of ground truth in context (0-1)
- `faithfulness`: Factual accuracy relative to context (0-1)
- `answer_relevancy`: Relevance of answer to question (0-1)
- `context_entity_recall`: Entity recall from context (0-1)
- `answer_similarity`: Semantic similarity to reference (0-1)
- `answer_correctness`: Overall correctness (0-1)

**Implementation**: Python-based, requires microservice or API endpoint

**Links**:
- GitHub: https://github.com/explodinggradients/ragas
- Docs: https://docs.ragas.io/

### TruLens (LLM Observability)

**Purpose**: Comprehensive LLM evaluation and observability

**Metrics**:
- `groundedness`: Is response grounded in context? (0-1)
- `answer_relevance`: Relevance to question (0-1)
- `context_relevance`: Relevance of retrieved context (0-1)
- `toxicity`: Toxicity score (lower is better, 0-1)
- `bias`: Bias detection (lower is better, 0-1)
- `coherence`: Response coherence (0-1)

**Implementation**: Python-based, requires microservice or API endpoint

**Links**:
- Website: https://www.trulens.org/
- GitHub: https://github.com/truera/trulens

## Usage

### API Endpoints

#### List Available Validators

```bash
GET /api/validate
```

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

#### Run Validation

**Single Validator**:
```bash
POST /api/validate
{
  "prompt": "What is quantum computing?",
  "response": "Quantum computing uses quantum bits...",
  "context": ["Quantum mechanics...", "Superposition..."],
  "validator": "ragas"
}
```

**All Validators**:
```bash
POST /api/validate
{
  "prompt": "What is quantum computing?",
  "response": "Quantum computing uses quantum bits...",
  "context": ["Quantum mechanics...", "Superposition..."]
}
```

**Response**:
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
      "notes": "Evaluated by RAGAS service"
    },
    "trulens": {
      "validator": "trulens",
      "overall_score": 82,
      "metrics": {
        "groundedness": 0.90,
        "answer_relevance": 0.85,
        "toxicity": 0.02
      },
      "timestamp": "2025-01-15T12:00:00Z",
      "notes": "Demo mode"
    }
  }
}
```

### Programmatic Usage

```typescript
import { runValidation, runAllValidations } from '@/lib/validators';

// Run single validator
const ragasResult = await runValidation(
  'ragas',
  'What is quantum computing?',
  'Quantum computing uses quantum bits...',
  ['Context about quantum mechanics...']
);

console.log(`RAGAS Score: ${ragasResult.overall_score}/100`);
console.log(`Faithfulness: ${ragasResult.metrics.faithfulness}`);

// Run all validators
const allResults = await runAllValidations(
  'What is quantum computing?',
  'Quantum computing uses quantum bits...'
);

for (const [name, result] of Object.entries(allResults)) {
  console.log(`${name}: ${result.overall_score}/100`);
}
```

## Setup & Configuration

### Demo Mode (Default)

By default, validators run in **demo mode** with simulated metrics. This is useful for:
- Development and testing
- Exploring validator capabilities
- UI/UX development

No setup required - validators work out of the box in demo mode.

### Production Mode

To use real validator services, you need to:

#### Option 1: Hosted Service (Recommended)

If the validator provides a cloud API:

1. Sign up for the service
2. Get your API key
3. Set environment variables:

```bash
# .env.local
RAGAS_ENDPOINT=https://api.ragas.io/v1/evaluate
RAGAS_API_KEY=your_ragas_api_key

TRULENS_ENDPOINT=https://api.trulens.org/v1/evaluate
TRULENS_API_KEY=your_trulens_api_key
```

#### Option 2: Self-Hosted Microservice

Deploy Python microservices that wrap the validators:

1. **Create Python service** (example for RAGAS):

```python
# ragas_service.py
from fastapi import FastAPI
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy

app = FastAPI()

@app.post("/evaluate")
async def evaluate_response(data: dict):
    result = evaluate(
        question=data["question"],
        answer=data["answer"],
        contexts=data["contexts"],
        metrics=[faithfulness, answer_relevancy]
    )
    return result

@app.get("/health")
async def health():
    return {"status": "ok"}
```

2. **Deploy service**:
```bash
# Using Docker
docker build -t ragas-service .
docker run -p 8000:8000 ragas-service

# Or using Cloud Run, Lambda, etc.
```

3. **Configure CoralCake**:
```bash
# .env.local
RAGAS_ENDPOINT=http://localhost:8000/evaluate
```

#### Option 3: Sidecar Container

Use Docker Compose to run validators alongside CoralCake:

```yaml
# docker-compose.yml
services:
  coralcake:
    build: .
    ports:
      - "3000:3000"
    environment:
      - RAGAS_ENDPOINT=http://ragas:8000/evaluate
      - TRULENS_ENDPOINT=http://trulens:8000/evaluate
  
  ragas:
    image: ragas-service:latest
    ports:
      - "8000:8000"
  
  trulens:
    image: trulens-service:latest
    ports:
      - "8001:8000"
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RAGAS_ENDPOINT` | RAGAS service URL | None (demo mode) |
| `RAGAS_API_KEY` | RAGAS API key (if using cloud) | None |
| `TRULENS_ENDPOINT` | TruLens service URL | None (demo mode) |
| `TRULENS_API_KEY` | TruLens API key (if using cloud) | None |

## Adding New Validators

To add a new validator:

1. **Create validator module** (`src/lib/validators/yourvalidator.ts`):

```typescript
import type { ValidatorResult } from './types';

export async function evaluateWithYourValidator(
  prompt: string,
  response: string,
  context?: string | string[]
): Promise<ValidatorResult> {
  // Implementation
  return {
    validator: 'yourvalidator',
    overall_score: 85,
    metrics: { /* your metrics */ },
    timestamp: new Date().toISOString(),
  };
}
```

2. **Register in index.ts**:

```typescript
// src/lib/validators/index.ts
import { evaluateWithYourValidator } from './yourvalidator';

export const validators: ValidatorRegistry = {
  ragas: evaluateWithRAGAS,
  trulens: evaluateWithTruLens,
  yourvalidator: evaluateWithYourValidator, // Add here
};
```

3. **Test**:

```bash
curl -X POST http://localhost:3000/api/validate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "test", "response": "test", "validator": "yourvalidator"}'
```

## Troubleshooting

### Validator Returns Demo Mode

**Cause**: Endpoint not configured or service unavailable

**Solution**:
1. Check environment variables are set correctly
2. Verify service is running: `curl http://localhost:8000/health`
3. Check network connectivity from CoralCake to validator service

### Validation Fails with Error

**Cause**: Invalid request format or service error

**Solution**:
1. Check validator service logs
2. Verify request payload matches validator's expected format
3. Ensure all required fields are provided (especially `context` for RAG validators)

### Slow Validation

**Cause**: Validators run AI models which can be slow

**Solution**:
1. Use async validation and show loading state in UI
2. Cache results for identical prompt/response pairs
3. Run validation in background after initial response display

## Best Practices

1. **Use Demo Mode for Development**: Faster iteration without external dependencies
2. **Production Monitoring**: Use real validators in production for accurate metrics
3. **Context Matters**: Always provide context for RAG evaluators (RAGAS)
4. **Batch Validation**: Validate multiple responses in parallel when possible
5. **Error Handling**: Gracefully fall back to demo mode if service unavailable
6. **Cost Awareness**: Some validators may have per-request costs

## Future Enhancements

- [ ] Batch validation API
- [ ] Validation result caching
- [ ] Webhook notifications for async validation
- [ ] Custom validator configuration UI
- [ ] Validator performance comparison
- [ ] Historical validation trends

## Support

For validator-specific issues:
- RAGAS: https://github.com/explodinggradients/ragas/issues
- TruLens: https://github.com/truera/trulens/issues

For CoralCake integration issues:
- Open issue: https://github.com/damyantjain/CoralCake/issues
