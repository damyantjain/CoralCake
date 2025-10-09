'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { BatchPromptItem, BatchPromptResult, BatchSummary } from '@/lib/batch/types';

const AVAILABLE_MODELS = [
  { id: 'gpt-4o-mini', label: 'OpenAI: gpt-4o-mini' },
  { id: 'gpt-4o', label: 'OpenAI: gpt-4o' },
  { id: 'mistral-small', label: 'Mistral: mistral-small' },
];

type UploadResponse = { prompts: BatchPromptItem[]; count: number; name: string } | { error: string };
type RunResponse = { batchId?: string; results: BatchPromptResult[]; summary: BatchSummary } | { error: string };

export default function BatchPage() {
  const [fileContent, setFileContent] = useState('');
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [batchName, setBatchName] = useState('');
  const [prompts, setPrompts] = useState<BatchPromptItem[]>([]);
  const [selectedModels, setSelectedModels] = useState<string[]>([AVAILABLE_MODELS[0].id]);
  const [results, setResults] = useState<BatchPromptResult[]>([]);
  const [summary, setSummary] = useState<BatchSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
      
      // Auto-detect format from file extension
      if (file.name.endsWith('.json')) {
        setFormat('json');
      } else if (file.name.endsWith('.csv')) {
        setFormat('csv');
      }
    };
    reader.readAsText(file);
  }

  async function handleParse() {
    if (!fileContent.trim()) {
      setMessage('Please upload a file first');
      return;
    }

    setUploading(true);
    setMessage(null);
    setPrompts([]);

    try {
      const res = await fetch('/api/batch/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: fileContent, format, name: batchName }),
      });

      const data: UploadResponse = await res.json();

      if (!res.ok || 'error' in data) {
        setMessage(('error' in data && data.error) || 'Upload failed');
      } else {
        setPrompts(data.prompts);
        setBatchName(data.name);
        setMessage(`Successfully parsed ${data.count} prompts`);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  }

  function toggleModel(id: string) {
    setSelectedModels((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  }

  async function handleRun() {
    if (prompts.length === 0) {
      setMessage('No prompts to run');
      return;
    }

    if (selectedModels.length === 0) {
      setMessage('Select at least one model');
      return;
    }

    setLoading(true);
    setMessage(null);
    setResults([]);
    setSummary(null);
    setProgress({ completed: 0, total: prompts.length * selectedModels.length });

    try {
      const res = await fetch('/api/batch/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompts, models: selectedModels, name: batchName }),
      });

      const data: RunResponse = await res.json();

      if (!res.ok || 'error' in data) {
        setMessage(('error' in data && data.error) || 'Batch run failed');
      } else {
        setResults(data.results);
        setSummary(data.summary);
        setMessage(`Batch completed! ${data.results.length} total runs.`);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  async function downloadTemplate() {
    try {
      const res = await fetch('/api/batch/template');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'batch-prompts-template.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : String(err));
    }
  }

  function exportResults(exportFormat: 'json' | 'csv') {
    if (results.length === 0) return;

    if (exportFormat === 'json') {
      const blob = new Blob([JSON.stringify({ results, summary }, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch-results-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const headers = ['Prompt Index', 'Prompt', 'Model', 'Status', 'Latency (ms)', 'Cost (USD)', 'Quality Score', 'Error'];
      const rows = results.map(r => [
        r.prompt_index.toString(),
        `"${r.prompt.replace(/"/g, '""')}"`,
        r.model,
        r.error ? 'Failed' : 'Success',
        r.latency_ms.toString(),
        r.cost_usd?.toFixed(4) || '',
        r.evaluation?.qualityScore.overall?.toFixed(1) || '',
        r.error ? `"${r.error.replace(/"/g, '""')}"` : '',
      ]);

      const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch-results-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Batch Prompt Testing</h1>
            <p className="text-gray-600">Upload and test multiple prompts at once</p>
          </div>
          <Link
            href="/runner"
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors duration-200"
          >
            ← Back to Single Runner
          </Link>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Step 1: Upload Prompts</h2>
          
          <div className="space-y-4">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="csv"
                    checked={format === 'csv'}
                    onChange={(e) => setFormat(e.target.value as 'csv')}
                    className="mr-2"
                  />
                  CSV
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="json"
                    checked={format === 'json'}
                    onChange={(e) => setFormat(e.target.value as 'json')}
                    className="mr-2"
                  />
                  JSON
                </label>
              </div>
            </div>

            {/* Batch Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Batch Name (optional)</label>
              <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="e.g., Product descriptions test"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload File</label>
              <input
                type="file"
                accept=".csv,.json"
                onChange={handleFileUpload}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={handleParse}
                disabled={uploading || !fileContent}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? 'Parsing...' : 'Parse & Preview'}
              </button>
              <button
                onClick={downloadTemplate}
                className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors duration-200"
              >
                Download CSV Template
              </button>
            </div>
          </div>
        </div>

        {/* Preview Section */}
        {prompts.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Step 2: Preview & Configure ({prompts.length} prompts)
            </h2>

            {/* Model Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Models</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => toggleModel(model.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                      selectedModels.includes(model.id)
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {model.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Prompts Preview */}
            <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">#</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Prompt</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Tags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prompts.map((p, i) => (
                      <tr key={i} className="border-t border-gray-200">
                        <td className="px-4 py-2 text-sm text-gray-600">{i + 1}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 max-w-md truncate">{p.prompt}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {p.tags?.join(', ') || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={handleRun}
              disabled={loading || selectedModels.length === 0}
              className="w-full px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium text-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? `Running... (${progress.completed}/${progress.total})` : `Run Batch (${prompts.length} × ${selectedModels.length} = ${prompts.length * selectedModels.length} total runs)`}
            </button>
          </div>
        )}

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('failed') || message.includes('error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {message}
          </div>
        )}

        {/* Results Section */}
        {summary && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Summary Report</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => exportResults('csv')}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Export CSV
                </button>
                <button
                  onClick={() => exportResults('json')}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Export JSON
                </button>
              </div>
            </div>

            {/* Overall Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-sm text-blue-600 font-medium mb-1">Total Runs</div>
                <div className="text-2xl font-bold text-blue-900">{summary.total_runs}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-sm text-green-600 font-medium mb-1">Success Rate</div>
                <div className="text-2xl font-bold text-green-900">{(summary.success_rate * 100).toFixed(1)}%</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <div className="text-sm text-yellow-600 font-medium mb-1">Avg Latency</div>
                <div className="text-2xl font-bold text-yellow-900">{summary.avg_latency_ms.toFixed(0)}ms</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-sm text-purple-600 font-medium mb-1">Total Cost</div>
                <div className="text-2xl font-bold text-purple-900">${summary.total_cost_usd.toFixed(4)}</div>
              </div>
            </div>

            {/* Per-Model Stats */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Model</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Success</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Failed</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Avg Latency</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Total Cost</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Avg Quality</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(summary.by_model).map(([model, stats]) => (
                    <tr key={model} className="border-t border-gray-200">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{model}</td>
                      <td className="px-4 py-3 text-sm text-green-600">{stats.success_count}</td>
                      <td className="px-4 py-3 text-sm text-red-600">{stats.failed_count}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{stats.avg_latency_ms.toFixed(0)}ms</td>
                      <td className="px-4 py-3 text-sm text-gray-600">${stats.total_cost_usd.toFixed(4)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {stats.avg_quality_score ? stats.avg_quality_score.toFixed(1) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detailed Results */}
        {results.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Detailed Results</h2>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">#</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Prompt</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Model</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Latency</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Cost</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={i} className="border-t border-gray-200">
                        <td className="px-4 py-2 text-sm text-gray-600">{r.prompt_index + 1}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 max-w-xs truncate">{r.prompt}</td>
                        <td className="px-4 py-2 text-sm text-gray-600">{r.model}</td>
                        <td className="px-4 py-2 text-sm">
                          {r.error ? (
                            <span className="text-red-600">Failed</span>
                          ) : (
                            <span className="text-green-600">Success</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">{r.latency_ms}ms</td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {r.cost_usd ? `$${r.cost_usd.toFixed(4)}` : '-'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-600">
                          {r.evaluation?.qualityScore.overall ? r.evaluation.qualityScore.overall.toFixed(1) : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
