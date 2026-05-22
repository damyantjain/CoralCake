// src/app/api/auth/sync/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClientAction } from '@/lib/supabase/server-action';

export async function POST(req: Request) {
  const supabase = await createClientAction();

  // Accept either tokens or a clear instruction
  const { access_token, refresh_token, clear } = await req.json().catch(() => ({}));

  try {
    if (clear) {
      // Clears auth cookies on the server
      await supabase.auth.signOut();
      return NextResponse.json({ ok: true, cleared: true });
    }

    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: 'Missing tokens' }, { status: 400 });
    }

    const { error } = await supabase.auth.setSession({ access_token, refresh_token });
    if (error) {
      console.error('[api/auth/sync] setSession failed:', error);
      return NextResponse.json({ error: 'Could not sync session', code: 'AUTH_ERROR' }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[api/auth/sync] unexpected failure:', e);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
