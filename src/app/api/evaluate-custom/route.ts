// src/app/api/evaluate-custom/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runCustomEvaluation, runAllCustomEvaluations, builtInScripts } from '@/lib/evaluation/custom';

type EvaluateCustomRequest = {
  prompt: string;
  response: string;
  scriptName?: string;
};

/**
 * GET /api/evaluate-custom
 * Lists available custom evaluation scripts
 */
export async function GET() {
  const scripts = Object.entries(builtInScripts).map(([key, script]) => ({
    id: key,
    name: script.name,
    description: script.description,
  }));
  
  return NextResponse.json({ scripts });
}

/**
 * POST /api/evaluate-custom
 * Runs custom evaluation script(s) on a response
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
      !('prompt' in body) ||
      !('response' in body)
    ) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const { prompt, response, scriptName } = body as EvaluateCustomRequest;

    if (typeof prompt !== 'string' || typeof response !== 'string') {
      return NextResponse.json(
        { error: 'Invalid payload: prompt and response must be strings' },
        { status: 400 }
      );
    }

    // Run evaluation(s)
    if (scriptName) {
      if (typeof scriptName !== 'string') {
        return NextResponse.json({ error: 'scriptName must be a string' }, { status: 400 });
      }
      const result = await runCustomEvaluation(scriptName, prompt, response);
      return NextResponse.json({ scriptName, result });
    } else {
      const results = await runAllCustomEvaluations(prompt, response);
      return NextResponse.json({ results });
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
