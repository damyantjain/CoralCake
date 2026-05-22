# CoralCake Roadmap

A living document. The direction below replaces the previous Q1-Q4 "platform" roadmap, which targeted features (custom eval scripts, batch testing, A/B framework, recommendation engine) that overlapped with bigger, better-resourced products. CoralCake is being narrowed down to something distinctive instead.

## The thesis

CoralCake helps you **see where models disagree on your prompt**.

Most LLM comparison tools answer "which model scored higher." We're asking a different question: when the same prompt produces different answers from different models, what is the divergence, and which one do you trust? The shareable artifact is a permalinked side-by-side that highlights the disagreement, not a scoreboard.

This lives between two adjacent products without competing with either:
- **Aggregate benchmarks** (artificialanalysis.ai, lmarena.ai) tell you which models tend to be better overall. We tell you what happens on *your* prompt.
- **Observability platforms** (LangSmith, Helicone) tell you what your production app is doing. We're a thinking tool for the design phase, before you've committed to one.

## What ships today

See [FEATURES.md](./FEATURES.md). Briefly: a private prompt runner across `gpt-4o`, `gpt-4o-mini`, and `mistral-small`, with metrics, heuristic quality scores, feedback, CSV/JSON export, and `/compare` for historical runs. As of v0.2, the API surface is locked down (rate limited, error-sanitized, debug endpoints removed) and the project has disclosure + secret-scanning policies in place.

## What's coming, phase by phase

The phasing is built around **shipping the shareable disagreement artifact** and gathering a signal before adding more. We deliberately don't decide phases 4+ until phases 0–3 are in users' hands.

### Phase 1 — Cleanup (in progress)
- Delete the half-baked validators (mock RAGAS, mock TruLens) and the custom-eval framework.
- Delete the bulk batch-prompt-testing surface; it's commodity territory that Promptfoo already covers.
- Reset the documentation set so what's written matches what's deployed.

### Phase 2a — Private benchmark records
- Every run becomes a re-openable "benchmark" with a stable `/b/[slug]` URL, owner-only while private.
- Add a `disagreement_score` computed at save time (pairwise normalized Levenshtein + token-overlap cosine similarity).
- No public sharing yet — just the persistent record.

### Phase 3 — UI modernization
- Migrate the ad-hoc Tailwind components to shadcn/ui primitives (Radix-backed, accessibility for free).
- Decompose `/runner` into smaller components, add proper loading/error/empty states.
- Mobile pass, axe-core a11y smoke tests, Lighthouse a11y ≥ 95 on the main routes.

### Phase 2b — Publish flow + Open Graph cards
- A "Publish" toggle on a benchmark makes `/b/[slug]` public (no-index by default, opt-in indexing later).
- OpenAI moderation API runs on each response at publish time; severely flagged content blocks publish.
- Open Graph image generated at request time on the edge so a shared link unfurls beautifully on Twitter, Slack, iMessage.
- The headline of the public card is the disagreement score and a one-line plain-English read ("Models largely agreed" / "Models gave substantially different answers").

### Phase 5 — Launch
- Owner cost dashboard at `/admin/usage` (gated by email allowlist) so the maintainer can see spend at a glance.
- Plausible (or Umami) analytics on share-funnel events: `benchmark_created`, `benchmark_published`, `share_clicked`, `public_view`.
- Provider-side hard spend caps documented.
- Legal: `/terms`, `/privacy`, subprocessor list.
- README screenshots, demo GIF, `v0.2.0` release.

### After launch — measure, then decide

We sit on phases 0–3 + 5 for 2–4 weeks. Watch Plausible for the ratio of *publishes* to *runs*, share-click rate, and return visits via shared link. Only then do we consider:

- More providers (Anthropic Claude, Google Gemini via Helicone)
- A cost-projection calculator
- A public, search-indexed gallery of community benchmarks
- Streaming responses on `/runner`

If nobody shares, none of those will fix it.

## Explicitly out of scope

These were on the previous roadmap and are not coming back unless the share loop proves out:

- Batch CSV/JSON prompt upload, parallel batch runners, PDF/Excel reports
- Prompt versioning, A/B/multivariate testing frameworks, AI prompt suggesters
- Custom eval script marketplace
- RAGAS / TruLens integrations
- Model recommendation engine, automatic model routing, Pareto optimizers

These are not bad ideas — they're just not where CoralCake's specific shape adds value.
