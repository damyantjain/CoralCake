// src/app/api/batch/upload/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { parseCSV, parseJSON } from '@/lib/batch/parser';
import type { BatchPromptItem } from '@/lib/batch/types';

type UploadRequest = {
  content: string;
  format: 'csv' | 'json';
  name?: string;
};

/**
 * POST /api/batch/upload
 * Parse and validate bulk prompt upload (CSV or JSON)
 * Returns parsed prompts for preview
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
      !('content' in body) ||
      !('format' in body)
    ) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { content, format, name } = body as UploadRequest;

    if (typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    if (format !== 'csv' && format !== 'json') {
      return NextResponse.json({ error: 'Format must be csv or json' }, { status: 400 });
    }

    // Parse content based on format
    let prompts: BatchPromptItem[];
    
    try {
      if (format === 'csv') {
        prompts = parseCSV(content);
      } else {
        prompts = parseJSON(content);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: `Parse error: ${message}` }, { status: 400 });
    }

    // Validate batch size (limit to 100 prompts for now)
    if (prompts.length > 100) {
      return NextResponse.json(
        { error: 'Batch size exceeds limit of 100 prompts' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      prompts,
      count: prompts.length,
      name: name || `Batch ${new Date().toISOString().split('T')[0]}`,
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
