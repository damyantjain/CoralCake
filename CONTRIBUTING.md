# Contributing to CoralCake

Thanks for the interest. CoralCake is a solo project with a deliberately narrow scope — the [roadmap](./ROADMAP.md) is the source of truth for what's planned. If you want to contribute something not on the roadmap, please open an issue first to talk about fit before you spend time on a PR.

## Getting set up

See [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md) for local setup. The short version:

```bash
git clone git@github.com:damyantjain/CoralCake.git
cd CoralCake
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

You also need `gitleaks` on `PATH` for the pre-commit secret scan to actually run (`brew install gitleaks` on macOS). The hook is set up automatically by `npm install` and will skip with a hint if `gitleaks` isn't installed.

## Before you open a PR

- `npm run lint` clean
- `npx tsc --noEmit` clean
- Existing behavior didn't regress (try the run + compare flow once locally)
- Tests added for any new logic in `src/lib/`
- Commit messages follow the existing style (`security:`, `feat:`, `fix:`, `refactor:`, `docs:`)
- The PR description fills out the template, including the rollback note

## Reviewing scope

Some things we won't merge, even if they work:

- Re-introductions of features the [roadmap](./ROADMAP.md) explicitly drops (batch testing, custom eval scripts, RAGAS/TruLens integrations, model recommendation engines).
- New unauthenticated API routes. Anything that calls a paid provider must be auth-gated and rate-limited.
- Changes that loosen the Content-Security-Policy without a migration path back to nonces.
- Public-facing pages without a privacy review if they expose any user data.

## Security

If you find a security issue, please don't open a public issue. See [SECURITY.md](./SECURITY.md) for private disclosure.
