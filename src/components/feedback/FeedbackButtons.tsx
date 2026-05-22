'use client';

import { useState } from 'react';

type FeedbackButtonsProps = {
  runId?: string;
  model: string;
  onFeedback?: (thumbs: 'up' | 'down', stars?: number) => void;
};

export function FeedbackButtons({ onFeedback }: FeedbackButtonsProps) {
  const [thumbs, setThumbs] = useState<'up' | 'down' | null>(null);
  const [stars, setStars] = useState<number>(0);
  const [showStars, setShowStars] = useState(false);
  const [busy, setBusy] = useState(false);

  const send = async (
    thumbsValue: 'up' | 'down' | null,
    starsValue: number,
  ) => {
    if (busy || !onFeedback || !thumbsValue) return;
    setBusy(true);
    try {
      onFeedback(thumbsValue, starsValue > 0 ? starsValue : undefined);
    } finally {
      setBusy(false);
    }
  };

  const handleThumbsClick = (value: 'up' | 'down') => {
    const newValue = thumbs === value ? null : value;
    setThumbs(newValue);
    void send(newValue, stars);
  };

  const handleStarClick = (value: number) => {
    setStars(value);
    void send(thumbs, value);
  };

  return (
    <div className="flex items-center gap-4">
      {/* Thumbs Up/Down */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Good response"
          aria-pressed={thumbs === 'up'}
          disabled={busy}
          onClick={() => handleThumbsClick('up')}
          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
            thumbs === 'up'
              ? 'bg-green-100 text-green-600'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
          title="Good response"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Poor response"
          aria-pressed={thumbs === 'down'}
          disabled={busy}
          onClick={() => handleThumbsClick('down')}
          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
            thumbs === 'down'
              ? 'bg-red-100 text-red-600'
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
          title="Poor response"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M18 9.5a1.5 1.5 0 11-3 0v-6a1.5 1.5 0 013 0v6zM14 9.667v-5.43a2 2 0 00-1.105-1.79l-.05-.025A4 4 0 0011.055 2H5.64a2 2 0 00-1.962 1.608l-1.2 6A2 2 0 004.44 12H8v4a2 2 0 002 2 1 1 0 001-1v-.667a4 4 0 01.8-2.4l1.4-1.866a4 4 0 00.8-2.4z" />
          </svg>
        </button>
      </div>

      {/* Star Rating Toggle */}
      <button
        type="button"
        aria-expanded={showStars}
        onClick={() => setShowStars(!showStars)}
        className="text-xs text-gray-600 hover:text-gray-900 font-medium"
      >
        {showStars ? 'Hide rating' : 'Rate'}
      </button>

      {/* Star Rating */}
      {showStars && (
        <div className="flex items-center gap-1" role="radiogroup" aria-label="Rate response">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              type="button"
              key={value}
              role="radio"
              aria-checked={stars === value}
              aria-label={`${value} star${value === 1 ? '' : 's'}`}
              disabled={busy}
              onClick={() => handleStarClick(value)}
              className="text-yellow-400 hover:text-yellow-500 transition-colors disabled:opacity-50"
            >
              <svg
                className="w-5 h-5"
                fill={stars >= value ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
