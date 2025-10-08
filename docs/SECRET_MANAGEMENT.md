# Secret Management in CoralCake

This document provides an overview of how secrets are managed in CoralCake across different environments.

## Overview

CoralCake requires several API keys and configuration values to function:

1. **LLM Provider Keys**: OpenAI, Mistral API keys for LLM comparisons
2. **Helicone Key**: For LLM observability and monitoring
3. **Supabase Configuration**: For authentication and database
4. **Site URL**: For OAuth callbacks

## Secrets by Environment

### Local Development

**Individual Developers:**
- Use `.env.local` file (copy from `.env.example`)
- File is gitignored - never committed
- Each developer manages their own keys

**Teams using Doppler:**
- Doppler CLI injects secrets at runtime
- No local `.env.local` needed
- Centralized secret management
- Run: `doppler run -- npm run dev`

See: [Development Guide](./DEVELOPMENT.md)

### GitHub Copilot Agents

**Code-only tasks (recommended):**
- No secrets required for most development
- Lint and typecheck work without env vars
- Agents make code changes, humans test runtime

**Runtime testing (when necessary):**
- Use minimal test keys with low quotas
- Monitor usage via Helicone
- Rotate keys after testing
- Never commit secrets

See: [Copilot Agent Setup](./COPILOT_AGENT_SETUP.md)

### CI/CD (GitHub Actions)

**Current Setup:**
- CI runs lint + typecheck only
- No secrets required for current CI

**Future (if build added):**
- Secrets stored in GitHub repository settings
- Accessed via `${{ secrets.SECRET_NAME }}`
- Reference implementation in `.github/workflows/ci.yml` (commented)

### Production (Netlify)

**Deployment:**
- Netlify fetches secrets from Doppler
- Doppler integration configured in Netlify settings
- Automatic secret updates without redeployment
- Secrets never stored in Netlify directly

## Required Environment Variables

| Variable | Purpose | Required For | Public? |
|----------|---------|--------------|---------|
| `OPENAI_API_KEY` | OpenAI LLM calls | Runtime | No |
| `MISTRAL_API_KEY` | Mistral LLM calls | Runtime | No |
| `HELICONE_API_KEY` | LLM observability | Runtime | No |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project | Runtime | Yes* |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase auth | Runtime | Yes* |
| `NEXT_PUBLIC_SITE_URL` | OAuth callbacks | Runtime | Yes* |

\* Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser. They should be safe to expose (RLS protects Supabase).

## Security Best Practices

### ✅ DO

- Use `.env.local` for local development
- Store production secrets in Doppler
- Use GitHub repository secrets for CI/CD
- Rotate keys regularly
- Monitor API usage in Helicone
- Use separate keys for dev/staging/prod
- Use `.env.example` to document required variables

### ❌ DON'T

- Commit secrets to git (check `.gitignore`)
- Hardcode API keys in source code
- Share secrets via chat/email/tickets
- Use production keys for development
- Log secret values to console
- Expose secrets in error messages
- Store secrets in plaintext outside of secure systems

## Troubleshooting

### "Missing environment variable" error

**Problem:** Application can't find required env var.

**Solution:**
1. Ensure `.env.local` exists (copy from `.env.example`)
2. Restart dev server after changing env vars
3. Check variable names match exactly (case-sensitive)

### Build works locally but fails in CI

**Problem:** CI doesn't have access to secrets.

**Solution:**
- Expected if secrets aren't configured in GitHub
- Current CI only requires lint + typecheck (no secrets needed)
- To enable build, add secrets to GitHub repository settings

### Doppler not injecting secrets

**Problem:** Running with Doppler but secrets not available.

**Solution:**
1. Verify Doppler CLI is installed: `doppler --version`
2. Authenticate: `doppler login`
3. Setup project: `doppler setup` (in project directory)
4. Verify access in Doppler dashboard

## Secret Rotation

When rotating secrets:

1. **Generate new keys** in provider dashboard
2. **Update Doppler** (for production)
3. **Update GitHub Secrets** (for CI/CD if configured)
4. **Update local `.env.local`** (for development)
5. **Test** to ensure new keys work
6. **Revoke old keys** in provider dashboard
7. **Document** rotation in team communication

## Getting Help

If you need secrets for development:

1. **Check documentation** first - most tasks don't need runtime secrets
2. **Use mock data** when possible
3. **Contact maintainers** for test keys if runtime testing is essential
4. **Never share secrets** via insecure channels

## Related Documentation

- [Development Guide](./DEVELOPMENT.md) - Complete local setup
- [Copilot Agent Setup](./COPILOT_AGENT_SETUP.md) - Guide for AI agents
- [Usage Guide](./USAGE_GUIDE.md) - How to use CoralCake
- [Implementation Notes](./IMPLEMENTATION_NOTES.md) - Technical details
