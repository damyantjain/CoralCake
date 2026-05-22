// src/app/api/evaluate/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { evaluateResponse } from '@/lib/evaluation/scoring';
import { checkRateLimit, EVALUATE_LIMITER, rateLimitHeaders } from '@/lib/ratelimit';

type EvaluateRequest = {
  prompt: string;
  response: string;
};

/**
 * POST /api/evaluate
 * Evaluates a single response against a prompt
 * Returns quality scores and metrics
 */
export async function POST(req: Request) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Rate limit (per-user)
    const limit = await checkRateLimit(EVALUATE_LIMITER, user.id);
    if (!limit.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', code: 'RATE_LIMITED' },
        { status: 429, headers: rateLimitHeaders(limit) },
      );
    }

    // Validate payload
    const body: unknown = await req.json();
    if (
      typeof body !== 'object' ||
      body === null ||
      !('prompt' in body) ||
      !('response' in body)
    ) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { prompt, response } = body as EvaluateRequest;

    if (typeof prompt !== 'string' || typeof response !== 'string') {
      return NextResponse.json({ error: 'Invalid payload: prompt and response must be strings' }, { status: 400 });
    }

    // Evaluate
    const metrics = evaluateResponse(prompt, response);

    return NextResponse.json({ metrics });
  } catch (err: unknown) {
    console.error('[api/evaluate] unexpected failure:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
