'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RunResult } from '../_hooks/useRunner';

type Props = {
  prompt: string;
  results: RunResult[];
};

function escapeCsvCell(v: unknown): string {
  const s = v === undefined || v === null ? '' : String(v);
  // Mitigate CSV injection in spreadsheet apps (formula prefixes).
  const needsFormulaGuard = /^[=+\-@\t\r]/.test(s);
  const safe = needsFormulaGuard ? `'${s}` : s;
  if (/[",\r\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportButtons({ prompt, results }: Props) {
  if (results.length === 0) return null;

  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ prompt, results }, null, 2)], {
      type: 'application/json',
    });
    download(`llm-comparison-${Date.now()}.json`, blob);
  };

  const exportCsv = () => {
    const headers = [
      'Model',
      'Latency (ms)',
      'Prompt Tokens',
      'Completion Tokens',
      'Total Tokens',
      'Cost (USD)',
      'Response Length',
      'Status',
    ];
    const rows = results.map((r) => [
      r.model,
      r.latency_ms || '',
      r.usage?.prompt_tokens || '',
      r.usage?.completion_tokens || '',
      r.usage?.total_tokens || '',
      r.cost_usd?.toFixed(4) || '',
      r.text?.length || '',
      r.error ? 'Error' : 'Success',
    ]);
    const csv = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(',')).join('\r\n');
    download(`llm-comparison-${Date.now()}.csv`, new Blob([csv], { type: 'text/csv' }));
  };

  return (
    <div className="flex justify-end gap-3">
      <Button type="button" variant="outline" size="sm" onClick={exportCsv}>
        <Download className="size-4" aria-hidden="true" />
        Export CSV
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={exportJson}>
        <Download className="size-4" aria-hidden="true" />
        Export JSON
      </Button>
    </div>
  );
}
