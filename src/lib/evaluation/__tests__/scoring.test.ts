import { describe, expect, it } from 'vitest';
import {
  calculateCoherence,
  calculateReadability,
  calculateRelevance,
  checkGrammar,
  evaluateResponse,
} from '../scoring';

describe('evaluateResponse', () => {
  it('returns undefined for an empty response (no garbage metrics persisted)', () => {
    expect(evaluateResponse('what is the capital of France?', '')).toBeUndefined();
  });

  it('returns undefined for a whitespace-only response', () => {
    expect(evaluateResponse('prompt', '   \n  \t')).toBeUndefined();
  });

  it('returns a populated metrics object for real text', () => {
    const m = evaluateResponse(
      'Explain photosynthesis briefly.',
      'Plants use sunlight to convert carbon dioxide and water into glucose and oxygen.',
    );
    expect(m).toBeDefined();
    expect(m!.qualityScore.overall).toBeGreaterThanOrEqual(0);
    expect(m!.qualityScore.overall).toBeLessThanOrEqual(100);
    expect(m!.wordCount).toBeGreaterThan(0);
    expect(m!.sentenceCount).toBeGreaterThan(0);
  });
});

describe('calculateCoherence — transition-word detection', () => {
  // The pass-1 fix moved away from `String.includes(word)` substring matches
  // so partials like "howevermore" or "alsoxyz" must not count as a match.
  it('does not match a transition word that appears inside a longer token', () => {
    // Both strings have 3 sentences, 3 words each — identical
    // sentence-length variance → identical consistency component. The
    // only meaningful difference is "howevermore" (which must NOT match
    // "however") vs. "differential" (no candidate). If the partial were
    // counted, the first string's coherence would jump.
    const withSubstring = calculateCoherence(
      'Howevermore words words. Words words words. Words words words.',
    );
    const withoutMatches = calculateCoherence(
      'Differential words words. Words words words. Words words words.',
    );
    expect(withSubstring).toBe(withoutMatches);
  });

  it('does match a real whole-word transition', () => {
    const withTransition = calculateCoherence(
      'This is one sentence. However, this is another sentence. A third sentence.',
    );
    const withoutTransition = calculateCoherence(
      'This is one sentence. This is another sentence. A third sentence.',
    );
    expect(withTransition).toBeGreaterThan(withoutTransition);
  });

  it('clamps the final score to 100 even with many transitions', () => {
    const heavyTransitions =
      'However. Therefore. Furthermore. Additionally. Moreover. Consequently. Thus. Hence. Also. Likewise.';
    const score = calculateCoherence(heavyTransitions);
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('returns 0 for empty text', () => {
    expect(calculateCoherence('')).toBe(0);
  });
});

describe('calculateReadability — syllable counting per word', () => {
  // The pass-1 fix made the per-word minimum apply per word, not to the
  // running global counter. Single-syllable short words must count as 1
  // syllable each, not 0.
  it('produces a finite, in-range score for short single-syllable words', () => {
    const score = calculateReadability('A cat sat on a mat. The dog ran. The boy fell.');
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
    expect(Number.isFinite(score)).toBe(true);
  });

  it('returns the neutral 50 for empty text', () => {
    expect(calculateReadability('')).toBe(50);
  });

  it('returns a lower score for long, multi-syllable words than for simple text', () => {
    const easy = calculateReadability('The cat sat. The dog ran. The boy fell.');
    const hard = calculateReadability(
      'Antidisestablishmentarianism transcends conventional epistemological frameworks.',
    );
    expect(easy).toBeGreaterThan(hard);
  });
});

describe('calculateRelevance', () => {
  it('returns 50 (neutral) when the prompt has no usable words', () => {
    // After filtering words ≤ 3 chars, this prompt is empty.
    expect(calculateRelevance('a is an', 'anything goes here')).toBe(50);
  });

  it('returns 100 when every prompt keyword appears in the response', () => {
    expect(calculateRelevance('photosynthesis sunlight glucose', 'photosynthesis sunlight glucose')).toBe(100);
  });

  it('returns 0 when no prompt keyword appears in the response', () => {
    expect(calculateRelevance('photosynthesis sunlight glucose', 'quantum tunneling fields')).toBe(0);
  });
});

describe('checkGrammar', () => {
  it('flags repeated content words', () => {
    expect(checkGrammar('This is really really good')).toContain('Repeated word: "really"');
  });

  it('flags missing space after punctuation', () => {
    expect(checkGrammar('Hello.World is here')).toContain('Missing space after punctuation');
  });

  it('flags multiple consecutive spaces', () => {
    expect(checkGrammar('Hello  world')).toContain('Multiple consecutive spaces found');
  });

  it('returns an empty array for clean prose', () => {
    expect(checkGrammar('The quick brown fox jumps over the lazy dog.')).toEqual([]);
  });
});
