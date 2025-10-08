'use client';

import { useState } from 'react';
import type { EvaluationMetrics } from '@/lib/evaluation/types';

type Usage = { prompt_tokens: number; completion_tokens: number; total_tokens: number };
type Result = { 
  model: string; 
  text: string; 
  latency_ms: number; 
  usage?: Usage; 
  cost_usd?: number; 
  error?: string;
  evaluation?: EvaluationMetrics;
};
type RunResponse = { results: Result[] } | { error: string };

const AVAILABLE_MODELS = [
  { id: 'gpt-4o-mini', label: 'OpenAI: gpt-4o-mini' },
  { id: 'gpt-4o', label: 'OpenAI: gpt-4o' },
  { id: 'mistral-small', label: 'Mistral: mistral-small' },
];

export default function RunnerPage() {
  const [prompt, setPrompt] = useState('');
  const [selected, setSelected] = useState<string[]>([AVAILABLE_MODELS[0].id]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  function toggleModel(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }

  async function onRun(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setResults([]);
    if (!prompt.trim() || selected.length === 0) {
      setMsg('Enter a prompt and pick at least one model.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, models: selected }),
      });
      const data: RunResponse = await res.json();
      if (!res.ok || 'error' in data) {
        setMsg(('error' in data && data.error) || 'Run failed');
      } else {
        setResults(data.results);
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  function exportResults(format: 'json' | 'csv') {
    if (results.length === 0) return;
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify({ prompt, results }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `llm-comparison-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const headers = ['Model', 'Latency (ms)', 'Prompt Tokens', 'Completion Tokens', 'Total Tokens', 'Cost (USD)', 'Response Length', 'Status'];
      const rows = results.map(r => [
        r.model,
        r.latency_ms || '',
        r.usage?.prompt_tokens || '',
        r.usage?.completion_tokens || '',
        r.usage?.total_tokens || '',
        r.cost_usd?.toFixed(4) || '',
        r.text?.length || '',
        r.error ? 'Error' : 'Success'
      ]);
      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `llm-comparison-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
              LLM Prompt <span className="text-orange-400">Runner</span>
            </h1>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto">
              Test your prompts across multiple language models and compare their performance in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <form onSubmit={onRun} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Enter Your Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={6}
                placeholder="Type a prompt to compare models…"
                className="w-full rounded-lg border border-gray-300 p-4 text-sm duration-200 text-gray-900"
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Select Models to Compare
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {AVAILABLE_MODELS.map((m) => (
                  <label key={m.id} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200">
                    <input
                      type="checkbox"
                      checked={selected.includes(m.id)}
                      onChange={() => toggleModel(m.id)}
                      className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-900">{m.label}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Running…' : 'Run Comparison'}
            </button>
          </form>

          {msg && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="text-sm text-amber-800 font-medium">{msg}</div>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-8 mt-8">
              {/* Export Buttons */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => exportResults('csv')}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export CSV
                </button>
                <button
                  onClick={() => exportResults('json')}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export JSON
                </button>
              </div>

              {/* Results Summary */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Summary</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-900">Model</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-900">Quality Score</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-900">Latency</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-900">Tokens</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-900">Cost</th>
                        <th className="py-3 px-4 text-left text-sm font-semibold text-gray-900">Response Length</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {results.map((r) => (
                        <tr key={r.model} className="hover:bg-white">
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">{r.model}</td>
                          <td className="py-3 px-4 text-sm">
                            {r.evaluation ? (
                              <div className="flex items-center gap-2">
                                <span 
                                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold ${
                                    r.evaluation.qualityScore.overall >= 80 ? 'bg-green-100 text-green-800' :
                                    r.evaluation.qualityScore.overall >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-orange-100 text-orange-800'
                                  }`}
                                >
                                  {r.evaluation.qualityScore.overall}/100
                                </span>
                                <span className="text-xs text-gray-500" title={`Relevance: ${r.evaluation.qualityScore.relevance}, Coherence: ${r.evaluation.qualityScore.coherence}, Readability: ${r.evaluation.qualityScore.readability}`}>
                                  ⓘ
                                </span>
                              </div>
                            ) : '—'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {r.latency_ms ? `${r.latency_ms}ms` : '—'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {r.usage
                              ? `${r.usage.prompt_tokens} / ${r.usage.completion_tokens} / ${r.usage.total_tokens}`
                              : '—'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {typeof r.cost_usd === 'number' ? `$${r.cost_usd.toFixed(4)}` : '—'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {r.text ? `${r.text.length} chars` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {results.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="text-sm text-orange-800">
                        <span className="font-semibold">Total Cost:</span>{' '}
                        <span className="font-bold">
                          ${results.reduce((sum, r) => sum + (r.cost_usd ?? 0), 0).toFixed(4)}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="text-sm text-blue-800">
                        <span className="font-semibold">Avg Latency:</span>{' '}
                        <span className="font-bold">
                          {Math.round(results.reduce((sum, r) => sum + (r.latency_ms ?? 0), 0) / results.length)}ms
                        </span>
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="text-sm text-green-800">
                        <span className="font-semibold">Total Tokens:</span>{' '}
                        <span className="font-bold">
                          {results.reduce((sum, r) => sum + (r.usage?.total_tokens ?? 0), 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Detailed Responses */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Responses</h3>
                <div className="grid gap-6">
                  {results.map((r) => (
                    <div key={r.model} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-200">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-semibold text-gray-900">{r.model}</h4>
                        {r.error ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Error
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Success
                          </span>
                        )}
                      </div>
                      {r.error ? (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="text-sm text-red-700">{r.error}</div>
                        </div>
                      ) : (
                        <>
                          <div className="bg-gray-50 rounded-lg p-4">
                            <pre className="text-sm whitespace-pre-wrap text-gray-700 leading-relaxed">
                              {r.text || '(no text)'}
                            </pre>
                          </div>
                          {r.evaluation && (
                            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                                <div className="text-xs text-purple-600 font-medium mb-1">Relevance</div>
                                <div className="text-lg font-bold text-purple-800">{r.evaluation.qualityScore.relevance}</div>
                              </div>
                              <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                                <div className="text-xs text-blue-600 font-medium mb-1">Coherence</div>
                                <div className="text-lg font-bold text-blue-800">{r.evaluation.qualityScore.coherence}</div>
                              </div>
                              <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                                <div className="text-xs text-green-600 font-medium mb-1">Readability</div>
                                <div className="text-lg font-bold text-green-800">{r.evaluation.qualityScore.readability}</div>
                              </div>
                              <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                                <div className="text-xs text-orange-600 font-medium mb-1">Overall</div>
                                <div className="text-lg font-bold text-orange-800">{r.evaluation.qualityScore.overall}</div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
