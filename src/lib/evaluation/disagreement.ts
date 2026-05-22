// src/lib/evaluation/disagreement.ts
//
// Measures how much a set of model responses to the same prompt disagree
// with each other. Returns a single 0–100 score where:
//   0   = all responses identical (or empty input)
//   100 = maximally divergent
//
// The score is the average of every pair's divergence. Each pair's
// divergence blends two views:
//   - lexical: normalized Levenshtein distance over the raw text
//   - semantic-ish: 1 - cosine similarity over a bag-of-tokens vector
// Neither view is perfect on its own (Levenshtein over-penalizes word
// reordering; bag-of-tokens ignores order entirely). Their average is a
// usable signal for "are these answers basically the same or not."

const MAX_COMPARE_CHARS = 5000;

export type DisagreementInput = {
  text: string;
  // Optional error flag — failed responses are excluded from the pool.
  error?: string;
};

export function computeDisagreement(responses: DisagreementInput[]): number | null {
  const usable = responses
    .filter((r) => !r.error && r.text && r.text.trim().length > 0)
    .map((r) => r.text.slice(0, MAX_COMPARE_CHARS));

  if (usable.length < 2) return null;

  const pairs: number[] = [];
  for (let i = 0; i < usable.length; i++) {
    for (let j = i + 1; j < usable.length; j++) {
      pairs.push(pairDivergence(usable[i], usable[j]));
    }
  }
  const avg = pairs.reduce((a, b) => a + b, 0) / pairs.length;
  return clamp(Math.round(avg), 0, 100);
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function pairDivergence(a: string, b: string): number {
  const lexical = normalizedLevenshtein(a, b); // 0..1
  const semantic = 1 - tokenCosineSimilarity(a, b); // 0..1
  return ((lexical + semantic) / 2) * 100;
}

// Normalized Levenshtein in [0, 1]. 0 = identical, 1 = totally different.
// Uses a single-row DP buffer; O(m*n) time, O(min(m,n)) memory.
export function normalizedLevenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0 || b.length === 0) return 1;

  // Make `a` the shorter string for the smaller buffer.
  if (a.length > b.length) [a, b] = [b, a];

  const m = a.length;
  const n = b.length;
  let prev = new Array<number>(m + 1);
  let curr = new Array<number>(m + 1);

  for (let i = 0; i <= m; i++) prev[i] = i;

  for (let j = 1; j <= n; j++) {
    curr[0] = j;
    for (let i = 1; i <= m; i++) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[i] = Math.min(
        prev[i] + 1,
        curr[i - 1] + 1,
        prev[i - 1] + cost,
      );
    }
    [prev, curr] = [curr, prev];
  }

  return prev[m] / Math.max(m, n);
}

// Cosine similarity over token bags. Both inputs are normalized to a
// lowercased word list before counting.
export function tokenCosineSimilarity(a: string, b: string): number {
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);
  if (tokensA.length === 0 || tokensB.length === 0) return 0;

  const counts = (tokens: string[]): Map<string, number> => {
    const m = new Map<string, number>();
    for (const t of tokens) m.set(t, (m.get(t) ?? 0) + 1);
    return m;
  };

  const countsA = counts(tokensA);
  const countsB = counts(tokensB);

  let dot = 0;
  for (const [tok, freq] of countsA) {
    const other = countsB.get(tok);
    if (other) dot += freq * other;
  }
  if (dot === 0) return 0;

  const magnitude = (m: Map<string, number>): number => {
    let sum = 0;
    for (const v of m.values()) sum += v * v;
    return Math.sqrt(sum);
  };

  return dot / (magnitude(countsA) * magnitude(countsB));
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}
