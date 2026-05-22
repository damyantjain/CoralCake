import { describe, expect, it } from 'vitest';
import { estimateCostUSD } from '../pricing';

describe('estimateCostUSD', () => {
  const usage = { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150 };

  it('prices gpt-4o-mini at the documented $0.15/$0.60 per 1M', () => {
    // (100/1000 * 0.00015) + (50/1000 * 0.00060) = 0.000045
    expect(estimateCostUSD('gpt-4o-mini', usage)).toBeCloseTo(0.000045, 6);
  });

  it('prices gpt-4o at the documented $2.50/$10.00 per 1M', () => {
    // (100/1000 * 0.0025) + (50/1000 * 0.01) = 0.00075
    expect(estimateCostUSD('gpt-4o', usage)).toBeCloseTo(0.00075, 6);
  });

  it('prices mistral-small at the documented ~$0.20/$0.60 per 1M', () => {
    // (100/1000 * 0.0002) + (50/1000 * 0.0006) = 0.00005
    expect(estimateCostUSD('mistral-small', usage)).toBeCloseTo(0.00005, 6);
  });

  it('returns undefined for unknown models', () => {
    expect(estimateCostUSD('not-a-real-model', usage)).toBeUndefined();
  });

  it('returns undefined when usage is missing', () => {
    expect(estimateCostUSD('gpt-4o', undefined)).toBeUndefined();
  });

  it('returns undefined when a token field is missing', () => {
    expect(
      estimateCostUSD('gpt-4o', { completion_tokens: 50, total_tokens: 50 } as never),
    ).toBeUndefined();
  });

  it('returns undefined when a token field is NaN', () => {
    expect(
      estimateCostUSD('gpt-4o', { prompt_tokens: NaN, completion_tokens: 50, total_tokens: 50 }),
    ).toBeUndefined();
  });

  it('returns undefined when a token count is negative', () => {
    expect(
      estimateCostUSD('gpt-4o', { prompt_tokens: -1, completion_tokens: 50, total_tokens: 49 }),
    ).toBeUndefined();
  });

  it('returns undefined when a token count is Infinity', () => {
    expect(
      estimateCostUSD('gpt-4o', {
        prompt_tokens: Infinity,
        completion_tokens: 0,
        total_tokens: Infinity,
      }),
    ).toBeUndefined();
  });

  it('returns 0 for zero usage', () => {
    expect(
      estimateCostUSD('gpt-4o', { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }),
    ).toBe(0);
  });
});
