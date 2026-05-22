'use client';

import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

type Props = {
  benchmarkSlug: string | null;
  benchmarkError: 'save_failed' | null;
  disagreementScore: number | null;
  copied: boolean;
  onCopy: () => void;
};

function disagreementLabel(score: number | null): string {
  if (score === null) return '';
  if (score < 25) return 'Models largely agreed';
  if (score < 60) return 'Moderate disagreement';
  return 'Substantial disagreement';
}

export function SavedBenchmarkBanner({
  benchmarkSlug,
  benchmarkError,
  disagreementScore,
  copied,
  onCopy,
}: Props) {
  if (benchmarkSlug) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
        <div className="text-sm text-foreground">
          <span className="font-semibold">Saved.</span>{' '}
          <a
            href={`/b/${benchmarkSlug}`}
            className="font-mono underline underline-offset-4 hover:text-primary"
          >
            /b/{benchmarkSlug}
          </a>
          {disagreementScore !== null && (
            <span className="ml-3 text-muted-foreground">
              · {disagreementLabel(disagreementScore)} ({disagreementScore}/100)
            </span>
          )}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onCopy}
          aria-live="polite"
        >
          {copied ? 'Copied!' : 'Copy link'}
        </Button>
      </div>
    );
  }
  if (benchmarkError === 'save_failed') {
    return (
      <Alert>
        <AlertDescription>
          Run completed, but the shareable link couldn&apos;t be created. Your results are still
          saved to your account.
        </AlertDescription>
      </Alert>
    );
  }
  return null;
}
