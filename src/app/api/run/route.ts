// src/app/api/run/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { callOpenAIViaHelicone, type LLMResult } from '@/lib/llm/openaiFetch';
import { callMistralViaHelicone } from '@/lib/llm/mistralFetch';
import { estimateCostUSD, type Usage } from '@/lib/llm/pricing';
import { withTimeout } from '@/lib/utils';
import { evaluateResponse } from '@/lib/evaluation/scoring';
import type { EvaluationMetrics } from '@/lib/evaluation/types';
import {
  checkRateLimit,
  clientIp,
  rateLimitHeaders,
  RUN_LIMITER,
  RUN_LIMITER_IP,
} from '@/lib/ratelimit';

type RunRequest = {
  prompt: string;
  models: string[];
};

type PerModelMetrics = {
  latency_ms: number;
  usage?: Usage;
  cost_usd?: number;
  error?: string;
  text_len?: number;
  evaluation?: EvaluationMetrics;
};

type RunResult = {
  model: string;
  text: string;
  latency_ms: number;
  usage?: Usage;
  cost_usd?: number;
  error?: string;
  evaluation?: EvaluationMetrics;
};

type RunResponse = {
  results: RunResult[];
  runId?: string;
};

type Ok = { model: string; ok: true; text: string; latency_ms: number; usage?: Usage };
type Err = { model: string; ok: false; text: ''; latency_ms: 0; error: string };

export async function POST(req: Request) {
  try {
    if (process.env.DISABLE_LLM_RUNS === 'true') {
      return NextResponse.json(
        { error: 'LLM runs are temporarily disabled', code: 'DISABLED' },
        { status: 503 },
      );
    }

    // 1) Auth: who is calling?
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 2) Rate limit (per-user + per-IP)
    const ipResult = await checkRateLimit(RUN_LIMITER_IP, clientIp(req));
    const userResult = await checkRateLimit(RUN_LIMITER, user.id);
    const limited = !userResult.success ? userResult : !ipResult.success ? ipResult : null;
    if (limited) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', code: 'RATE_LIMITED' },
        { status: 429, headers: rateLimitHeaders(limited) },
      );
    }

    // 3) Validate payload
    const { prompt, models }: RunRequest = await req.json();
    if (typeof prompt !== 'string' || !Array.isArray(models) || models.length === 0) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // 3) Fan out calls in parallel (per model)
    const calls: Promise<Ok | Err>[] = models.map(async (model): Promise<Ok | Err> => {
    try {
        // Route to appropriate provider based on model prefix
        let llmCall: Promise<LLMResult>;
        if (model.startsWith('gpt-')) {
          llmCall = callOpenAIViaHelicone({
            model,
            userId: user.id,
            messages: [
              { role: 'system', content: 'You are a concise assistant.' },
              { role: 'user', content: prompt },
            ],
          });
        } else if (model.startsWith('mistral-')) {
          llmCall = callMistralViaHelicone({
            model,
            userId: user.id,
            messages: [
              { role: 'system', content: 'You are a concise assistant.' },
              { role: 'user', content: prompt },
            ],
          });
        } else {
          throw new Error(`Unsupported model prefix: ${model}`);
        }

        const r: LLMResult = await withTimeout(llmCall, 30_000);

        return {
        model,
        ok: true as const,             // literal true
        text: r.text,
        latency_ms: r.latency_ms,
        usage: r.usage,
        };
    } catch (err: unknown) {
        // Log full provider error server-side, but return a generic message to the client
        // so we don't leak provider response bodies, model IDs, or rate-limit metadata.
        console.error('[api/run] provider call failed:', { model, err });
        return {
        model,
        ok: false as const,
        text: '',
        latency_ms: 0 as const,
        error: 'Provider request failed',
        };
    }
    });

    const settled = await Promise.all(calls);

    // 4) Persist run metrics (not storing full outputs; just metrics)
    const metrics: Record<string, PerModelMetrics> = {};
    const results: RunResult[] = [];

    for (const r of settled) {
      if (r.ok) {
        const cost = estimateCostUSD(r.model, r.usage);
        const evaluation = evaluateResponse(prompt, r.text);
        metrics[r.model] = {
          latency_ms: r.latency_ms,
          usage: r.usage,
          cost_usd: cost,
          text_len: r.text.length,
          evaluation,
        };
        results.push({
          model: r.model,
          text: r.text,
          latency_ms: r.latency_ms,
          usage: r.usage,
          cost_usd: cost,
          evaluation,
        });
      } else {
        metrics[r.model] = { latency_ms: 0, error: r.error };
        results.push({
          model: r.model,
          text: '',
          latency_ms: 0,
          error: r.error,
        });
      }
    }

    // 4) Save the run row first (to get run_id)
    const { data: inserted, error: dbErr } = await supabase
    .from('runs')
    .insert({
        user_id: user.id,
        prompt,
        models,
        metrics,
    })
    .select('id')   // <-- return the id of the inserted row
    .single();

    if (dbErr || !inserted?.id) {
        console.error('Failed to save run:', dbErr?.message);
        // Not fatal; still return the results to the client
        } else {
        // 4b) Save per-model outputs for this run
        const rows = results
            .filter(r => !r.error && r.text)
            .map(r => ({
            run_id: inserted.id,
            user_id: user.id,   // RLS check
            model: r.model,
            output: r.text,
            }));

        if (rows.length > 0) {
            const { error: outErr } = await supabase.from('run_outputs').insert(rows);
            if (outErr) {
            console.error('Failed to save outputs:', outErr.message);
            // Not fatal; keep responding with results
            }
        }
    }

    // 5) Respond
    return NextResponse.json({ results, runId: inserted?.id } satisfies RunResponse);

  } catch (err: unknown) {
    console.error('[api/run] unexpected failure:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
