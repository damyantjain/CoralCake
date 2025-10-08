// src/lib/evaluation/types.ts

/**
 * Quality score for a single response
 */
export type QualityScore = {
  relevance: number;      // 0-100: How relevant is the response to the prompt
  coherence: number;      // 0-100: How coherent and well-structured
  readability: number;    // 0-100: Flesch reading ease score
  overall: number;        // 0-100: Weighted average
};

/**
 * Detailed evaluation metrics
 */
export type EvaluationMetrics = {
  qualityScore: QualityScore;
  sentenceCount: number;
  avgSentenceLength: number;
  wordCount: number;
  grammarIssues?: string[];
};

/**
 * Human feedback for a run/model
 */
export type HumanFeedback = {
  runId: string;
  model: string;
  thumbs?: 'up' | 'down';
  stars?: number;          // 1-5
  comment?: string;
};

/**
 * Custom evaluation result
 */
export type CustomEvaluation = {
  scriptName: string;
  metrics: Record<string, number | string | boolean>;
};
