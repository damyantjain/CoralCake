'use client';

import { PromptForm } from './_components/PromptForm';
import { SavedBenchmarkBanner } from './_components/SavedBenchmarkBanner';
import { ExportButtons } from './_components/ExportButtons';
import { ResultsTable } from './_components/ResultsTable';
import { ResultCard } from './_components/ResultCard';
import { useRunner } from './_hooks/useRunner';

export default function RunnerPage() {
  const { state, actions } = useRunner();
  const {
    prompt,
    selected,
    loading,
    results,
    runId,
    benchmarkSlug,
    benchmarkError,
    disagreementScore,
    copied,
    msg,
  } = state;

  return (
    <div className="min-h-screen">
      <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight mb-4">
            LLM Prompt <span className="text-primary">Runner</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto">
            Test your prompts across multiple language models and compare their performance in
            real time.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16 bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <PromptForm
            prompt={prompt}
            onPromptChange={actions.setPrompt}
            selected={selected}
            onToggleModel={actions.toggleModel}
            loading={loading}
            msg={msg}
            onSubmit={actions.run}
          />

          {results.length > 0 && (
            <div className="space-y-8" aria-live="polite">
              <SavedBenchmarkBanner
                benchmarkSlug={benchmarkSlug}
                benchmarkError={benchmarkError}
                disagreementScore={disagreementScore}
                copied={copied}
                onCopy={actions.copyBenchmarkLink}
              />

              <ExportButtons prompt={prompt} results={results} />

              <ResultsTable results={results} />

              <div>
                <h3 className="text-lg font-semibold mb-4">Model responses</h3>
                <div className="grid gap-6">
                  {results.map((r) => (
                    <ResultCard
                      key={r.model}
                      result={r}
                      runId={runId}
                      onFeedback={actions.sendFeedback}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
