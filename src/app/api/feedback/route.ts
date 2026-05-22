// src/app/api/feedback/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type FeedbackRequest = {
  runId: string;
  model: string;
  thumbs?: 'up' | 'down';
  stars?: number;
  comment?: string;
};

/**
 * POST /api/feedback
 * Save human feedback for a specific run/model combination
 * Body: { runId, model, thumbs?, stars?, comment? }
 */
export async function POST(req: Request) {
  try {
    // 1) Auth: who is calling?
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 2) Validate payload
    const body: unknown = await req.json();
    if (
      typeof body !== 'object' ||
      body === null ||
      !('runId' in body) ||
      !('model' in body)
    ) {
      return NextResponse.json({ error: 'Invalid payload: runId and model required' }, { status: 400 });
    }

    const { runId, model, thumbs, stars, comment } = body as FeedbackRequest;

    // Validate types
    if (typeof runId !== 'string' || typeof model !== 'string') {
      return NextResponse.json({ error: 'runId and model must be strings' }, { status: 400 });
    }

    if (thumbs !== undefined && thumbs !== 'up' && thumbs !== 'down') {
      return NextResponse.json({ error: 'thumbs must be "up" or "down"' }, { status: 400 });
    }

    if (stars !== undefined && (typeof stars !== 'number' || stars < 1 || stars > 5)) {
      return NextResponse.json({ error: 'stars must be a number between 1 and 5' }, { status: 400 });
    }

    if (comment !== undefined && typeof comment !== 'string') {
      return NextResponse.json({ error: 'comment must be a string' }, { status: 400 });
    }

    const MAX_COMMENT_LEN = 2000;
    if (typeof comment === 'string' && comment.length > MAX_COMMENT_LEN) {
      return NextResponse.json(
        { error: `comment must be at most ${MAX_COMMENT_LEN} characters` },
        { status: 400 },
      );
    }

    const MAX_RUN_ID_LEN = 100;
    const MAX_MODEL_LEN = 100;
    if (runId.length === 0 || runId.length > MAX_RUN_ID_LEN || model.length === 0 || model.length > MAX_MODEL_LEN) {
      return NextResponse.json({ error: 'Invalid runId or model' }, { status: 400 });
    }

    // 3) Check if feedback already exists for this run/model combination.
    // .maybeSingle() returns { data: null } for zero rows instead of an
    // error — matches our intent of "find one if it exists."
    const { data: existing } = await supabase
      .from('feedback')
      .select('id')
      .eq('run_id', runId)
      .eq('model', model)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      // Update existing feedback — re-assert user_id on UPDATE so the
      // write is atomically scoped to the caller's rows even if `existing`
      // is stale.
      const { error } = await supabase
        .from('feedback')
        .update({
          thumbs,
          stars,
          comment,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .eq('user_id', user.id);

      if (error) {
        console.error('[api/feedback] update failed:', error);
        return NextResponse.json({ error: 'Could not save feedback', code: 'DB_ERROR' }, { status: 500 });
      }

      return NextResponse.json({ ok: true, updated: true });
    } else {
      // Insert new feedback
      const { error } = await supabase.from('feedback').insert({
        user_id: user.id,
        run_id: runId,
        model,
        thumbs,
        stars,
        comment,
      });

      if (error) {
        console.error('[api/feedback] insert failed:', error);
        return NextResponse.json({ error: 'Could not save feedback', code: 'DB_ERROR' }, { status: 500 });
      }

      return NextResponse.json({ ok: true, created: true });
    }
  } catch (err: unknown) {
    console.error('[api/feedback] POST unexpected failure:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/feedback?runId={runId}
 * Get all feedback for a specific run
 */
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const url = new URL(req.url);
    const runId = url.searchParams.get('runId');

    if (!runId) {
      return NextResponse.json({ error: 'runId query parameter required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('run_id', runId)
      .eq('user_id', user.id);

    if (error) {
      console.error('[api/feedback] GET query failed:', error);
      return NextResponse.json({ error: 'Could not load feedback', code: 'DB_ERROR' }, { status: 500 });
    }

    return NextResponse.json({ feedback: data ?? [] });
  } catch (err: unknown) {
    console.error('[api/feedback] GET unexpected failure:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
