// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import axe, { type AxeResults } from 'axe-core';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ModelPicker } from '../ModelPicker';
import { SavedBenchmarkBanner } from '../SavedBenchmarkBanner';
import { ResultCard } from '../ResultCard';
import { ResultsTable } from '../ResultsTable';
import { PromptForm } from '../PromptForm';
import { EvaluationChips } from '../EvaluationChips';
import { AVAILABLE_MODELS } from '../../_hooks/useRunner';

async function runAxe(container: HTMLElement): Promise<AxeResults> {
  return axe.run(container, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
    // Keep noise out of CI: focus on critical/serious; we treat moderate as
    // a follow-up beyond the launch bar.
    resultTypes: ['violations'],
  });
}

function expectNoSeriousViolations(results: AxeResults) {
  const blocking = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );
  if (blocking.length > 0) {
    // Surface the rule + selector so a CI failure points at the actual node.
    const lines = blocking.map(
      (v) =>
        `[${v.impact}] ${v.id}: ${v.help}\n  ${v.nodes.map((n) => n.target.join(' ')).join('\n  ')}`,
    );
    throw new Error(`axe found ${blocking.length} blocking violations:\n${lines.join('\n')}`);
  }
  expect(blocking).toEqual([]);
}

// Pages whose components rely on TooltipProvider get wrapped here.
function withProviders(node: React.ReactNode) {
  return <TooltipProvider delayDuration={0}>{node}</TooltipProvider>;
}

describe('a11y — runner components', () => {
  afterEach(() => cleanup());

  it('ModelPicker has no critical/serious violations', async () => {
    const { container } = render(
      withProviders(
        <ModelPicker
          models={[
            { id: 'gpt-5', label: 'gpt-5', provider: 'OpenAI' },
            { id: 'gpt-4o', label: 'gpt-4o', provider: 'OpenAI' },
            { id: 'mistral-small', label: 'mistral-small', provider: 'Mistral' },
          ]}
          selected={['gpt-5']}
          onToggle={() => {}}
        />,
      ),
    );
    expectNoSeriousViolations(await runAxe(container));
  });

  it('SavedBenchmarkBanner (success) has no critical/serious violations', async () => {
    const { container } = render(
      withProviders(
        <SavedBenchmarkBanner
          benchmarkSlug="abc12345"
          benchmarkError={null}
          disagreementScore={37}
          copied={false}
          onCopy={() => {}}
        />,
      ),
    );
    expectNoSeriousViolations(await runAxe(container));
  });

  it('SavedBenchmarkBanner (save_failed) has no critical/serious violations', async () => {
    const { container } = render(
      withProviders(
        <SavedBenchmarkBanner
          benchmarkSlug={null}
          benchmarkError="save_failed"
          disagreementScore={null}
          copied={false}
          onCopy={() => {}}
        />,
      ),
    );
    expectNoSeriousViolations(await runAxe(container));
  });

  it('EvaluationChips has no critical/serious violations', async () => {
    const { container } = render(
      withProviders(
        <EvaluationChips
          evaluation={{
            qualityScore: { relevance: 80, coherence: 70, readability: 65, overall: 74 },
            sentenceCount: 4,
            avgSentenceLength: 12,
            wordCount: 48,
          }}
        />,
      ),
    );
    expectNoSeriousViolations(await runAxe(container));
  });

  it('ResultCard (success) has no critical/serious violations', async () => {
    const { container } = render(
      withProviders(
        <ResultCard
          runId="run-xyz"
          onFeedback={() => {}}
          result={{
            model: 'gpt-4o',
            text: 'Photosynthesis is the process by which plants make food from sunlight.',
            latency_ms: 850,
            usage: { prompt_tokens: 10, completion_tokens: 30, total_tokens: 40 },
            cost_usd: 0.000325,
            evaluation: {
              qualityScore: { relevance: 80, coherence: 70, readability: 65, overall: 74 },
              sentenceCount: 1,
              avgSentenceLength: 13,
              wordCount: 13,
            },
          }}
        />,
      ),
    );
    expectNoSeriousViolations(await runAxe(container));
  });

  it('ResultCard (error) has no critical/serious violations', async () => {
    const { container } = render(
      withProviders(
        <ResultCard
          runId="run-xyz"
          onFeedback={() => {}}
          result={{
            model: 'gpt-4o',
            text: '',
            latency_ms: 0,
            error: 'Provider request failed',
          }}
        />,
      ),
    );
    expectNoSeriousViolations(await runAxe(container));
  });

  it('ResultsTable has no critical/serious violations', async () => {
    const { container } = render(
      withProviders(
        <ResultsTable
          results={[
            {
              model: 'gpt-4o',
              text: 'Hello world.',
              latency_ms: 800,
              usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
              cost_usd: 0.00015,
              evaluation: {
                qualityScore: { relevance: 80, coherence: 70, readability: 60, overall: 72 },
                sentenceCount: 1,
                avgSentenceLength: 2,
                wordCount: 2,
              },
            },
            {
              model: 'mistral-small',
              text: '',
              latency_ms: 0,
              error: 'Provider request failed',
            },
          ]}
        />,
      ),
    );
    expectNoSeriousViolations(await runAxe(container));
  });

  it('renders the real AVAILABLE_MODELS list grouped by provider', () => {
    render(
      withProviders(
        <ModelPicker
          models={AVAILABLE_MODELS}
          selected={[AVAILABLE_MODELS[0].id]}
          onToggle={() => {}}
        />,
      ),
    );

    // Provider subheadings render in the expected order.
    const headings = screen.getAllByRole('heading', { level: 3 });
    expect(headings.map((h) => h.textContent)).toEqual(['OpenAI', 'Mistral']);

    // Both new gpt-5 entries are present and selectable.
    expect(screen.getByLabelText('Compare OpenAI gpt-5')).toBeDefined();
    expect(screen.getByLabelText('Compare OpenAI gpt-5-mini')).toBeDefined();
    expect(screen.getByLabelText('Compare OpenAI gpt-4o')).toBeDefined();
    expect(screen.getByLabelText('Compare OpenAI gpt-4o-mini')).toBeDefined();
    expect(screen.getByLabelText('Compare Mistral mistral-small')).toBeDefined();

    // OpenAI group has 4 models, Mistral has 1.
    const groups = screen.getAllByRole('group');
    const openai = groups.find((g) => g.getAttribute('aria-label') === 'OpenAI models');
    const mistral = groups.find((g) => g.getAttribute('aria-label') === 'Mistral models');
    expect(openai).toBeDefined();
    expect(mistral).toBeDefined();
    expect(within(openai!).getAllByRole('checkbox').length).toBe(4);
    expect(within(mistral!).getAllByRole('checkbox').length).toBe(1);
  });

  it('PromptForm has no critical/serious violations', async () => {
    const { container } = render(
      withProviders(
        <PromptForm
          prompt=""
          onPromptChange={() => {}}
          selected={['gpt-4o']}
          onToggleModel={() => {}}
          loading={false}
          msg={null}
          onSubmit={() => {}}
        />,
      ),
    );
    expectNoSeriousViolations(await runAxe(container));
  });
});

