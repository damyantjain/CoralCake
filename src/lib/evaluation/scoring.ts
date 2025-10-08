// src/lib/evaluation/scoring.ts

import type { EvaluationMetrics } from './types';

/**
 * Calculate relevance score based on keyword overlap and semantic similarity
 * Simple heuristic: measures how many prompt keywords appear in response
 */
export function calculateRelevance(prompt: string, response: string): number {
  // Normalize text
  const normalizeText = (text: string) =>
    text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3); // Filter short words

  const promptWords = normalizeText(prompt);
  const responseWords = normalizeText(response);

  if (promptWords.length === 0) return 50; // Neutral score for empty prompt

  // Count how many prompt keywords appear in response
  const matchCount = promptWords.filter((word) => responseWords.includes(word)).length;
  const score = (matchCount / promptWords.length) * 100;

  // Cap at 100
  return Math.min(Math.round(score), 100);
}

/**
 * Calculate Flesch Reading Ease score
 * Higher scores indicate easier readability (0-100)
 * 90-100: Very easy (5th grade)
 * 60-70: Plain English (8th-9th grade)
 * 0-30: Very difficult (college graduate)
 */
export function calculateReadability(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const syllables = countSyllables(text);

  if (sentences.length === 0 || words.length === 0) return 50;

  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  // Flesch Reading Ease formula
  const score = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  // Normalize to 0-100 range
  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Count syllables in text (approximation)
 */
function countSyllables(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  let count = 0;

  for (const word of words) {
    if (word.length === 0) continue;
    // Count vowel groups as syllables
    const vowelGroups = word.match(/[aeiouy]+/g);
    count += vowelGroups ? vowelGroups.length : 1;
    // Subtract silent 'e' at end
    if (word.endsWith('e') && word.length > 2) count--;
    // Ensure at least 1 syllable per word
    if (count === 0) count = 1;
  }

  return count;
}

/**
 * Calculate coherence score based on sentence structure and flow
 * Measures: consistent sentence length, proper transitions, logical flow
 */
export function calculateCoherence(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);

  if (sentences.length === 0) return 0;
  if (sentences.length === 1) return 80; // Single sentence is inherently coherent

  // Calculate sentence length variance (lower variance = more coherent)
  const lengths = sentences.map((s) => s.trim().split(/\s+/).length);
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance =
    lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  // Lower std dev = more consistent = higher coherence
  // Normalize: stdDev of 5-10 is typical, 0 is perfect, 20+ is poor
  const consistencyScore = Math.max(0, 100 - (stdDev / 20) * 100);

  // Check for transition words (simple heuristic)
  const transitionWords = [
    'however',
    'therefore',
    'furthermore',
    'additionally',
    'moreover',
    'consequently',
    'thus',
    'hence',
    'also',
    'likewise',
  ];
  const lowerText = text.toLowerCase();
  const transitionCount = transitionWords.filter((word) => lowerText.includes(word)).length;
  const transitionScore = Math.min(100, (transitionCount / sentences.length) * 100 * 5);

  // Weighted average
  const score = consistencyScore * 0.7 + transitionScore * 0.3;

  return Math.round(score);
}

/**
 * Basic grammar check - identifies common issues
 */
export function checkGrammar(text: string): string[] {
  const issues: string[] = [];

  // Check for repeated words
  const words = text.toLowerCase().split(/\s+/);
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i] === words[i + 1] && words[i].length > 3) {
      issues.push(`Repeated word: "${words[i]}"`);
    }
  }

  // Check for multiple spaces
  if (text.includes('  ')) {
    issues.push('Multiple consecutive spaces found');
  }

  // Check for missing spaces after punctuation
  if (/[.,:;!?][a-zA-Z]/.test(text)) {
    issues.push('Missing space after punctuation');
  }

  // Check for lowercase sentence starts
  const sentences = text.split(/[.!?]+/);
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (trimmed.length > 0 && /^[a-z]/.test(trimmed)) {
      issues.push('Sentence should start with capital letter');
      break; // Only report once
    }
  }

  return issues;
}

/**
 * Calculate overall quality score for a response
 */
export function evaluateResponse(prompt: string, response: string): EvaluationMetrics {
  const relevance = calculateRelevance(prompt, response);
  const coherence = calculateCoherence(response);
  const readability = calculateReadability(response);

  // Overall is weighted average: relevance is most important
  const overall = Math.round(relevance * 0.5 + coherence * 0.3 + readability * 0.2);

  const sentences = response.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = response.split(/\s+/).filter((w) => w.length > 0);
  const avgSentenceLength = sentences.length > 0 ? words.length / sentences.length : 0;

  const grammarIssues = checkGrammar(response);

  return {
    qualityScore: {
      relevance,
      coherence,
      readability,
      overall,
    },
    sentenceCount: sentences.length,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    wordCount: words.length,
    grammarIssues: grammarIssues.length > 0 ? grammarIssues : undefined,
  };
}
