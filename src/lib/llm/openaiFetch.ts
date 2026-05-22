// Minimal OpenAI->Helicone helper using fetch (SDK-agnostic)
import { withTimeout } from '../utils';

export type LLMResult = {
  text: string;
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  latency_ms: number;
  raw?: unknown;
};

export async function callOpenAIViaHelicone({
  model,
  messages,
  userId,
}: {
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  userId?: string;
}): Promise<LLMResult> {
  const t0 = Date.now();

  const fetchPromise = fetch('https://oai.helicone.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // OpenAI auth:
      Authorization: `Bearer ${process.env.OPENAI_API_KEY!}`,
      // Helicone auth + optional tags for dashboard filtering:
      'Helicone-Auth': `Bearer ${process.env.HELICONE_API_KEY!}`,
      ...(userId ? { 'Helicone-Property-User-Id': userId } : {}),
      'Helicone-Property-Env': process.env.NODE_ENV || 'development',
      'Helicone-Cache-Enabled': 'true',
    },
    body: JSON.stringify({ model, messages }),
  });

  const res = await withTimeout(fetchPromise, 30_000);

  const latency_ms = Date.now() - t0;
  const text = await res.text();

  if (!res.ok) {
    // surface the exact error body (helps debug)
    throw new Error(`OpenAI/Helicone ${res.status}: ${text}`);
  }

  const data = JSON.parse(text);
  const out: LLMResult = {
    text: data.choices?.[0]?.message?.content ?? '',
    usage: data.usage,
    latency_ms,
    raw: data,
  };
  return out;
}
