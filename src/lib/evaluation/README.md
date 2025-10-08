# CoralCake Evaluation Library

This directory contains the automated response quality evaluation system for CoralCake.

## Overview

The evaluation library provides objective quality assessment for LLM responses, going beyond basic metrics like latency and cost to measure response quality, relevance, and effectiveness.

## Architecture

### Core Modules

**`types.ts`**
- TypeScript type definitions
- Quality scores, evaluation metrics, feedback types
- Custom evaluation interfaces

**`scoring.ts`**
- Built-in quality scoring algorithms
- Relevance, coherence, readability calculations
- Grammar and structure analysis
- Flesch-Kincaid readability formula

**`custom.ts`**
- Custom evaluation script framework
- Built-in specialized evaluators
- Extensible script interface

## Usage

### Basic Evaluation

```typescript
import { evaluateResponse } from '@/lib/evaluation/scoring';

const metrics = evaluateResponse(
  "Explain quantum computing",
  "Quantum computing uses qubits..."
);

console.log(metrics.qualityScore.overall); // 85
console.log(metrics.qualityScore.relevance); // 92
console.log(metrics.qualityScore.coherence); // 78
console.log(metrics.qualityScore.readability); // 75
```

### Custom Evaluation

```typescript
import { runCustomEvaluation, runAllCustomEvaluations } from '@/lib/evaluation/custom';

// Run single script
const result = await runCustomEvaluation(
  'lengthCheck',
  prompt,
  response
);
console.log(result.score); // 100
console.log(result.metrics); // { responseWords: 45, ... }

// Run all scripts
const results = await runAllCustomEvaluations(prompt, response);
console.log(results.lengthCheck.score);
console.log(results.sentimentPositivity.score);
console.log(results.codePresence.score);
```

## Scoring Algorithms

### Relevance Score (0-100)

Measures keyword overlap between prompt and response.

**Algorithm**:
1. Extract keywords from prompt (words > 3 characters)
2. Normalize text (lowercase, remove punctuation)
3. Count matches in response
4. Calculate percentage

**Strengths**:
- Fast and simple
- No external dependencies
- Works for most use cases

**Limitations**:
- Keyword-based (not semantic)
- May miss synonyms
- Sensitive to prompt wording

### Coherence Score (0-100)

Evaluates sentence structure and logical flow.

**Algorithm**:
1. Consistency Score (70% weight):
   - Calculate sentence length variance
   - Lower variance = more consistent
   - Normalize to 0-100 scale

2. Transition Score (30% weight):
   - Count transition words
   - Normalize per sentence
   - Scale to 0-100

**Transition words**:
- however, therefore, furthermore
- additionally, moreover, consequently
- thus, hence, also, likewise

**Strengths**:
- Catches disjointed writing
- Rewards structured responses
- Fast computation

**Limitations**:
- Heuristic-based
- Not context-aware
- May penalize creative writing

### Readability Score (0-100)

Flesch Reading Ease formula for comprehension level.

**Formula**:
```
206.835 - 1.015 × (words/sentences) - 84.6 × (syllables/words)
```

**Scale**:
- 90-100: Very easy (5th grade)
- 80-89: Easy (6th grade)
- 70-79: Fairly easy (7th grade)
- 60-69: Standard (8th-9th grade)
- 50-59: Fairly difficult (high school)
- 30-49: Difficult (college)
- 0-29: Very difficult (college graduate)

**Strengths**:
- Industry standard
- Well-researched formula
- Objective measurement

**Limitations**:
- Doesn't consider context
- Technical content scores low
- Syllable counting is approximate

### Overall Score

Weighted average of the three scores:
- Relevance: 50% (most important)
- Coherence: 30%
- Readability: 20%

**Rationale**:
- Answering the question is priority #1
- Structure matters for professionalism
- Readability varies by audience

## Custom Evaluation Scripts

### Built-in Scripts

#### 1. Length Check

**Purpose**: Validates response length appropriateness

**Logic**:
- Ideal: 2-10x prompt length
- Too short: <2x prompt length
- Too long: >10x prompt length

**Use cases**:
- Summaries (expect concise)
- Explanations (expect detailed)
- Consistency checking

#### 2. Sentiment Positivity

**Purpose**: Analyzes tone and sentiment

**Logic**:
- Count positive words (excellent, great, beneficial, ...)
- Count negative words (bad, poor, problem, ...)
- Score = positive/(positive + negative) × 100

**Use cases**:
- Customer service
- Marketing copy
- Tone consistency

#### 3. Code Presence

**Purpose**: Detects technical content

**Checks**:
- Code blocks (```)
- Inline code (`)
- Keywords (function, class, def, ...)
- Indentation patterns

**Use cases**:
- Programming assistance
- Technical documentation
- Tutorial generation

### Adding Custom Scripts

```typescript
// src/lib/evaluation/custom.ts

export const builtInScripts: Record<string, CustomEvaluationScript> = {
  // ... existing scripts ...
  
  myCustomScript: {
    name: 'My Custom Evaluator',
    description: 'Does something specific',
    evaluate: (prompt: string, response: string): CustomEvaluationResult => {
      // Your logic here
      const score = /* calculate score */;
      
      return {
        score,
        metrics: { /* custom metrics */ },
        notes: 'Optional explanation'
      };
    }
  }
};
```

## Grammar Analysis

Basic grammar checking for common issues:

**Checks**:
- Repeated words ("the the")
- Multiple spaces
- Missing space after punctuation
- Lowercase sentence starts

**Returns**:
- Array of issue descriptions
- Empty array if no issues found

## API Integration

### Automatic Evaluation

Every response from `/api/run` is automatically evaluated:

```typescript
// src/app/api/run/route.ts
import { evaluateResponse } from '@/lib/evaluation/scoring';

// After getting LLM response
const evaluation = evaluateResponse(prompt, response.text);

// Include in result
results.push({
  model: model,
  text: response.text,
  evaluation: evaluation,
  // ... other fields
});
```

### On-Demand Evaluation

Use the evaluation API endpoints:

```typescript
// Standard evaluation
POST /api/evaluate
{
  "prompt": "string",
  "response": "string"
}

// Custom evaluation
POST /api/evaluate-custom
{
  "prompt": "string",
  "response": "string",
  "scriptName": "lengthCheck"  // optional
}
```

## Performance

### Benchmarks

Typical response (200 words, 10 sentences):
- Relevance calculation: ~1ms
- Coherence calculation: ~2ms
- Readability calculation: ~1ms
- Grammar check: ~1ms
- **Total: ~5ms overhead**

### Optimization

- All calculations are synchronous
- No external API calls
- Minimal memory allocation
- Pure JavaScript/TypeScript

## Testing

### Unit Tests

(TODO: Add test file)

```typescript
describe('evaluateResponse', () => {
  it('should score high relevance for keyword-rich responses', () => {
    const metrics = evaluateResponse(
      'Explain quantum computing',
      'Quantum computing uses quantum bits or qubits...'
    );
    expect(metrics.qualityScore.relevance).toBeGreaterThan(80);
  });
});
```

### Manual Testing

1. Run dev server: `npm run dev`
2. Navigate to `/runner`
3. Enter test prompts
4. Verify scores match expectations

## Future Improvements

### Phase 1: Enhanced Algorithms
- Semantic similarity (embeddings)
- ML-powered coherence
- Context-aware scoring
- Language-specific readability

### Phase 2: External Validators
- RAGAS integration
- TruLens integration
- LangChain evaluators
- Custom API validators

### Phase 3: Advanced Features
- Comparative scoring
- Historical trends
- A/B test support
- Batch evaluation

## Dependencies

**Zero external dependencies!**

All algorithms are implemented in pure TypeScript using only Node.js built-ins.

## Contributing

### Adding New Scripts

1. Define script in `custom.ts`
2. Add to `builtInScripts` object
3. Update types if needed
4. Document in EVALUATION_GUIDE.md
5. Add tests

### Improving Algorithms

1. Benchmark current performance
2. Implement improvement
3. Compare results
4. Document changes
5. Update tests

## License

Same as parent CoralCake project.

## Support

- See: `docs/EVALUATION_GUIDE.md` for user documentation
- See: Issue tracker for bug reports
- See: FEATURES.md for feature roadmap
