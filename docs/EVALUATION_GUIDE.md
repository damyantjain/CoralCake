# Response Quality Evaluation Guide

This guide explains how to use CoralCake's automated response quality evaluation features.

## Overview

CoralCake now automatically evaluates every LLM response with multiple quality metrics, helping you objectively compare model outputs beyond just speed and cost.

## Automatic Quality Scoring

Every response is automatically scored on three dimensions:

### 1. Relevance Score (0-100)

**What it measures**: How well the response addresses the prompt.

**How it works**:
- Extracts meaningful keywords from your prompt (words > 3 characters)
- Checks how many of those keywords appear in the response
- Higher score = more prompt keywords mentioned

**When to use**: 
- Ensure responses stay on-topic
- Compare how well different models understand your intent
- Identify models that tend to go off-topic

**Example**:
- Prompt: "Explain quantum computing in simple terms"
- High relevance (90+): Response discusses quantum, computing, qubits, superposition
- Low relevance (40): Response talks about classical computers instead

### 2. Coherence Score (0-100)

**What it measures**: How well-structured and logical the response is.

**How it works**:
- Analyzes sentence length consistency (varied but not erratic)
- Looks for transition words (however, therefore, furthermore, etc.)
- Higher score = better flow and structure

**When to use**:
- Evaluate readability and professionalism
- Compare writing quality across models
- Identify models that produce choppy or disjointed text

**Example**:
- High coherence (85+): Balanced sentences with smooth transitions
- Low coherence (45): Mix of very short and very long sentences, abrupt topic changes

### 3. Readability Score (0-100)

**What it measures**: How easy the response is to read and understand.

**How it works**:
- Uses Flesch Reading Ease formula
- Considers sentence length and word complexity
- 90-100: Very easy (5th grade)
- 60-70: Plain English (8th-9th grade)
- 0-30: Very difficult (college graduate)

**When to use**:
- Ensure responses match your target audience
- Compare accessibility across models
- Identify overly complex or overly simple responses

**Example**:
- High readability (80+): Short sentences, simple words, clear explanations
- Low readability (30): Long sentences, technical jargon, complex structure

### 4. Overall Score

**Calculation**: Weighted average of the three scores above
- Relevance: 50% weight (most important)
- Coherence: 30% weight
- Readability: 20% weight

**Color coding**:
- 🟢 Green (80-100): Excellent quality
- 🟡 Yellow (60-79): Good quality
- 🟠 Orange (0-59): Needs improvement

## Human Feedback

### Thumbs Up/Down

**Purpose**: Quick sentiment indicator

**How to use**:
1. Read the response
2. Click 👍 if satisfied or 👎 if unsatisfied
3. Click again to toggle off

**Best practices**:
- Use for quick gut reactions
- Complement with star ratings for nuance
- Consider both quality AND usefulness

### Star Ratings (1-5)

**Purpose**: Detailed quality assessment

**How to use**:
1. Click "Rate" to show stars
2. Click 1-5 stars (1 = poor, 5 = excellent)
3. Rating is saved immediately

**Rating scale**:
- ⭐ (1): Unusable, incorrect, or completely off-topic
- ⭐⭐ (2): Poor quality, mostly unhelpful
- ⭐⭐⭐ (3): Acceptable, partially helpful
- ⭐⭐⭐⭐ (4): Good quality, helpful
- ⭐⭐⭐⭐⭐ (5): Excellent, exactly what you needed

## Custom Evaluation Scripts

CoralCake includes built-in custom evaluators for specialized use cases.

### Available Scripts

#### 1. Length Check

**Purpose**: Validates response length appropriateness

**Scoring**:
- 100: Response is 2-10x the prompt length (ideal)
- 70: Response is >10x the prompt (too verbose)
- 50: Response is <2x the prompt (too brief)

**Use cases**:
- Ensure concise responses for summaries
- Verify detailed responses for explanations
- Compare verbosity across models

#### 2. Sentiment Positivity

**Purpose**: Analyzes positive vs negative language

**Scoring**:
- 100: Only positive language used
- 50: Balanced or neutral tone
- 0: Only negative language used

**Use cases**:
- Customer service applications
- Marketing copy generation
- Tone consistency checking

#### 3. Code Presence Detector

**Purpose**: Detects code snippets in responses

**Scoring**:
- 100: Code detected (backticks, keywords, indentation)
- 0: No code found

**Use cases**:
- Verify technical responses include examples
- Compare code generation across models
- Validate programming assistance

### Using Custom Evaluations via API

**List available scripts**:
```bash
GET /api/evaluate-custom
```

**Run a specific script**:
```bash
POST /api/evaluate-custom
{
  "prompt": "Explain React hooks",
  "response": "React hooks are...",
  "scriptName": "codePresence"
}
```

**Run all scripts**:
```bash
POST /api/evaluate-custom
{
  "prompt": "Explain React hooks",
  "response": "React hooks are..."
}
```

## Grammar Analysis

Every response is checked for basic grammar issues:

**Detected issues**:
- ✅ Repeated words ("the the")
- ✅ Multiple consecutive spaces
- ✅ Missing space after punctuation
- ✅ Lowercase sentence starts

**Additional metrics**:
- Sentence count
- Average sentence length
- Total word count

## Interpreting Results

### Quality Score Patterns

**High relevance + Low coherence**:
- Model understands the topic but struggles with structure
- Consider: Providing more detailed prompts

**High coherence + Low relevance**:
- Model writes well but misses the point
- Consider: Clarifying your prompt intent

**Low readability + High overall**:
- Response is accurate but complex
- Consider: Requesting "explain in simple terms" in prompt

### Comparing Models

**Use case: Speed vs Quality**
- Model A: Faster, 70 overall score
- Model B: Slower, 92 overall score
- Decision: Choose based on your priority

**Use case: Cost vs Quality**
- Model A: Cheaper, 65 overall score
- Model B: Expensive, 88 overall score
- Decision: Consider volume and budget

### Feedback Best Practices

1. **Be consistent**: Use the same criteria across all responses
2. **Consider context**: A "good" summary differs from a "good" essay
3. **Give stars AND thumbs**: More data = better insights
4. **Note patterns**: Track which models consistently score higher

## Advanced Tips

### Prompt Engineering for Better Scores

**For higher relevance**:
- Use specific keywords you expect in the response
- Ask direct questions
- Provide context

**For higher coherence**:
- Request structured responses ("First..., Then..., Finally...")
- Ask for step-by-step explanations
- Specify the desired format

**For higher readability**:
- Request "simple terms" or "explain like I'm 10"
- Ask for short sentences
- Specify target audience

### Evaluation Workflows

**1. Initial Model Selection**:
- Run same prompt across all models
- Compare overall quality scores
- Check cost vs quality tradeoff

**2. Prompt Optimization**:
- Test variations of your prompt
- Track quality score improvements
- Use Compare page to see trends

**3. Production Monitoring**:
- Run periodic evaluations
- Track quality over time
- Detect model degradation

## Limitations & Future Improvements

### Current Limitations

- **Relevance**: Keyword-based (doesn't understand semantics deeply)
- **Coherence**: Heuristic-based (not ML-powered)
- **Readability**: Formula-based (doesn't consider context)
- **Feedback**: Not yet persisted to database

### Coming Soon

- ✨ Third-party validators (RAGAS, TruLens)
- ✨ Semantic similarity scoring
- ✨ Context-aware evaluation
- ✨ Feedback analytics and trends
- ✨ Custom evaluation script upload

## API Reference

### POST /api/evaluate

Evaluate a single response.

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
    }
  ]
}
```

### POST /api/evaluate-custom

Run custom evaluation script(s).

**Request**:
```json
{
  "prompt": "string",
  "response": "string",
  "scriptName": "lengthCheck"  // optional
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
    "lengthCheck": { "score": 100, ... },
    "sentimentPositivity": { "score": 85, ... },
    "codePresence": { "score": 0, ... }
  }
}
```

## Troubleshooting

**Q: Why are all my scores low?**
A: Check if your prompt is clear and specific. Vague prompts lead to vague responses.

**Q: One model always scores higher. Is it rigged?**
A: No, some models genuinely produce more coherent, relevant responses. That's the point!

**Q: Can I customize the scoring weights?**
A: Not yet, but custom evaluation scripts can implement any logic you need.

**Q: Where is my feedback saved?**
A: Currently client-side only. Database persistence coming soon.

**Q: Can I add my own evaluation script?**
A: Yes! Extend the `builtInScripts` object in `src/lib/evaluation/custom.ts`.

## Support

For questions or feature requests:
- Open a GitHub issue
- Check the main README
- Review FEATURES.md for latest capabilities
