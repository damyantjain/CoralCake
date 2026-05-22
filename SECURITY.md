# Security Policy

## Reporting a vulnerability

If you believe you've found a security issue in CoralCake, please **do not** open a public GitHub issue. Report it privately through GitHub's vulnerability reporting:

- [Open a private security advisory](https://github.com/damyantjain/CoralCake/security/advisories/new)

We aim to acknowledge reports within 3 business days and to provide a more detailed response within 7 business days, including the next steps in handling your report.

## Scope

In scope:

- The deployed CoralCake site at `coralcake.vercel.app`
- The code in this repository (`damyantjain/CoralCake`)
- Authentication flows (Supabase magic link)
- API routes under `/api/*`
- Anything that could lead to: account takeover, data leakage, unauthenticated use of provider API keys, secret exposure, or stored XSS

Out of scope:

- Findings from automated scanners without a working proof of concept
- Vulnerabilities in our dependencies that are already disclosed upstream — please report those to the dependency authors directly
- Issues that require physical access to a logged-in user's device
- Self-XSS, clickjacking on pages without sensitive actions, missing security headers without a demonstrable impact
- Volumetric / DoS testing — do not perform load tests against the production site

## Safe harbor

We will not pursue or support legal action against researchers who:

- Make a good-faith effort to avoid privacy violations, data destruction, and interruption of service
- Report the issue to us privately before any public disclosure
- Give us a reasonable amount of time to remediate before disclosing publicly (we suggest 90 days)

## Operational notes for maintainers

- All LLM provider keys (OpenAI, Mistral, Helicone) are server-only environment variables and never exposed to the client.
- The Supabase anonymous key is intentionally public and protected by Row-Level Security (RLS).
- `DISABLE_LLM_RUNS=true` is a kill-switch env var that short-circuits `/api/run` with a `503` — set it on Vercel to pause all paid LLM calls without redeploying.
- Rate limiting on `/api/run` and `/api/evaluate` uses Upstash Redis if `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` are set; otherwise falls back to per-instance in-memory limiting (development only).

### Pre-commit secret scanning

A `lefthook.yml` runs `gitleaks` against staged changes before every commit so accidental secret pastes don't reach the repo. To install it after cloning:

```bash
brew install gitleaks   # one-time, macOS
npm install             # installs lefthook
npx lefthook install    # wires the .git/hooks/pre-commit script
```

`npm install` also runs `lefthook install` automatically via the `prepare` script. If `gitleaks` isn't on `PATH` the hook prints a hint and skips — install it before relying on the check.
