// Token prices per 1K tokens (USD). Keep this tiny and update as needed.
type Price = { inK: number; outK: number }; // dollars per 1K tokens (input/output)
const PRICES: Record<string, Price> = {
  // OpenAI pricing as of January 2025 (official pricing: $0.150/$0.600 per 1M tokens)
  'gpt-4o-mini': { inK: 0.00015, outK: 0.00060 }, // $0.15 / $0.60 per 1M tokens
  // OpenAI pricing as of January 2025 (official pricing: $2.50/$10.00 per 1M tokens)
  'gpt-4o':      { inK: 0.0025, outK: 0.01 }, // $2.50 / $10.00 per 1M tokens
  
  // Mistral pricing as of January 2025 (official pricing: €0.20/€0.60 per 1M tokens, ~$0.21/$0.63 USD)
  'mistral-small': { inK: 0.0002, outK: 0.0006 }, // ~$0.20 / $0.60 per 1M tokens
};

export type Usage = { prompt_tokens: number; completion_tokens: number; total_tokens: number };

export function estimateCostUSD(model: string, usage?: Usage): number | undefined {
  if (!usage) return undefined;
  const p = PRICES[model];
  if (!p) return undefined;
  const pt = usage.prompt_tokens;
  const ct = usage.completion_tokens;
  if (typeof pt !== 'number' || typeof ct !== 'number') return undefined;
  if (!Number.isFinite(pt) || !Number.isFinite(ct)) return undefined;
  if (pt < 0 || ct < 0) return undefined;
  const inCost = (pt / 1000) * p.inK;
  const outCost = (ct / 1000) * p.outK;
  const total = inCost + outCost;
  if (!Number.isFinite(total)) return undefined;
  // round to 6 decimal places (1/1,000,000th) to handle micro-costs accurately
  return Math.round(total * 1000000) / 1000000;
}
