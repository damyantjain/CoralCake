export const runtime = 'nodejs'; // ensures cookies are writable/available

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/runs
 * Body: { prompt: string, models: string[], metrics: object }
 * Effect: inserts one row owned by the signed-in user (RLS-enforced).
 */
export async function POST(req: Request) {
  // 1) Make a server-side Supabase client that reads auth cookies
  const supabase = await createClient();

  // 2) Who is calling? (null if not signed in)
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 3) Validate payload
  const body = await req.json().catch(() => null);
  const prompt: unknown = body?.prompt;
  const models: unknown = body?.models;
  const metrics: unknown = body?.metrics;

  if (typeof prompt !== 'string' || !Array.isArray(models) || typeof metrics !== 'object' || metrics === null) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  // 4) Insert with your user_id; RLS ensures user.id === auth.uid()
  const { error } = await supabase.from('runs').insert({
    user_id: user.id,
    prompt,
    models,
    metrics
  });

  if (error) {
    console.error('[api/runs] insert failed:', error);
    return NextResponse.json({ error: 'Could not save run', code: 'DB_ERROR' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('runs')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('[api/runs] query failed:', error);
    return NextResponse.json({ error: 'Could not load runs', code: 'DB_ERROR' }, { status: 500 });
  }
  return NextResponse.json({ runs: data ?? [] });
}