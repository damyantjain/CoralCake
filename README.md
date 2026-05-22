# CoralCake

> See where models disagree on your prompt.

CoralCake runs the same prompt across multiple LLMs and shows you what they agreed on, what they didn't, and what each one cost you in latency and dollars. Use it when you're choosing a model for a new feature and the headline benchmarks don't answer the specific question you have.

**Live app:** [coralcake.vercel.app](https://coralcake.vercel.app)

## What it does today

- Run one prompt across `gpt-4o`, `gpt-4o-mini`, and `mistral-small` (via Helicone).
- Side-by-side responses with latency, tokens, cost (USD), and heuristic quality scores (relevance / coherence / readability).
- Thumbs, stars, and comments per response, persisted to your account.
- Historical view of past runs at `/compare`.
- CSV / JSON export.

See [FEATURES.md](./FEATURES.md) for the full surface, [ROADMAP.md](./ROADMAP.md) for where it's going, and [SECURITY.md](./SECURITY.md) for the disclosure policy.

## Running locally

```bash
git clone git@github.com:damyantjain/CoralCake.git
cd CoralCake
npm install              # also wires the lefthook pre-commit hook
cp .env.example .env.local
# fill in OPENAI_API_KEY, MISTRAL_API_KEY, HELICONE_API_KEY,
# NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY at minimum.
npm run dev
```

Full setup, including how to get each key and how to run the Supabase schema, is in [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md). Secret-management norms are in [docs/SECRET_MANAGEMENT.md](./docs/SECRET_MANAGEMENT.md).

## Tech stack

Next.js 15 (App Router, Turbopack) · React 19 · TypeScript (strict) · Tailwind v4 · Supabase (Postgres + Auth + RLS) · Upstash Redis (rate limiting) · Helicone (LLM proxy)

## Contributing

Issues and PRs welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a PR — the short version is: read [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md), keep changes focused, run `npm run lint && npx tsc --noEmit` before submitting, and check [ROADMAP.md](./ROADMAP.md) so we don't end up duplicating work.

## Security

Found a vulnerability? Please don't open a public issue — see [SECURITY.md](./SECURITY.md) for the private disclosure process.

## License

This project is currently published without a license file. See the repo's GitHub page for the latest status. If you'd like to use the code in your own project, please open an issue first.
