'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

type Usage = {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
};

type ModelMetrics = {
  latency_ms: number;
  usage?: Usage;
  cost_usd?: number;
  error?: string;
  text_len?: number;
};
type Run = {
  id: string;
  prompt: string;
  models: string[];
  metrics: Record<string, ModelMetrics>;
  created_at: string;
};

export default function ComparePage() {
  const router = useRouter();
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRuns, setSelectedRuns] = useState<string[]>([]);

  useEffect(() => {
    const ctrl = new AbortController();

    (async () => {
      try {
        const res = await fetch('/api/runs', { signal: ctrl.signal });
        if (res.status === 401) {
          // Session expired between page load and this fetch.
          router.replace(`/login?redirectTo=${encodeURIComponent('/compare')}`);
          return;
        }
        const data = await res.json();
        if (!res.ok || 'error' in data) {
          setError(data.error || 'Failed to load runs');
        } else {
          setRuns(data.runs || []);
        }
      } catch (err) {
        if ((err as { name?: string })?.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [router]);

  function toggleRun(id: string) {
    setSelectedRuns((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  }

  const selectedRunData = runs.filter((r) => selectedRuns.includes(r.id));

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Compare <span className="text-primary">Runs</span>
              </h1>
              <p className="text-slate-300">
                Select and compare results from your previous LLM test runs
              </p>
            </div>
            <Button asChild>
              <Link href="/runner">New Run</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12" role="status" aria-live="polite">
              <div
                aria-hidden="true"
                className="inline-block motion-safe:animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
              />
              <p className="mt-4 text-muted-foreground">Loading your runs…</p>
            </div>
          ) : error ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : runs.length === 0 ? (
            <Card className="text-center">
              <CardContent className="py-12">
                <h3 className="text-xl font-semibold mb-2">No runs yet</h3>
                <p className="text-muted-foreground mb-6">
                  Create your first LLM comparison run to get started
                </p>
                <Button asChild>
                  <Link href="/runner">Create first run</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Selection List */}
              <Card className="overflow-hidden p-0 gap-0">
                <CardHeader className="bg-muted/40 border-b border-border py-4">
                  <CardTitle className="text-lg">Your test runs ({runs.length})</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Select up to 3 runs to compare side-by-side
                  </p>
                </CardHeader>
                <ul className="divide-y divide-border" aria-label="Past runs">
                  {runs.map((run) => {
                    const checked = selectedRuns.includes(run.id);
                    const disabled = !checked && selectedRuns.length >= 3;
                    return (
                      <li
                        key={run.id}
                        className={cn(
                          'flex items-start gap-4 p-6 transition-colors',
                          disabled ? 'opacity-60' : 'hover:bg-muted/30',
                        )}
                      >
                        <Checkbox
                          id={`run-${run.id}`}
                          checked={checked}
                          onCheckedChange={() => toggleRun(run.id)}
                          disabled={disabled}
                          className="mt-1"
                          aria-label={
                            disabled
                              ? 'Cannot select — limit of 3 reached'
                              : `Select run from ${new Date(run.created_at).toLocaleDateString()}`
                          }
                        />
                        <label htmlFor={`run-${run.id}`} className="flex-1 min-w-0 cursor-pointer">
                          <div className="flex items-center justify-between mb-2 gap-4">
                            <p className="text-sm font-medium text-foreground truncate">
                              {run.prompt.slice(0, 80)}
                              {run.prompt.length > 80 ? '…' : ''}
                            </p>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {new Date(run.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {run.models.map((model) => (
                              <Badge key={model} variant="secondary">
                                {model}
                              </Badge>
                            ))}
                          </div>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </Card>

              {/* Comparison View */}
              {selectedRunData.length > 0 && (
                <Card className="overflow-hidden p-0 gap-0">
                  <CardHeader className="bg-muted/40 border-b border-border py-4">
                    <CardTitle className="text-lg">
                      Comparison ({selectedRunData.length} run{selectedRunData.length === 1 ? '' : 's'})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {selectedRunData.map((run) => (
                      <div key={run.id} className="border border-border rounded-lg p-6">
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold">Prompt</h3>
                            <span className="text-xs text-muted-foreground">
                              {new Date(run.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm bg-muted/40 rounded p-3">{run.prompt}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold mb-3">Model results</h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className="border-b border-border">
                                  <th className="py-2 px-3 text-left text-xs font-semibold">Model</th>
                                  <th className="py-2 px-3 text-left text-xs font-semibold">Latency</th>
                                  <th className="py-2 px-3 text-left text-xs font-semibold">Tokens</th>
                                  <th className="py-2 px-3 text-left text-xs font-semibold">Cost</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-border">
                                {Object.entries(run.metrics).map(([model, metrics]) => (
                                  <tr key={model}>
                                    <td className="py-2 px-3 font-medium">{model}</td>
                                    <td className="py-2 px-3 text-muted-foreground">
                                      {metrics.error ? 'N/A' : `${metrics.latency_ms}ms`}
                                    </td>
                                    <td className="py-2 px-3 text-muted-foreground">
                                      {metrics.error
                                        ? 'Error'
                                        : (metrics.usage?.total_tokens ?? 'N/A')}
                                    </td>
                                    <td className="py-2 px-3 text-muted-foreground">
                                      {metrics.error
                                        ? 'N/A'
                                        : typeof metrics.cost_usd === 'number'
                                          ? `$${metrics.cost_usd.toFixed(4)}`
                                          : 'N/A'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
