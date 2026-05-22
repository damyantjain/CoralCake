import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { EvaluationMetrics } from '@/lib/evaluation/types';

type PerModelMetrics = {
  latency_ms?: number;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  cost_usd?: number;
  error?: string;
  text_len?: number;
  evaluation?: EvaluationMetrics;
};

type BenchmarkRow = {
  id: string;
  slug: string;
  prompt: string;
  models: string[];
  disagreement_score: number | null;
  is_public: boolean;
  created_at: string;
  run_id: string;
};

type RunRow = {
  metrics: Record<string, PerModelMetrics> | null;
};

type OutputRow = {
  model: string;
  output: string;
};

export default async function BenchmarkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: benchmark } = await supabase
    .from('benchmarks')
    .select('id, slug, prompt, models, disagreement_score, is_public, created_at, run_id')
    .eq('slug', slug)
    .maybeSingle<BenchmarkRow>();

  // RLS hides private benchmarks from non-owners. Treat both "no row" and
  // "RLS-denied" as 404 so we don't leak the existence of private slugs.
  if (!benchmark) notFound();

  const [{ data: run }, { data: outputs }] = await Promise.all([
    supabase
      .from('runs')
      .select('metrics')
      .eq('id', benchmark.run_id)
      .maybeSingle<RunRow>(),
    supabase
      .from('run_outputs')
      .select('model, output')
      .eq('run_id', benchmark.run_id),
  ]);

  const metrics = run?.metrics ?? {};
  const outputByModel = new Map<string, string>((outputs ?? []).map((o: OutputRow) => [o.model, o.output]));

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-6 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-gray-500">
          <span>Benchmark</span>
          <span>·</span>
          <span>{new Date(benchmark.created_at).toLocaleString()}</span>
          {!benchmark.is_public && (
            <span className="ml-2 px-2 py-0.5 rounded bg-gray-100 text-gray-600 normal-case tracking-normal">
              private
            </span>
          )}
        </div>
        <h1 className="mt-2 text-2xl sm:text-3xl font-semibold text-gray-900">
          {disagreementHeadline(benchmark.disagreement_score)}
        </h1>
        {benchmark.disagreement_score !== null && (
          <p className="mt-1 text-sm text-gray-600">
            Disagreement score: {benchmark.disagreement_score}/100
          </p>
        )}
      </header>

      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">Prompt</h2>
        <pre className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800">
          {benchmark.prompt}
        </pre>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Responses ({benchmark.models.length})
        </h2>
        {benchmark.models.map((model) => {
          const m = metrics[model] ?? {};
          const text = outputByModel.get(model) ?? '';
          return (
            <article key={model} className="rounded-lg border border-gray-200 bg-white p-4">
              <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-mono text-sm font-semibold text-gray-900">{model}</h3>
                <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                  {typeof m.latency_ms === 'number' && (
                    <Metric label="latency" value={`${m.latency_ms} ms`} />
                  )}
                  {m.usage?.total_tokens !== undefined && (
                    <Metric label="tokens" value={String(m.usage.total_tokens)} />
                  )}
                  {typeof m.cost_usd === 'number' && (
                    <Metric label="cost" value={`$${m.cost_usd.toFixed(6)}`} />
                  )}
                  {typeof m.evaluation?.qualityScore.overall === 'number' && (
                    <Metric label="quality" value={`${m.evaluation.qualityScore.overall}/100`} />
                  )}
                </dl>
              </header>
              {m.error ? (
                <p className="text-sm text-red-700">Provider error: {m.error}</p>
              ) : text ? (
                <pre className="whitespace-pre-wrap text-sm text-gray-800">{text}</pre>
              ) : (
                <p className="text-sm text-gray-500 italic">No response saved.</p>
              )}
            </article>
          );
        })}
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <span>
      <dt className="inline text-gray-500">{label}:</dt>{' '}
      <dd className="inline font-medium text-gray-800">{value}</dd>
    </span>
  );
}

function disagreementHeadline(score: number | null): string {
  if (score === null) return 'Not enough responses to compare';
  if (score < 25) return 'Models largely agreed';
  if (score < 60) return 'Models gave moderately different answers';
  return 'Models gave substantially different answers';
}
