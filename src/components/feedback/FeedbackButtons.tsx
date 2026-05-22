'use client';

import { useState } from 'react';
import { ThumbsDown, ThumbsUp, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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

  const handleThumbsChange = (value: string) => {
    // ToggleGroup with type="single" allows deselect → empty string
    const next = value === 'up' || value === 'down' ? value : null;
    setThumbs(next);
    void send(next, stars);
  };

  const handleStarClick = (value: number) => {
    setStars(value);
    void send(thumbs, value);
  };

  return (
    <div className="flex items-center gap-3">
      <ToggleGroup
        type="single"
        value={thumbs ?? ''}
        onValueChange={handleThumbsChange}
        disabled={busy}
        aria-label="Rate this response"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem
              value="up"
              size="sm"
              aria-label="Good response"
              className="data-[state=on]:bg-green-100 data-[state=on]:text-green-700"
            >
              <ThumbsUp className="size-4" aria-hidden="true" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>Good response</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <ToggleGroupItem
              value="down"
              size="sm"
              aria-label="Poor response"
              className="data-[state=on]:bg-destructive/10 data-[state=on]:text-destructive"
            >
              <ThumbsDown className="size-4" aria-hidden="true" />
            </ToggleGroupItem>
          </TooltipTrigger>
          <TooltipContent>Poor response</TooltipContent>
        </Tooltip>
      </ToggleGroup>

      <Button
        type="button"
        size="sm"
        variant="ghost"
        aria-expanded={showStars}
        onClick={() => setShowStars((v) => !v)}
        className="text-xs"
      >
        {showStars ? 'Hide rating' : 'Rate'}
      </Button>

      {showStars && (
        <div role="radiogroup" aria-label="Star rating" className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((value) => {
            const filled = stars >= value;
            return (
              <Tooltip key={value}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={stars === value}
                    aria-label={`${value} star${value === 1 ? '' : 's'}`}
                    disabled={busy}
                    onClick={() => handleStarClick(value)}
                    className={cn(
                      'rounded-sm p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      filled ? 'text-amber-400' : 'text-muted-foreground hover:text-amber-300',
                      busy && 'opacity-50',
                    )}
                  >
                    <Star
                      className="size-5"
                      fill={filled ? 'currentColor' : 'none'}
                      aria-hidden="true"
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{value} star{value === 1 ? '' : 's'}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      )}
    </div>
  );
}
