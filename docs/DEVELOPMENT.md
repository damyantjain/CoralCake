# CoralCake Development Guide

This guide covers setting up CoralCake for local development, including secure secret management.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Secret Management](#secret-management)
- [Development Workflow](#development-workflow)
- [Testing Without Real API Keys](#testing-without-real-api-keys)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js** 20.x or later
- **npm** (comes with Node.js)
- **Supabase Account** - [Sign up free](https://supabase.com)
- **OpenAI API Key** (optional for testing) - [Get API key](https://platform.openai.com/api-keys)
- **Mistral API Key** (optional for testing) - [Get API key](https://console.mistral.ai/api-keys)
- **Helicone Account** (optional for observability) - [Sign up free](https://helicone.ai/)

---

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/damyantjain/CoralCake.git
cd CoralCake
npm ci
```

### 2. Set Up Environment Variables

```bash
# Copy the example file
cp .env.example .env.local

# Edit .env.local with your actual values
# See "Environment Variables" section below for details
```

### 3. Bootstrap the Database

In your Supabase project (a free one works for dev), open the SQL editor and run the contents of [`supabase/migrations/0001_initial_schema.sql`](../supabase/migrations/0001_initial_schema.sql). This creates the `runs`, `run_outputs`, `feedback`, and `benchmarks` tables along with all RLS policies. The file is idempotent — safe to re-run.

See [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) for what each table holds.

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Environment Variables

CoralCake requires several environment variables. Copy `.env.example` to `.env.local` and configure:

### Required for Authentication & Database

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Supabase Dashboard → Settings → API |
| `NEXT_PUBLIC_SITE_URL` | Your site URL (auth callbacks) | `http://localhost:3000` for dev |

### Required for LLM Features

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `OPENAI_API_KEY` | OpenAI API key | [OpenAI Platform](https://platform.openai.com/api-keys) |
| `MISTRAL_API_KEY` | Mistral API key | [Mistral Console](https://console.mistral.ai/api-keys) |
| `HELICONE_API_KEY` | Helicone proxy auth | [Helicone Dashboard](https://helicone.ai/) |

**Note:** The app will run without LLM API keys, but LLM comparison features will not work.

---

## Secret Management

### For Local Development

**Option 1: Using `.env.local` (Recommended for individuals)**

1. Copy `.env.example` to `.env.local`
2. Fill in your actual secrets
3. `.env.local` is already in `.gitignore` - never commit it!

```bash
cp .env.example .env.local
# Edit .env.local with your values
npm run dev
```

**Option 2: Using Doppler (Recommended for teams)**

Doppler is used in production and can be used locally for team secret management:

1. Install Doppler CLI: `brew install dopplerhq/cli/doppler` (or see [Doppler docs](https://docs.doppler.com/docs/install-cli))
2. Authenticate: `doppler login`
3. Set up project: `doppler setup`
4. Run with Doppler: `doppler run -- npm run dev`

This approach ensures all team members use the same secrets without manual setup.

### For GitHub Actions / CI

Secrets for CI are stored as GitHub repository secrets:

1. Go to Repository Settings → Secrets and variables → Actions
2. Add each required secret:
   - `OPENAI_API_KEY`
   - `MISTRAL_API_KEY`
   - `HELICONE_API_KEY`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL`

**Note:** The current CI workflow (lint + typecheck) does not require API keys. Build may fail without them, but that's expected.

### For Copilot Agents

When Copilot agents need to develop or test the application:

1. **For code changes only** (no runtime needed): No secrets required. Agents can lint and typecheck without env vars.

2. **For testing LLM features**: 
   - Provide a `.env.local` file via repository secrets or manual injection
   - Use test/mock API keys with minimal quota for safety
   - Consider using Helicone caching to reduce API costs during development

3. **Security Best Practices**:
   - Use separate API keys for automated testing with low rate limits
   - Monitor usage in Helicone dashboard
   - Rotate keys regularly
   - Never log or expose secrets in console output

---

## Development Workflow

### Standard Development

```bash
# Install dependencies
npm ci

# Run dev server (with hot reload)
npm run dev

# In separate terminals:
npm run lint        # Lint code
npx tsc --noEmit   # Type check
```

### With Doppler (Team Development)

```bash
# One-time setup
doppler setup

# Run dev server with secrets from Doppler
doppler run -- npm run dev

# Lint and typecheck also work with Doppler
doppler run -- npm run lint
doppler run -- npx tsc --noEmit
```

### Building for Production

```bash
# Build the application
npm run build

# Preview production build
npm start
```

---

## Testing Without Real API Keys

You can develop and test most of the application without real LLM API keys:

### Features That Work Without API Keys

✅ UI/UX development  
✅ Authentication flow (with Supabase)  
✅ Database operations (with Supabase)  
✅ Routing and navigation  
✅ Export functionality  
✅ Linting and type checking  

### Features That Require API Keys

❌ Running actual LLM comparisons (`/runner` page)  
❌ Testing provider integrations  
❌ Helicone observability  

### Keeping LLM costs low while developing

The debug pages (`/runs-debug`, `/auth-debug`, `/provider-test`) that older versions of this doc referenced were removed in v0.2 for security reasons (they exposed user IDs or burned API tokens without auth). To minimize spend while iterating:

- Use `gpt-4o-mini` exclusively while iterating — it's by far the cheapest of the supported models.
- Test with one-sentence prompts; you almost never need full paragraphs while debugging UI.
- Pick a single model from the picker on `/runner` until you're explicitly testing the multi-model comparison flow.
- Set `DISABLE_LLM_RUNS=true` in `.env.local` to short-circuit `/api/run` with a 503 — useful when you're working on the UI and don't want any accidental real calls.

---

## Troubleshooting

### "Missing environment variable" errors

**Problem:** App crashes with missing env var error.

**Solution:**
1. Check that `.env.local` exists
2. Verify all required variables are set
3. Restart dev server after changing env vars

### Authentication not working

**Problem:** Can't sign in or get redirected incorrectly.

**Solution:**
1. Verify `NEXT_PUBLIC_SITE_URL` matches your dev URL
2. Check Supabase redirect URLs in dashboard
3. Clear browser cookies and try again

### LLM calls failing

**Problem:** API calls to OpenAI/Mistral fail.

**Solution:**
1. Verify API keys are correct
2. Check API key has sufficient quota
3. Check the server-side logs (`npm run dev` terminal) for the `[api/run] provider call failed:` line — it has the redacted provider error
4. Review Helicone dashboard for errors

### Build fails in CI

**Problem:** CI build fails due to missing env vars.

**Solution:**
- Expected behavior if secrets aren't configured
- CI only requires lint + typecheck (no build)
- For full build, add secrets to GitHub Actions

### Doppler not working

**Problem:** `doppler run` fails or doesn't inject secrets.

**Solution:**
1. Run `doppler login` to authenticate
2. Run `doppler setup` in project directory
3. Verify you have access to the project in Doppler dashboard
4. Check `doppler --version` is up to date

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Doppler Documentation](https://docs.doppler.com/)
- [Helicone Documentation](https://docs.helicone.ai/)
- [CoralCake Usage Guide](./USAGE_GUIDE.md)
- [Implementation Notes](./IMPLEMENTATION_NOTES.md)

---

## Contributing

Before submitting a PR:

1. ✅ Run `npm run lint` - must pass
2. ✅ Run `npx tsc --noEmit` - must pass
3. ✅ Test your changes manually
4. ✅ Follow the [Copilot Instructions](../.github/copilot-instructions.md)
5. ✅ Keep diffs small (< 500 LOC target)

See [Copilot Instructions](../.github/copilot-instructions.md) for detailed coding conventions.
