# Batch Prompt Testing Library

This library provides functionality for bulk testing prompts across multiple LLM models.

## Architecture

```
src/lib/batch/
├── types.ts          # TypeScript type definitions
├── parser.ts         # CSV and JSON parsing
├── runner.ts         # Batch execution engine
└── __tests__/
    └── parser.test.ts # Unit tests
```

## Core Components

### Types (`types.ts`)

Defines all TypeScript interfaces used in batch operations:
- `BatchPromptItem`: Individual prompt with metadata
- `BatchStatus`: Execution status enum
- `BatchJobProgress`: Progress tracking
- `BatchRunMetadata`: Batch job metadata
- `BatchPromptResult`: Individual prompt-model result
- `BatchSummary`: Aggregated statistics

### Parser (`parser.ts`)

Handles CSV and JSON file parsing:
- `parseCSV(content: string): BatchPromptItem[]`
- `parseJSON(content: string): BatchPromptItem[]`
- `generateCSVTemplate(): string`

**Features:**
- Quote handling in CSV
- Multiple column support (prompt, expected_output, tags)
- JSON array support (strings or objects)
- Comprehensive validation
- Detailed error messages

### Runner (`runner.ts`)

Executes batch prompts with parallel processing:
- `runBatch(options: BatchRunnerOptions): Promise<BatchPromptResult[]>`

**Features:**
- Configurable concurrency (default: 3)
- Automatic provider routing (OpenAI, Mistral)
- Error handling per task
- Progress callbacks
- Quality evaluation integration
- Cost calculation

## Usage Example

```typescript
import { parseCSV, runBatch } from '@/lib/batch';

// Parse CSV content
const csvContent = `prompt,expected_output,tags
"What is AI?","Definition of AI","AI;basics"
"Explain ML","","ML"`;

const prompts = parseCSV(csvContent);

// Run batch
const results = await runBatch({
  prompts,
  models: ['gpt-4o-mini', 'mistral-small'],
  userId: 'user-id',
  concurrency: 3,
  onProgress: (completed, total) => {
    console.log(`Progress: ${completed}/${total}`);
  }
});

// Results contain all prompt-model combinations
console.log(`Completed ${results.length} runs`);
```

## CSV Format

### Required Column
- `prompt`: The prompt text (required)

### Optional Columns
- `expected_output`: Expected response for comparison
- `tags`: Semicolon-separated tags (e.g., "AI;ML;basics")

### Example
```csv
prompt,expected_output,tags
"What is AI?","Definition of AI","AI;basics"
"Explain ML","Simple explanation","ML;basics"
```

## JSON Format

### Simple Format (Array of Strings)
```json
[
  "What is AI?",
  "Explain ML"
]
```

### Detailed Format (Array of Objects)
```json
[
  {
    "prompt": "What is AI?",
    "expected_output": "Definition of AI",
    "tags": ["AI", "basics"]
  },
  {
    "prompt": "Explain ML",
    "tags": "ML"
  }
]
```

## Concurrency Control

The batch runner uses a concurrency-limited promise pool:

1. Maximum N tasks run simultaneously (default: 3)
2. When a task completes, the next task starts
3. Prevents rate limiting and resource exhaustion
4. Each task is independent (failures don't block others)

## Error Handling

Errors are handled at the task level:
- Individual task failures don't stop the batch
- Error messages are captured in results
- Partial results are always returned
- Summary includes success/failure counts

## Quality Evaluation

Each successful result includes automatic quality evaluation:
- Relevance score (0-100)
- Coherence score (0-100)
- Readability score (0-100)
- Overall score (weighted average)

Uses the existing evaluation library (`@/lib/evaluation/scoring`).

## Cost Calculation

Costs are calculated using the pricing library:
- Per-prompt cost (based on token usage)
- Model-level aggregation
- Total batch cost
- Average cost per prompt

Uses the existing pricing library (`@/lib/llm/pricing`).

## Performance

### Typical Performance (3 concurrent calls)
- 5 prompts × 2 models = 10 total runs
- Average LLM latency: 2 seconds
- Total time: ~7 seconds (with parallelization)

### Without Parallelization
- Same batch: 10 × 2s = 20 seconds
- **3x faster with parallel execution**

## Limitations

- Maximum batch size: 100 prompts
- Default concurrency: 3 (configurable)
- Timeout per LLM call: 30 seconds
- Supported providers: OpenAI, Mistral

## Testing

Run the parser tests:
```bash
npx tsx src/lib/batch/__tests__/parser.test.ts
```

Expected output: All tests passing ✅

## Future Enhancements

- [ ] Asynchronous processing with job queue
- [ ] Progress persistence
- [ ] Automatic retry for failed tasks
- [ ] Custom timeout per prompt
- [ ] Streaming results
- [ ] Batch templates
- [ ] More sophisticated concurrency strategies
