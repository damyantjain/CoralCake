'use client';

import type { EvaluationMetrics } from '@/lib/evaluation/types';

type Props = { evaluation?: EvaluationMetrics };

const dimensions = [
  { key: 'relevance', label: 'Relevance', tint: 'bg-purple-50 border-purple-200 text-purple-800' },
  { key: 'coherence', label: 'Coherence', tint: 'bg-blue-50 border-blue-200 text-blue-800' },
  { key: 'readability', label: 'Readability', tint: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
  { key: 'overall', label: 'Overall', tint: 'bg-primary/10 border-primary/30 text-primary' },
] as const;

export function EvaluationChips({ evaluation }: Props) {
  if (!evaluation) return null;
  return (
    <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {dimensions.map((d) => (
        <div key={d.key} className={`rounded-lg p-3 border ${d.tint}`}>
          <dt className="text-xs font-medium mb-1">{d.label}</dt>
          <dd className="text-lg font-bold">{evaluation.qualityScore[d.key]}</dd>
        </div>
      ))}
    </dl>
  );
}
