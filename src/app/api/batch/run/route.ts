// src/app/api/batch/run/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runBatch } from '@/lib/batch/runner';
import type { BatchPromptItem, BatchPromptResult, BatchSummary } from '@/lib/batch/types';

type BatchRunRequest = {
  prompts: BatchPromptItem[];
  models: string[];
  name?: string;
};

/**
 * POST /api/batch/run
 * Execute a batch of prompts across selected models
 * Returns results and summary statistics
 */
export async function POST(req: Request) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Validate payload
    const body: unknown = await req.json();
    if (
      typeof body !== 'object' ||
      body === null ||
      !('prompts' in body) ||
      !('models' in body)
    ) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { prompts, models, name } = body as BatchRunRequest;

    if (!Array.isArray(prompts) || prompts.length === 0) {
      return NextResponse.json({ error: 'Prompts array is required' }, { status: 400 });
    }

    if (!Array.isArray(models) || models.length === 0) {
      return NextResponse.json({ error: 'Models array is required' }, { status: 400 });
    }

    // Validate batch size
    if (prompts.length > 100) {
      return NextResponse.json(
        { error: 'Batch size exceeds limit of 100 prompts' },
        { status: 400 }
      );
    }

    // Run batch execution
    const results = await runBatch({
      prompts,
      models,
      userId: user.id,
      concurrency: 3,
    });

    // Generate summary statistics
    const summary = generateSummary(results, prompts.length, models);

    // Store batch run metadata (simplified - not using separate tables)
    const batchRecord = {
      user_id: user.id,
      prompt: `Batch: ${name || 'Unnamed'}`,
      models,
      metrics: {
        batch_size: prompts.length,
        total_runs: results.length,
        summary,
      },
    };

    const { data: inserted, error: dbErr } = await supabase
      .from('runs')
      .insert(batchRecord)
      .select('id')
      .single();

    if (dbErr) {
      console.error('Failed to save batch run:', dbErr.message);
    }

    return NextResponse.json({
      batchId: inserted?.id,
      results,
      summary,
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Generate summary statistics from batch results
 */
function generateSummary(
  results: BatchPromptResult[],
  totalPrompts: number,
  models: string[]
): BatchSummary {
  const successResults = results.filter(r => !r.error);
  const failedResults = results.filter(r => r.error);

  let totalLatency = 0;
  let totalCost = 0;

  const byModel: Record<string, {
    success_count: number;
    failed_count: number;
    avg_latency_ms: number;
    total_cost_usd: number;
    avg_quality_score?: number;
  }> = {};

  // Initialize model stats
  for (const model of models) {
    byModel[model] = {
      success_count: 0,
      failed_count: 0,
      avg_latency_ms: 0,
      total_cost_usd: 0,
      avg_quality_score: 0,
    };
  }

  // Aggregate stats
  for (const result of results) {
    if (result.error) {
      byModel[result.model].failed_count++;
    } else {
      byModel[result.model].success_count++;
      byModel[result.model].avg_latency_ms += result.latency_ms;
      byModel[result.model].total_cost_usd += result.cost_usd || 0;
      
      if (result.evaluation?.qualityScore.overall) {
        byModel[result.model].avg_quality_score = 
          (byModel[result.model].avg_quality_score || 0) + result.evaluation.qualityScore.overall;
      }

      totalLatency += result.latency_ms;
      totalCost += result.cost_usd || 0;
    }
  }

  // Calculate averages
  for (const model of models) {
    if (byModel[model].success_count > 0) {
      byModel[model].avg_latency_ms = 
        byModel[model].avg_latency_ms / byModel[model].success_count;
      
      if (byModel[model].avg_quality_score) {
        byModel[model].avg_quality_score = 
          byModel[model].avg_quality_score / byModel[model].success_count;
      }
    }
  }

  return {
    total_prompts: totalPrompts,
    total_runs: results.length,
    success_rate: successResults.length / results.length,
    failed_count: failedResults.length,
    avg_latency_ms: successResults.length > 0 ? totalLatency / successResults.length : 0,
    total_cost_usd: totalCost,
    avg_cost_per_prompt: totalPrompts > 0 ? totalCost / totalPrompts : 0,
    models,
    by_model: byModel,
  };
}
