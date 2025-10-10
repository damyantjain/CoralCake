// src/lib/batch/runner.ts
// Batch execution engine with parallel processing and progress tracking

import type { BatchPromptItem, BatchPromptResult } from './types';
import { callOpenAIViaHelicone, type LLMResult } from '@/lib/llm/openaiFetch';
import { callMistralViaHelicone } from '@/lib/llm/mistralFetch';
import { estimateCostUSD } from '@/lib/llm/pricing';
import { withTimeout } from '@/lib/utils';
import { evaluateResponse } from '@/lib/evaluation/scoring';

type BatchRunnerOptions = {
  prompts: BatchPromptItem[];
  models: string[];
  userId: string;
  concurrency?: number;
  onProgress?: (completed: number, total: number) => void;
};

type TaskResult = {
  promptIndex: number;
  model: string;
  result: BatchPromptResult;
};

/**
 * Run prompts in batch with parallel execution
 * Returns array of results for all prompt-model combinations
 */
export async function runBatch(options: BatchRunnerOptions): Promise<BatchPromptResult[]> {
  const { prompts, models, userId, concurrency = 3, onProgress } = options;
  
  // Create all tasks (prompt x model combinations)
  const tasks: Array<{ promptIndex: number; prompt: string; model: string }> = [];
  
  for (let i = 0; i < prompts.length; i++) {
    for (const model of models) {
      tasks.push({
        promptIndex: i,
        prompt: prompts[i].prompt,
        model,
      });
    }
  }

  const total = tasks.length;
  let completed = 0;
  const results: BatchPromptResult[] = [];

  // Process tasks in parallel with limited concurrency
  const executing: Promise<void>[] = [];

  for (const task of tasks) {
    const promise = executeTask(task, userId)
      .then((result) => {
        results.push(result.result);
        completed++;
        if (onProgress) {
          onProgress(completed, total);
        }
      })
      .catch((err) => {
        // Create error result
        const errorResult: BatchPromptResult = {
          prompt_index: task.promptIndex,
          prompt: task.prompt,
          model: task.model,
          text: '',
          latency_ms: 0,
          error: err instanceof Error ? err.message : String(err),
        };
        results.push(errorResult);
        completed++;
        if (onProgress) {
          onProgress(completed, total);
        }
      });

    executing.push(promise);

    // Limit concurrency
    if (executing.length >= concurrency) {
      await Promise.race(executing);
      // Remove completed promises
      for (let i = executing.length - 1; i >= 0; i--) {
        if (await isResolved(executing[i])) {
          executing.splice(i, 1);
        }
      }
    }
  }

  // Wait for remaining tasks
  await Promise.all(executing);

  return results;
}

/**
 * Execute a single prompt-model task
 */
async function executeTask(
  task: { promptIndex: number; prompt: string; model: string },
  userId: string
): Promise<TaskResult> {
  const { promptIndex, prompt, model } = task;

  let llmCall: Promise<LLMResult>;

  if (model.startsWith('gpt-')) {
    llmCall = callOpenAIViaHelicone({
      model,
      userId,
      messages: [
        { role: 'system', content: 'You are a concise assistant.' },
        { role: 'user', content: prompt },
      ],
    });
  } else if (model.startsWith('mistral-')) {
    llmCall = callMistralViaHelicone({
      model,
      userId,
      messages: [
        { role: 'system', content: 'You are a concise assistant.' },
        { role: 'user', content: prompt },
      ],
    });
  } else {
    throw new Error(`Unsupported model: ${model}`);
  }

  const llmResult = await withTimeout(llmCall, 30_000);
  const cost = estimateCostUSD(model, llmResult.usage);
  const evaluation = evaluateResponse(prompt, llmResult.text);

  const result: BatchPromptResult = {
    prompt_index: promptIndex,
    prompt,
    model,
    text: llmResult.text,
    latency_ms: llmResult.latency_ms,
    usage: llmResult.usage,
    cost_usd: cost,
    evaluation: {
      qualityScore: evaluation.qualityScore,
    },
  };

  return { promptIndex, model, result };
}

/**
 * Check if a promise is resolved (helper for concurrency control)
 */
async function isResolved<T>(promise: Promise<T>): Promise<boolean> {
  const tag = {};
  return Promise.race([promise, tag]).then(
    (val) => val !== tag,
    () => true
  );
}
