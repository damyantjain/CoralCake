# CoralCake — What Ships Today

A snapshot of the current feature set. For where the project is going, see [ROADMAP.md](./ROADMAP.md).

## Pages

| Route | Auth | Purpose |
| --- | --- | --- |
| `/` | public | Landing page |
| `/login`, `/auth/callback` | public | Supabase magic-link sign-in |
| `/runner` | required | Run a prompt across selected models, see results side-by-side |
| `/compare` | required | Pick past runs and compare them in a single view |
| `/runs-last` | required | Open the most recent run |

## Run flow

On `/runner` you can:

- Enter a prompt and pick from `gpt-4o`, `gpt-4o-mini`, `mistral-small`.
- Get a side-by-side response card per model with latency, prompt/completion/total tokens, and estimated cost in USD.
- See heuristic quality scores per response: relevance, coherence, readability, and a weighted overall (computed in `src/lib/evaluation/scoring.ts`).
- Leave a thumbs up/down, a 1–5 star rating, or a comment on each response (persisted per user via `/api/feedback`).
- Export the run as CSV or JSON.

Every run is persisted to your account with full metrics. `/compare` lets you reopen and align past runs.

## Providers

LLM calls go through the [Helicone](https://helicone.ai) proxy for usage tracking and latency observability.

| Provider | Models | Pricing source |
| --- | --- | --- |
| OpenAI | `gpt-4o`, `gpt-4o-mini` | `src/lib/llm/pricing.ts` |
| Mistral | `mistral-small` | `src/lib/llm/pricing.ts` |

Pricing is hardcoded and reviewed manually — see the dated tests in `src/lib/llm/__tests__/pricing.test.ts`.

## Security & operations

- All LLM provider keys are server-only environment variables.
- Supabase RLS protects every table that holds user data.
- `/api/run` and `/api/evaluate` are rate-limited per user and per IP via Upstash Redis (with a per-instance in-memory fallback for local dev).
- `DISABLE_LLM_RUNS=true` is a kill switch that returns 503 from `/api/run` so paid LLM calls can be paused without a redeploy.
- Strict CSP, HSTS, and `frame-ancestors 'none'` are set in `next.config.ts`.
- A `lefthook` pre-commit hook runs `gitleaks` against staged changes to catch accidental secret commits.

See [SECURITY.md](./SECURITY.md) for the disclosure policy and ops notes.

## Tech stack

- Next.js 15 (App Router, Turbopack)
- React 19, TypeScript (strict)
- Supabase (Postgres + Auth + RLS)
- Tailwind v4
- Upstash Redis (rate limiting)
- Helicone (LLM proxy / observability)
