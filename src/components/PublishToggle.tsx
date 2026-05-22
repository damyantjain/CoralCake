'use client';

import { useState } from 'react';

type Props = {
  benchmarkId: string;
  initialIsPublic: boolean;
};

export function PublishToggle({ benchmarkId, initialIsPublic }: Props) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [loading, setLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');

  const handleToggle = async () => {
    const next = !isPublic;
    setLoading(true);
    setIsPublic(next);

    try {
      const res = await fetch(`/api/benchmarks/${benchmarkId}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ is_public: next }),
      });
      if (!res.ok) {
        setIsPublic(!next);
      }
    } catch {
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
    setTimeout(() => setCopyStatus('idle'), 1500);
  };

  return (
    <div className="flex items-center gap-2">
      <button
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
          onClick={handleCopy}
          className="px-3 py-1 text-xs font-medium rounded border bg-white border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {copyStatus === 'copied' ? 'Copied!' : copyStatus === 'failed' ? 'Copy failed' : 'Copy link'}
        </button>
      )}
    </div>
  );
}
