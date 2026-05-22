'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

type Props = {
  benchmarkId: string;
  initialIsPublic: boolean;
};

export function PublishToggle({ benchmarkId, initialIsPublic }: Props) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [loading, setLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toggleAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      toggleAbortRef.current?.abort();
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleToggle = async () => {
    const next = !isPublic;
    setLoading(true);
    setIsPublic(next);

    toggleAbortRef.current?.abort();
    const ctrl = new AbortController();
    toggleAbortRef.current = ctrl;

    try {
      const res = await fetch(`/api/benchmarks/${benchmarkId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ is_public: next }),
        signal: ctrl.signal,
      });
      if (!res.ok) setIsPublic(!next);
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') return;
      setIsPublic(!next);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => {
      setCopyStatus('idle');
      copyTimeoutRef.current = null;
    }, 1500);
  };

  const toggleLabel = isPublic ? 'Published' : 'Publish';
  const toggleTooltip = isPublic
    ? 'Click to make this benchmark private.'
    : 'Click to publish — anyone with the link can view.';

  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant={isPublic ? 'default' : 'outline'}
            onClick={handleToggle}
            disabled={loading}
            aria-pressed={isPublic}
          >
            {toggleLabel}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{toggleTooltip}</TooltipContent>
      </Tooltip>

      {isPublic && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleCopy}
          aria-live="polite"
        >
          {copyStatus === 'copied'
            ? 'Copied!'
            : copyStatus === 'failed'
              ? 'Copy failed'
              : 'Copy link'}
        </Button>
      )}
    </div>
  );
}
