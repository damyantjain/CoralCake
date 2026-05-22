import { describe, expect, it } from 'vitest';
import {
  computeDisagreement,
  normalizedLevenshtein,
  tokenCosineSimilarity,
} from '../disagreement';

describe('normalizedLevenshtein', () => {
  it('returns 0 for identical strings', () => {
    expect(normalizedLevenshtein('hello', 'hello')).toBe(0);
  });

  it('returns 1 when either side is empty', () => {
    expect(normalizedLevenshtein('hello', '')).toBe(1);
    expect(normalizedLevenshtein('', 'hello')).toBe(1);
  });

  it('returns single-edit distance over length', () => {
    expect(normalizedLevenshtein('cat', 'bat')).toBeCloseTo(1 / 3, 10);
  });

  it('returns 1 for completely disjoint same-length strings', () => {
    expect(normalizedLevenshtein('abc', 'xyz')).toBe(1);
  });
});

describe('tokenCosineSimilarity', () => {
  it('returns ~1 for identical bags of tokens', () => {
    expect(tokenCosineSimilarity('hello world', 'hello world')).toBeGreaterThan(0.999);
  });

  it('returns 0 for disjoint vocabularies', () => {
    expect(tokenCosineSimilarity('hello world', 'foo bar')).toBe(0);
  });

  it('is case- and punctuation-insensitive', () => {
    expect(tokenCosineSimilarity('Hello, world!', 'hello world')).toBeGreaterThan(0.999);
  });

  it('returns a fractional value for partial overlap', () => {
    const s = tokenCosineSimilarity('the quick brown fox', 'the lazy dog');
    expect(s).toBeGreaterThan(0);
    expect(s).toBeLessThan(1);
  });
});

describe('computeDisagreement', () => {
  it('returns null for empty input', () => {
    expect(computeDisagreement([])).toBeNull();
  });

  it('returns null for a single response', () => {
    expect(computeDisagreement([{ text: 'only one' }])).toBeNull();
  });

  it('drops errored responses and returns null when only one usable response remains', () => {
    expect(
      computeDisagreement([{ text: 'one', error: 'boom' }, { text: 'two' }]),
    ).toBeNull();
  });

  it('drops empty/whitespace responses', () => {
    expect(computeDisagreement([{ text: 'real text' }, { text: '   ' }])).toBeNull();
  });

  it('returns 0 for two identical responses', () => {
    expect(
      computeDisagreement([{ text: 'same text here' }, { text: 'same text here' }]),
    ).toBe(0);
  });

  it('returns 0 for three identical responses', () => {
    expect(
      computeDisagreement([
        { text: 'identical' },
        { text: 'identical' },
        { text: 'identical' },
      ]),
    ).toBe(0);
  });

  it('returns a high score for two totally different responses', () => {
    const score = computeDisagreement([
      { text: 'The cat sat on the mat.' },
      { text: 'Quantum physics describes subatomic particles.' },
    ]);
    expect(score).not.toBeNull();
    expect(score!).toBeGreaterThan(70);
  });

  it('returns a mid-range score for three responses with one outlier', () => {
    const score = computeDisagreement([
      { text: 'The capital of France is Paris.' },
      { text: 'Paris is the capital of France.' },
      { text: 'Bananas grow in tropical regions.' },
    ]);
    expect(score).not.toBeNull();
    expect(score!).toBeGreaterThan(30);
    expect(score!).toBeLessThan(90);
  });

  it('does not blow up on long inputs and stays in [0, 100]', () => {
    const long = (seed: string) => seed.repeat(2000);
    const score = computeDisagreement([{ text: long('a') }, { text: long('b') }]);
    expect(score).not.toBeNull();
    expect(score!).toBeGreaterThanOrEqual(0);
    expect(score!).toBeLessThanOrEqual(100);
  });
});
