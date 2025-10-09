# Batch Prompt Testing Guide

## Overview

Batch Prompt Testing allows you to test multiple prompts across different LLMs in a single operation. This feature is ideal for:
- Evaluating prompt variations
- Running benchmarks across multiple prompts
- Testing different models with the same set of prompts
- Generating comprehensive comparison reports

## Features

- **Bulk Upload**: Upload prompts via CSV or JSON files
- **Parallel Execution**: Run multiple prompts simultaneously with configurable concurrency
- **Progress Tracking**: Real-time progress updates during batch execution
- **Summary Reports**: Comprehensive statistics including success rates, costs, and quality scores
- **Export Results**: Download results in CSV or JSON format
- **Quality Evaluation**: Automatic quality scoring for all responses

## Usage

### 1. Access the Batch Page

Navigate to `/batch` in your browser or click "Batch Testing" on the home page.

### 2. Upload Prompts

#### CSV Format

Download the template CSV file and fill it with your prompts:

```csv
prompt,expected_output,tags
"What is machine learning?","A detailed explanation of ML","AI;ML;basics"
"Explain quantum computing","","quantum;physics"
"Write a haiku about spring","A 5-7-5 syllable poem","poetry;creative"
```

**CSV Columns:**
- `prompt` (required): The prompt text to test
- `expected_output` (optional): Expected output for comparison
- `tags` (optional): Semicolon-separated tags for categorization

#### JSON Format

You can also upload a JSON file with an array of prompts:

**Simple format** (just prompts):
```json
[
  "What is machine learning?",
  "Explain quantum computing",
  "Write a haiku about spring"
]
```

**Detailed format** (with metadata):
```json
[
  {
    "prompt": "What is machine learning?",
    "expected_output": "A detailed explanation of ML",
    "tags": ["AI", "ML", "basics"]
  },
  {
    "prompt": "Explain quantum computing",
    "tags": ["quantum", "physics"]
  }
]
```

### 3. Preview and Configure

After uploading:
1. Review the parsed prompts in the preview table
2. Select the models you want to test (GPT-4o, GPT-4o-mini, Mistral)
3. Optionally name your batch for easier identification

### 4. Run the Batch

Click "Run Batch" to start execution. The system will:
- Execute all prompt-model combinations in parallel
- Update progress in real-time
- Handle errors gracefully
- Generate comprehensive results

### 5. Review Results

The results page shows:

**Summary Statistics:**
- Total runs completed
- Success rate percentage
- Average latency across all runs
- Total cost in USD

**Per-Model Breakdown:**
- Success/failure counts
- Average latency
- Total cost
- Average quality score

**Detailed Results Table:**
- Individual prompt results
- Status (success/failed)
- Performance metrics
- Quality scores

### 6. Export Results

Download results in CSV or JSON format for further analysis:
- **CSV**: Easy to import into Excel or other spreadsheet tools
- **JSON**: Structured data for programmatic analysis

## API Reference

### POST /api/batch/upload

Parse and validate a batch upload file.

**Request:**
```json
{
  "content": "prompt,expected_output,tags\n...",
  "format": "csv",
  "name": "My Batch Test"
}
```

**Response:**
```json
{
  "prompts": [...],
  "count": 10,
  "name": "My Batch Test"
}
```

### GET /api/batch/template

Download a CSV template file.

**Response:**
- Content-Type: `text/csv`
- File: `batch-prompts-template.csv`

### POST /api/batch/run

Execute a batch of prompts.

**Request:**
```json
{
  "prompts": [
    {
      "prompt": "What is AI?",
      "tags": ["AI"]
    }
  ],
  "models": ["gpt-4o-mini", "mistral-small"],
  "name": "AI Questions Batch"
}
```

**Response:**
```json
{
  "batchId": "uuid",
  "results": [...],
  "summary": {
    "total_prompts": 10,
    "total_runs": 20,
    "success_rate": 0.95,
    "avg_latency_ms": 450,
    "total_cost_usd": 0.0123,
    ...
  }
}
```

## Limits

- **Maximum batch size**: 100 prompts per batch
- **Concurrency**: 3 simultaneous LLM calls (configurable)
- **Timeout**: 30 seconds per LLM call

## Best Practices

1. **Start Small**: Test with a small batch (5-10 prompts) first
2. **Use Tags**: Organize prompts with meaningful tags for easier analysis
3. **Monitor Costs**: Check the cost projections before running large batches
4. **Export Results**: Save results for historical comparison
5. **Review Failures**: Check failed prompts and adjust if needed

## Troubleshooting

### "Parse error" when uploading

- Ensure CSV/JSON format is correct
- Check for special characters in prompts (use quotes in CSV)
- Validate JSON syntax with a JSON validator

### "Batch size exceeds limit"

- Reduce the number of prompts to 100 or fewer
- Consider splitting into multiple batches

### Some prompts fail during execution

- Check individual error messages in the results table
- Common causes: timeout, rate limits, API errors
- Failed prompts can be re-run individually

## Technical Details

### Architecture

The batch system uses:
- **Parser Module**: Validates and parses CSV/JSON files
- **Runner Module**: Executes prompts with parallel processing
- **Progress Tracking**: Real-time updates via client-side state
- **Quality Evaluation**: Automatic scoring using built-in metrics

### Concurrency Control

The runner uses a concurrency-limited promise pool to:
- Prevent rate limit issues
- Optimize resource usage
- Ensure stable execution

Default concurrency: 3 simultaneous calls

### Error Handling

Each prompt-model combination is executed independently:
- Failures don't block other executions
- Error messages are captured and reported
- Partial results are always returned

## Future Enhancements

Potential future improvements:
- Asynchronous batch processing with email notifications
- Batch history and comparison
- Advanced filtering and sorting of results
- Custom concurrency settings in UI
- Retry failed prompts automatically
- Batch templates library
