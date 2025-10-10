// src/lib/batch/types.ts
// Type definitions for batch prompt testing

export type BatchPromptItem = {
  prompt: string;
  expected_output?: string;
  tags?: string[];
};

export type BatchStatus = 'pending' | 'running' | 'completed' | 'failed';

export type BatchJobProgress = {
  total: number;
  completed: number;
  failed: number;
  running: number;
};

export type BatchRunMetadata = {
  id: string;
  user_id: string;
  name: string;
  status: BatchStatus;
  progress: BatchJobProgress;
  models: string[];
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error?: string;
};

export type BatchPromptResult = {
  prompt_index: number;
  prompt: string;
  model: string;
  text: string;
  latency_ms: number;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  cost_usd?: number;
  error?: string;
  evaluation?: {
    qualityScore: {
      overall: number;
      relevance: number;
      coherence: number;
      readability: number;
    };
  };
};

export type BatchSummary = {
  total_prompts: number;
  total_runs: number;
  success_rate: number;
  failed_count: number;
  avg_latency_ms: number;
  total_cost_usd: number;
  avg_cost_per_prompt: number;
  models: string[];
  by_model: Record<string, {
    success_count: number;
    failed_count: number;
    avg_latency_ms: number;
    total_cost_usd: number;
    avg_quality_score?: number;
  }>;
};
