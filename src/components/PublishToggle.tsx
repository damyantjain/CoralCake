'use client';

import { useEffect, useRef, useState } from 'react';

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
      if (!res.ok) {
        setIsPublic(!next);
      }
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

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={`px-3 py-1 text-xs font-medium rounded border transition-colors ${
          isPublic
            ? 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
            : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isPublic ? 'Click to make private' : 'Click to publish (anyone with the link can view)'}
      >
        {isPublic ? 'Published' : 'Publish'}
      </button>

      {isPublic && (
        <button
          type="button"
          onClick={handleCopy}
          className="px-3 py-1 text-xs font-medium rounded border bg-white border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {copyStatus === 'copied' ? 'Copied!' : copyStatus === 'failed' ? 'Copy failed' : 'Copy link'}
        </button>
      )}
    </div>
  );
}
