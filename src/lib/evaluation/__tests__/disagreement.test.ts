// src/lib/evaluation/__tests__/disagreement.test.ts
//
// No formal test runner is wired up yet (see pricing.test.ts for the same
// pattern). Run ad-hoc with `npx tsx src/lib/evaluation/__tests__/disagreement.test.ts`
// to smoke-check. Phase 3 will add vitest and these will become real tests.

import assert from 'node:assert/strict';
import {
  computeDisagreement,
  normalizedLevenshtein,
  tokenCosineSimilarity,
} from '../disagreement';

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`  ok  ${name}`);
  } catch (err) {
    console.error(`  FAIL ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

console.log('normalizedLevenshtein');
test('identical strings → 0', () => {
  assert.equal(normalizedLevenshtein('hello', 'hello'), 0);
});
test('one empty → 1', () => {
  assert.equal(normalizedLevenshtein('hello', ''), 1);
  assert.equal(normalizedLevenshtein('', 'hello'), 1);
});
test('single edit on short string → 1/length', () => {
  assert.equal(normalizedLevenshtein('cat', 'bat'), 1 / 3);
});
test('completely different strings → 1', () => {
  assert.equal(normalizedLevenshtein('abc', 'xyz'), 1);
});

console.log('\ntokenCosineSimilarity');
test('identical text → 1', () => {
  assert.ok(tokenCosineSimilarity('hello world', 'hello world') > 0.999);
});
test('disjoint vocabularies → 0', () => {
  assert.equal(tokenCosineSimilarity('hello world', 'foo bar'), 0);
});
test('case + punctuation insensitive', () => {
  const s = tokenCosineSimilarity('Hello, world!', 'hello world');
  assert.ok(s > 0.999);
});
test('partial overlap → 0 < x < 1', () => {
  const s = tokenCosineSimilarity('the quick brown fox', 'the lazy dog');
  assert.ok(s > 0 && s < 1);
});

console.log('\ncomputeDisagreement');
test('empty input → null', () => {
  assert.equal(computeDisagreement([]), null);
});
test('single response → null', () => {
  assert.equal(computeDisagreement([{ text: 'only one' }]), null);
});
test('errored responses dropped — single survivor → null', () => {
  assert.equal(
    computeDisagreement([{ text: 'one', error: 'boom' }, { text: 'two' }]),
    null,
  );
});
test('two identical responses → 0', () => {
  assert.equal(computeDisagreement([{ text: 'same text here' }, { text: 'same text here' }]), 0);
});
test('two totally different responses → near 100', () => {
  const score = computeDisagreement([
    { text: 'The cat sat on the mat.' },
    { text: 'Quantum physics describes subatomic particles.' },
  ]);
  assert.ok(score !== null && score > 70, `expected > 70, got ${score}`);
});
test('three responses with one outlier → between identical and totally different', () => {
  const score = computeDisagreement([
    { text: 'The capital of France is Paris.' },
    { text: 'Paris is the capital of France.' },
    { text: 'Bananas grow in tropical regions.' },
  ]);
  assert.ok(score !== null && score > 30 && score < 90, `expected mid-range, got ${score}`);
});
test('three identical responses → 0', () => {
  const score = computeDisagreement([
    { text: 'identical' },
    { text: 'identical' },
    { text: 'identical' },
  ]);
  assert.equal(score, 0);
});
test('long responses do not blow up', () => {
  const long = (seed: string) => seed.repeat(2000);
  const score = computeDisagreement([{ text: long('a') }, { text: long('b') }]);
  assert.ok(score !== null && score >= 0 && score <= 100);
});

console.log('\nDone.');
