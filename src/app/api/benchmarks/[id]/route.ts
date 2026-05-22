export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type PatchBody = {
  is_public: boolean;
};

/**
 * PATCH /api/benchmarks/[id]
 * Toggle the is_public flag on a benchmark.
 * Body: { is_public: boolean }
 *
 * Authorization is enforced by the "benchmarks: owner update" RLS policy:
 * non-owners' UPDATE statements affect zero rows. We surface that as 404
 * so private slugs can't be probed.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body: unknown = await req.json();
    if (
      typeof body !== 'object' ||
      body === null ||
      !('is_public' in body) ||
      typeof (body as PatchBody).is_public !== 'boolean'
    ) {
      return NextResponse.json(
        { error: 'Invalid payload: is_public (boolean) required' },
        { status: 400 },
      );
    }

    const { is_public } = body as PatchBody;

    const { data, error } = await supabase
      .from('benchmarks')
      .update({ is_public })
      .eq('id', id)
      .select('id, is_public');

    if (error) {
      console.error('[api/benchmarks] update failed:', error);
      return NextResponse.json(
        { error: 'Could not update benchmark', code: 'DB_ERROR' },
        { status: 500 },
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, is_public: data[0].is_public });
  } catch (err: unknown) {
    console.error('[api/benchmarks] PATCH unexpected failure:', err);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 },
    );
  }
}
