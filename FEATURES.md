# CoralCake Features

This document outlines the current and planned features for CoralCake, a platform for comparing and evaluating Large Language Models (LLMs).

## Current Features (v0.1)

### 1. LLM Prompt Runner
- **Location**: `/runner`
- **Description**: Test prompts across multiple LLMs simultaneously
- **Capabilities**:
  - Support for OpenAI (gpt-4o, gpt-4o-mini) and Mistral (mistral-small) models
  - Real-time performance metrics (latency, token usage, cost)
  - **NEW**: Automatic quality evaluation (relevance, coherence, readability)
  - **NEW**: Human feedback (thumbs up/down, star ratings)
  - Side-by-side response comparison
  - Export results to CSV or JSON format
  - Aggregate statistics (total cost, average latency, total tokens)

### 2. Historical Comparison
- **Location**: `/compare`
- **Description**: Compare results from previous test runs
- **Capabilities**:
  - View all historical test runs
  - Select up to 3 runs for side-by-side comparison
  - Track performance trends over time
  - Filter and search past runs by prompt or model

### 3. Cost Analysis
- **Description**: Real-time cost estimation for each LLM call
- **Capabilities**:
  - Per-model pricing based on token usage
  - Total cost aggregation across multiple models
  - Cost breakdown (input tokens vs output tokens)
  - Export cost data for accounting purposes

### 4. Performance Metrics
- **Description**: Comprehensive metrics for each LLM response
- **Metrics Tracked**:
  - Latency (response time in milliseconds)
  - Token usage (prompt/completion/total)
  - Cost (USD)
  - Response length (character count)
  - Success/error status

### 5. Data Export
- **Description**: Export comparison results for further analysis
- **Formats**:
  - CSV (for spreadsheet analysis)
  - JSON (for programmatic use)
- **Includes**: All metrics, prompts, and responses

### 6. Automated Response Quality Evaluation ✨ NEW
- **Description**: Objective quality assessment beyond basic metrics
- **Built-in Scoring**:
  - **Relevance Score (0-100)**: Measures keyword overlap between prompt and response
  - **Coherence Score (0-100)**: Analyzes sentence structure and logical flow
  - **Readability Score (0-100)**: Flesch Reading Ease formula for comprehension level
  - **Overall Score**: Weighted average (Relevance 50%, Coherence 30%, Readability 20%)
  - Color-coded quality badges (green ≥80, yellow ≥60, orange <60)
- **Human Feedback**:
  - Thumbs up/down for quick sentiment
  - 5-star rating system for detailed feedback
  - Interactive feedback UI on each response
- **Custom Evaluations**:
  - **Length Check**: Validates response length appropriateness
  - **Sentiment Positivity**: Analyzes positive vs negative language
  - **Code Presence**: Detects code snippets in responses
  - Extensible framework for adding custom evaluation scripts
  - API endpoint: `/api/evaluate-custom` for programmatic access

### 7. Grammar & Structure Analysis
- **Description**: Basic grammar and formatting checks
- **Checks**:
  - Repeated word detection
  - Spacing and punctuation validation
  - Sentence capitalization
  - Sentence count and average length metrics

### 8. Batch Prompt Testing ✨ NEW
- **Location**: `/batch`
- **Description**: Test multiple prompts at once for comprehensive benchmarking
- **Capabilities**:
  - **Bulk Upload**: Upload prompts via CSV or JSON files (up to 100 prompts per batch)
  - **Parallel Execution**: Run prompts concurrently across selected models with configurable concurrency (default: 3)
  - **Progress Tracking**: Real-time updates during batch execution
  - **Template Download**: Pre-formatted CSV template for easy data entry
  - **Summary Reports**: Comprehensive statistics including:
    - Total runs and success rate
    - Average latency across all prompts
    - Total cost and cost per prompt
    - Per-model performance breakdown (success/failure, latency, cost, quality scores)
  - **Quality Evaluation**: Automatic quality scoring for all responses
  - **Export Results**: Download batch results in CSV or JSON format
  - **Detailed Results View**: Scrollable table with all individual prompt results
- **Use Cases**:
  - Benchmark different prompts across models
  - Test prompt variations at scale
  - Evaluate model performance on specific domains
  - Generate comprehensive comparison reports

## Planned Features

### Phase 2: Response Quality Evaluation (Complete ✅)
- ✅ Built-in scoring system (relevance, coherence, readability)
- ✅ Human feedback UI (thumbs up/down, star ratings)
- ✅ Custom evaluation script framework
- ✅ Feedback persistence to database (via `/api/feedback`)
- ✅ Third-party validator integration (RAGAS, TruLens via `/api/validate`)

### Phase 3: Batch Prompt Testing (Complete ✅)
- ✅ Bulk prompt upload (CSV, JSON)
- ✅ Automated benchmark runner with progress tracking
- ✅ Summary report generation
- ✅ Parallel execution for faster results (configurable concurrency)
- ✅ Quality evaluation for all batch results
- ✅ Export results to CSV or JSON
- ✅ Per-model performance breakdown
- ✅ Template download for easy CSV creation

### Phase 4: Prompt Engineering Playground
- Prompt versioning and history
- A/B testing workflows
- Prompt suggestion engine
- Performance tracking over iterations

### Phase 5: Extended LLM Integration
- Anthropic Claude support
- Cohere models
- Google Gemini integration
- HuggingFace models
- Open-source model support
- Model metadata and changelogs

### Phase 6: Intelligent Recommendations
- Smart LLM recommendation based on user criteria
- Cost-performance optimization suggestions
- Use-case specific model selection
- Automated model selection for prompts

### Phase 7: Enhanced Documentation
- Feature usage guides
- API documentation for programmatic access
- Best practices for LLM evaluation
- Example workflows and use cases

## Usage Examples

### Running a Single Comparison
1. Navigate to `/runner`
2. Enter your prompt
3. Select models to compare
4. Click "Run Comparison"
5. Review results and export if needed

### Comparing Historical Runs
1. Navigate to `/compare`
2. Browse your previous test runs
3. Select up to 3 runs to compare
4. Review side-by-side metrics

### Exporting Results
1. After running a comparison on `/runner`
2. Click "Export CSV" or "Export JSON"
3. Save the file for later analysis

## Technical Architecture

- **Frontend**: Next.js 15 with TypeScript
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL with RLS)
- **LLM Integration**: Helicone proxy for all providers
- **Authentication**: Supabase Auth with magic links

## Contributing

We welcome contributions! Priority areas:
1. New LLM provider integrations
2. Evaluation metrics and scoring
3. UI/UX improvements
4. Documentation and examples

See the main README for development setup instructions.
