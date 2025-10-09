// src/lib/validators/types.ts

/**
 * Base interface for third-party validator results
 */
export type ValidatorResult = {
  validator: string;           // Name of the validator (e.g., 'ragas', 'trulens')
  overall_score: number;        // 0-100 overall quality score
  metrics: Record<string, number | string | boolean>;  // Validator-specific metrics
  timestamp: string;            // ISO timestamp
  notes?: string;               // Optional additional information
};

/**
 * Configuration for RAGAS validation
 */
export type RAGASConfig = {
  apiKey?: string;              // API key if using cloud service
  endpoint?: string;            // Custom endpoint if self-hosted
  metrics?: string[];           // Specific metrics to evaluate (context_precision, faithfulness, etc.)
};

/**
 * RAGAS validation result
 * Based on RAGAS metrics: https://docs.ragas.io/en/latest/concepts/metrics/index.html
 */
export type RAGASResult = ValidatorResult & {
  validator: 'ragas';
  metrics: {
    context_precision?: number;     // 0-1: Relevance of retrieved context
    context_recall?: number;        // 0-1: How much of ground truth is in context
    faithfulness?: number;          // 0-1: Factual accuracy relative to context
    answer_relevancy?: number;      // 0-1: How relevant the answer is to the question
    context_entity_recall?: number; // 0-1: Entity recall from context
    answer_similarity?: number;     // 0-1: Semantic similarity to reference answer
    answer_correctness?: number;    // 0-1: Correctness of the answer
  };
};

/**
 * Configuration for TruLens validation
 */
export type TruLensConfig = {
  apiKey?: string;              // API key for TruLens service
  endpoint?: string;            // Custom endpoint if self-hosted
  appId?: string;               // TruLens application ID
};

/**
 * TruLens validation result
 * Based on TruLens evaluation: https://www.trulens.org/
 */
export type TruLensResult = ValidatorResult & {
  validator: 'trulens';
  metrics: {
    groundedness?: number;          // 0-1: Is the response grounded in context?
    answer_relevance?: number;      // 0-1: Relevance to the question
    context_relevance?: number;     // 0-1: Relevance of retrieved context
    toxicity?: number;              // 0-1: Toxicity score (lower is better)
    bias?: number;                  // 0-1: Bias detection (lower is better)
    coherence?: number;             // 0-1: Response coherence
  };
};

/**
 * Generic validator function signature
 */
export type ValidatorFunction<T extends ValidatorResult = ValidatorResult> = (
  prompt: string,
  response: string,
  context?: string | string[],
  config?: Record<string, unknown>
) => Promise<T>;

/**
 * Registry of available validators
 */
export type ValidatorRegistry = {
  ragas?: ValidatorFunction<RAGASResult>;
  trulens?: ValidatorFunction<TruLensResult>;
  [key: string]: ValidatorFunction | undefined;
};
