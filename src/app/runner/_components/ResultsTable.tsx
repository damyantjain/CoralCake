'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { RunResult } from '../_hooks/useRunner';

type Props = { results: RunResult[] };

function qualityBadgeClass(score: number) {
  if (score >= 80) return 'bg-emerald-100 text-emerald-800';
  if (score >= 60) return 'bg-amber-100 text-amber-800';
  return 'bg-orange-100 text-orange-800';
}

export function ResultsTable({ results }: Props) {
  if (results.length === 0) return null;

  const totalCost = results.reduce((sum, r) => sum + (r.cost_usd ?? 0), 0);
  const avgLatency = Math.round(
    results.reduce((sum, r) => sum + (r.latency_ms ?? 0), 0) / results.length,
  );
  const totalTokens = results.reduce((sum, r) => sum + (r.usage?.total_tokens ?? 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Performance summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th scope="col" className="py-3 px-4 text-left font-semibold">Model</th>
                <th scope="col" className="py-3 px-4 text-left font-semibold">Quality</th>
                <th scope="col" className="py-3 px-4 text-left font-semibold">Latency</th>
                <th scope="col" className="py-3 px-4 text-left font-semibold">Tokens (in/out/total)</th>
                <th scope="col" className="py-3 px-4 text-left font-semibold">Cost</th>
                <th scope="col" className="py-3 px-4 text-left font-semibold">Response length</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {results.map((r) => (
                <tr key={r.model} className="hover:bg-muted/30">
                  <td className="py-3 px-4 font-medium">{r.model}</td>
                  <td className="py-3 px-4">
                    {r.evaluation ? (
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-1 rounded text-xs font-semibold',
                          qualityBadgeClass(r.evaluation.qualityScore.overall),
                        )}
                        title={`Relevance: ${r.evaluation.qualityScore.relevance}, Coherence: ${r.evaluation.qualityScore.coherence}, Readability: ${r.evaluation.qualityScore.readability}`}
                      >
                        {r.evaluation.qualityScore.overall}/100
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {r.latency_ms ? `${r.latency_ms}ms` : '—'}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {r.usage
                      ? `${r.usage.prompt_tokens} / ${r.usage.completion_tokens} / ${r.usage.total_tokens}`
                      : '—'}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {typeof r.cost_usd === 'number' ? `$${r.cost_usd.toFixed(4)}` : '—'}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {r.text ? `${r.text.length} chars` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Summary label="Total cost" value={`$${totalCost.toFixed(4)}`} tint="primary" />
          <Summary label="Avg latency" value={`${avgLatency}ms`} tint="info" />
          <Summary label="Total tokens" value={`${totalTokens}`} tint="success" />
        </dl>
      </CardContent>
    </Card>
  );
}

function Summary({
  label,
  value,
  tint,
}: {
  label: string;
  value: string;
  tint: 'primary' | 'info' | 'success';
}) {
  const tintClass =
    tint === 'primary'
      ? 'bg-primary/5 border-primary/30 text-foreground'
      : tint === 'info'
        ? 'bg-blue-50 border-blue-200 text-blue-900'
        : 'bg-emerald-50 border-emerald-200 text-emerald-900';
  return (
    <div className={`p-4 rounded-lg border ${tintClass}`}>
      <dt className="text-sm font-semibold">{label}</dt>
      <dd className="text-base font-bold">{value}</dd>
    </div>
  );
}
