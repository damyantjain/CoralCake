'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ModelPicker } from './ModelPicker';
import { AVAILABLE_MODELS } from '../_hooks/useRunner';

type Props = {
  prompt: string;
  onPromptChange: (value: string) => void;
  selected: string[];
  onToggleModel: (id: string) => void;
  loading: boolean;
  msg: string | null;
  onSubmit: () => void | Promise<void>;
};

export function PromptForm({
  prompt,
  onPromptChange,
  selected,
  onToggleModel,
  loading,
  msg,
  onSubmit,
}: Props) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void onSubmit();
      }}
      className="space-y-6"
      aria-label="Run a prompt across selected models"
    >
      <div className="space-y-2">
        <Label htmlFor="prompt">Enter your prompt</Label>
        <Textarea
          id="prompt"
          value={prompt}
          onChange={(e) => onPromptChange(e.target.value)}
          rows={6}
          placeholder="Type a prompt to compare models…"
          required
        />
      </div>

      <ModelPicker models={AVAILABLE_MODELS} selected={selected} onToggle={onToggleModel} />

      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button type="submit" size="lg" disabled={loading} className="text-base">
          {loading ? 'Running…' : 'Run comparison'}
        </Button>
        {loading && (
          <span className="text-sm text-muted-foreground" role="status" aria-live="polite">
            Calling each model in parallel — this can take up to 30 seconds.
          </span>
        )}
      </div>

      {msg && (
        <Alert variant="default" role="status">
          <AlertDescription>{msg}</AlertDescription>
        </Alert>
      )}
    </form>
  );
}
