'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type Model = { id: string; label: string };

type Props = {
  models: ReadonlyArray<Model>;
  selected: string[];
  onToggle: (id: string) => void;
};

export function ModelPicker({ models, selected, onToggle }: Props) {
  return (
    <fieldset className="space-y-3">
      <legend className="block text-sm font-semibold mb-3">Select models to compare</legend>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="group">
        {models.map((m) => {
          const checked = selected.includes(m.id);
          const id = `model-${m.id}`;
          return (
            <div
              key={m.id}
              className={cn(
                'flex items-center gap-3 p-4 border border-border rounded-lg transition-colors',
                'hover:bg-muted/40',
                checked && 'border-primary/50 bg-primary/5',
              )}
            >
              <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={() => onToggle(m.id)}
                aria-label={`Compare ${m.label}`}
              />
              <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
                {m.label}
              </Label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
