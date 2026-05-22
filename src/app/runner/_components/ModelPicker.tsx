'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { ModelOption, Provider } from '../_hooks/useRunner';

type Props = {
  models: ReadonlyArray<ModelOption>;
  selected: string[];
  onToggle: (id: string) => void;
};

function groupByProvider(models: ReadonlyArray<ModelOption>): Array<[Provider, ModelOption[]]> {
  const order: Provider[] = [];
  const byProvider = new Map<Provider, ModelOption[]>();
  for (const m of models) {
    if (!byProvider.has(m.provider)) {
      byProvider.set(m.provider, []);
      order.push(m.provider);
    }
    byProvider.get(m.provider)!.push(m);
  }
  return order.map((p) => [p, byProvider.get(p)!]);
}

export function ModelPicker({ models, selected, onToggle }: Props) {
  const groups = groupByProvider(models);

  return (
    <fieldset className="space-y-5">
      <legend className="block text-sm font-semibold mb-3">Select models to compare</legend>
      {groups.map(([provider, group]) => (
        <div key={provider}>
          <div className="mb-2 flex items-center gap-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {provider}
            </h3>
            <span className="text-xs text-muted-foreground">
              ({group.length} model{group.length === 1 ? '' : 's'})
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="group" aria-label={`${provider} models`}>
            {group.map((m) => {
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
                    aria-label={`Compare ${m.provider} ${m.label}`}
                  />
                  <Label htmlFor={id} className="text-sm font-medium cursor-pointer">
                    {m.label}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </fieldset>
  );
}
