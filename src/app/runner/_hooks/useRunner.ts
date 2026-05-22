'use client';

import { useEffect, useRef, useState } from 'react';
import type { EvaluationMetrics } from '@/lib/evaluation/types';

export type Usage = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};

export type RunResult = {
  model: string;
  text: string;
  latency_ms: number;
  usage?: Usage;
  cost_usd?: number;
  error?: string;
  evaluation?: EvaluationMetrics;
};

type RunResponse =
  | {
      results: RunResult[];
      runId?: string;
      benchmarkSlug?: string;
      benchmarkError?: 'save_failed';
      disagreementScore?: number | null;
    }
  | { error: string };

export type Provider = 'OpenAI' | 'Mistral';
export type ModelOption = { id: string; label: string; provider: Provider };

export const AVAILABLE_MODELS: readonly ModelOption[] = [
  { id: 'gpt-5', label: 'gpt-5', provider: 'OpenAI' },
  { id: 'gpt-5-mini', label: 'gpt-5-mini', provider: 'OpenAI' },
  { id: 'gpt-4o', label: 'gpt-4o', provider: 'OpenAI' },
  { id: 'gpt-4o-mini', label: 'gpt-4o-mini', provider: 'OpenAI' },
  { id: 'mistral-small', label: 'mistral-small', provider: 'Mistral' },
] as const;

export function useRunner() {
  const [prompt, setPrompt] = useState('');
  const [selected, setSelected] = useState<string[]>([AVAILABLE_MODELS[0].id]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RunResult[]>([]);
  const [runId, setRunId] = useState<string | null>(null);
  const [benchmarkSlug, setBenchmarkSlug] = useState<string | null>(null);
  const [benchmarkError, setBenchmarkError] = useState<'save_failed' | null>(null);
  const [disagreementScore, setDisagreementScore] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const runAbortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      runAbortRef.current?.abort();
      feedbackAbortRef.current?.abort();
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  function toggleModel(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  }

  async function run() {
    // Belt-and-suspenders: the submit button is disabled while loading, but
    // a determined double-tap (or programmatic dispatch) can still race
    // past `disabled`. The ref guards against a second concurrent call.
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    runAbortRef.current?.abort();
    const ctrl = new AbortController();
    runAbortRef.current = ctrl;

    setMsg(null);
    setResults([]);
    setRunId(null);
    setBenchmarkSlug(null);
    setBenchmarkError(null);
    setDisagreementScore(null);
    setCopied(false);

    if (!prompt.trim() || selected.length === 0) {
      setMsg('Enter a prompt and pick at least one model.');
      inFlightRef.current = false;
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, models: selected }),
        signal: ctrl.signal,
      });
      const data: RunResponse = await res.json();
      if (!res.ok || 'error' in data) {
        setMsg(('error' in data && data.error) || 'Run failed');
      } else {
        setResults(data.results);
        setRunId(data.runId ?? null);
        setBenchmarkSlug(data.benchmarkSlug ?? null);
        setBenchmarkError(data.benchmarkError ?? null);
        setDisagreementScore(data.disagreementScore ?? null);
      }
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') return;
      setMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }

  async function sendFeedback(model: string, thumbs: 'up' | 'down', stars?: number) {
    if (!runId) return;

    feedbackAbortRef.current?.abort();
    const ctrl = new AbortController();
    feedbackAbortRef.current = ctrl;

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ runId, model, thumbs, stars }),
        signal: ctrl.signal,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error('Failed to save feedback:', data.error);
      }
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') return;
      console.error('Failed to save feedback:', err);
    }
  }

  async function copyBenchmarkLink() {
    if (!benchmarkSlug) return;
    const url = `${window.location.origin}/b/${benchmarkSlug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copyTimeoutRef.current = null;
      }, 2000);
    } catch {
      // Clipboard API can fail in non-secure contexts; nothing to do but ignore.
    }
  }

  return {
    state: {
      prompt,
      selected,
      loading,
      results,
      runId,
      benchmarkSlug,
      benchmarkError,
      disagreementScore,
      copied,
      msg,
    },
    actions: {
      setPrompt,
      toggleModel,
      run,
      sendFeedback,
      copyBenchmarkLink,
    },
  };
}
