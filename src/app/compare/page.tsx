'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRuns, setSelectedRuns] = useState<string[]>([]);

  useEffect(() => {
    loadRuns();
  }, []);

  async function loadRuns() {
    try {
      const res = await fetch('/api/runs');
      const data = await res.json();
      if (!res.ok || 'error' in data) {
        setError(data.error || 'Failed to load runs');
      } else {
        setRuns(data.runs || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function toggleRun(id: string) {
    setSelectedRuns((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
    );
  }

  const selectedRunData = runs.filter((r) => selectedRuns.includes(r.id));

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Compare <span className="text-orange-400">Runs</span>
              </h1>
              <p className="text-gray-300">
                Select and compare results from your previous LLM test runs
              </p>
            </div>
            <Link 
              href="/runner"
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors duration-200"
            >
              New Run
            </Link>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <p className="mt-4 text-gray-600">Loading your runs...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-red-800">{error}</p>
            </div>
          ) : runs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No runs yet</h3>
              <p className="text-gray-600 mb-6">Create your first LLM comparison run to get started</p>
              <Link 
                href="/runner"
                className="inline-block px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors duration-200"
              >
                Create First Run
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Selection List */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Your Test Runs ({runs.length})
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Select up to 3 runs to compare side-by-side
                  </p>
                </div>
                <div className="divide-y divide-gray-200">
                  {runs.map((run) => (
                    <label
                      key={run.id}
                      className="flex items-start gap-4 p-6 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRuns.includes(run.id)}
                        onChange={() => toggleRun(run.id)}
                        disabled={!selectedRuns.includes(run.id) && selectedRuns.length >= 3}
                        className="mt-1 w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500 disabled:opacity-50"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {run.prompt.slice(0, 80)}{run.prompt.length > 80 ? '...' : ''}
                          </p>
                          <span className="text-xs text-gray-500 ml-4">
                            {new Date(run.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {run.models.map((model) => (
                            <span
                              key={model}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {model}
                            </span>
                          ))}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Comparison View */}
              {selectedRunData.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Comparison ({selectedRunData.length} runs)
                    </h2>
                  </div>
                  <div className="p-6 space-y-6">
                    {selectedRunData.map((run) => (
                      <div key={run.id} className="border border-gray-200 rounded-lg p-6">
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold text-gray-900">Prompt</h3>
                            <span className="text-xs text-gray-500">
                              {new Date(run.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 bg-gray-50 rounded p-3">
                            {run.prompt}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Model Results</h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-200">
                                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-900">Model</th>
                                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-900">Latency</th>
                                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-900">Tokens</th>
                                  <th className="py-2 px-3 text-left text-xs font-semibold text-gray-900">Cost</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {Object.entries(run.metrics).map(([model, metrics]) => (
                                  <tr key={model}>
                                    <td className="py-2 px-3 font-medium text-gray-900">{model}</td>
                                    <td className="py-2 px-3 text-gray-600">
                                      {metrics.error ? 'N/A' : `${metrics.latency_ms}ms`}
                                    </td>
                                    <td className="py-2 px-3 text-gray-600">
                                      {metrics.error ? 'Error' : (metrics.usage?.total_tokens ?? 'N/A')}
                                    </td>
                                    <td className="py-2 px-3 text-gray-600">
                                      {metrics.error ? 'N/A' : (metrics.cost_usd !== undefined ? `$${metrics.cost_usd.toFixed(4)}` : 'N/A')}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
