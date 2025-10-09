// src/app/api/validate/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runValidation, runAllValidations, listValidators, checkValidatorsAvailability } from '@/lib/validators';

type ValidateRequest = {
  prompt: string;
  response: string;
  context?: string | string[];
  validator?: string;
};

/**
 * GET /api/validate
 * List available validators and their availability status
 */
export async function GET() {
  try {
    const validators = listValidators();
    const availability = await checkValidatorsAvailability();
    
    return NextResponse.json({
      validators: validators.map(name => ({
        name,
        available: availability[name] ?? false,
        mode: availability[name] ? 'service' : 'demo',
      })),
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/validate
 * Run third-party validation on a response
 * Body: { prompt, response, context?, validator? }
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
      return NextResponse.json({ error: 'Invalid payload: prompt and response required' }, { status: 400 });
    }

    const { prompt, response, context, validator } = body as ValidateRequest;

    if (typeof prompt !== 'string' || typeof response !== 'string') {
      return NextResponse.json(
        { error: 'Invalid payload: prompt and response must be strings' },
        { status: 400 }
      );
    }

    // Run validation
    if (validator) {
      if (typeof validator !== 'string') {
        return NextResponse.json({ error: 'validator must be a string' }, { status: 400 });
      }
      const result = await runValidation(validator, prompt, response, context);
      return NextResponse.json({ validator, result });
    } else {
      const results = await runAllValidations(prompt, response, context);
      return NextResponse.json({ results });
    }
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : typeof err === 'string' ? err : JSON.stringify(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
