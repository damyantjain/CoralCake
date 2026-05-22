'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FeedbackButtons } from '@/components/feedback/FeedbackButtons';
import { EvaluationChips } from './EvaluationChips';
import type { RunResult } from '../_hooks/useRunner';

type Props = {
  result: RunResult;
  runId: string | null;
  onFeedback: (model: string, thumbs: 'up' | 'down', stars?: number) => void;
};

export function ResultCard({ result, runId, onFeedback }: Props) {
  const { model, text, error, evaluation } = result;
  const success = !error;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <h4 className="font-mono text-sm font-semibold">{model}</h4>
            {success && runId && (
              <FeedbackButtons
                runId={runId}
                model={model}
                onFeedback={(thumbs, stars) => onFeedback(model, thumbs, stars)}
              />
            )}
          </div>
          <Badge variant={success ? 'default' : 'destructive'}>
            {success ? 'Success' : 'Error'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="bg-muted/40 rounded-lg p-4">
              <pre className="text-sm whitespace-pre-wrap leading-relaxed">
                {text || '(no text)'}
              </pre>
            </div>
            <EvaluationChips evaluation={evaluation} />
          </>
        )}
      </CardContent>
    </Card>
  );
}
