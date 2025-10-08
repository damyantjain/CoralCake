# Copilot Agent Development Setup

This guide is specifically for GitHub Copilot agents developing and testing CoralCake. It outlines how to safely access secrets without exposing them.

## Overview

CoralCake requires several API keys to run LLM comparisons. This document explains how Copilot agents can access these secrets securely during development and testing.

---

## What Copilot Agents Can Do Without Secrets

Most development tasks don't require actual API keys:

### ✅ No Secrets Required

- **Code editing**: Modify TypeScript/TSX files
- **Linting**: Run `npm run lint`
- **Type checking**: Run `npx tsc --noEmit`
- **UI development**: Build components and pages
- **Documentation**: Update README, docs, comments
- **Git operations**: Commit, branch, view history
- **Database schema**: Review Supabase types and queries
- **Static analysis**: Review code patterns and architecture

### ❌ Secrets Required

- **Running dev server**: `npm run dev` (needs at minimum Supabase keys)
- **Building application**: `npm run build` (may work without all keys)
- **Testing LLM calls**: Making actual API requests to OpenAI/Mistral
- **Auth flow testing**: Requires Supabase configuration
- **End-to-end testing**: Full application flow

---

## Recommended Workflow for Copilot Agents

### Phase 1: Code-Only Changes (No Runtime)

For most tasks, Copilot agents should:

1. **Make code changes** based on requirements
2. **Validate with linting**: `npm run lint`
3. **Validate with typechecking**: `npx tsc --noEmit`
4. **Review changes** using git diff
5. **Create PR** for human review and testing

**Example workflow:**
```bash
# Make your code changes
# ...

# Validate (no secrets needed)
npm run lint
npx tsc --noEmit

# Commit and push
git add .
git commit -m "feat: add new feature"
git push
```

This covers ~80% of development tasks safely without requiring secrets.

---

### Phase 2: Runtime Testing (Requires Secrets)

When runtime testing is absolutely necessary:

#### Option A: Mock/Stub Approach (Preferred)

Create minimal mocks for testing without real API calls:

```typescript
// For testing, use mock responses
const mockLLMResponse = {
  text: "Sample response",
  usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
  latency_ms: 1200
};
```

Test pages:
- `/runs-debug` - Test database with mock data
- `/auth-debug` - Test auth flow components

#### Option B: Minimal Test Keys

If real API testing is required:

1. **Use separate test keys** with minimal quota
2. **Enable rate limiting** on test keys
3. **Monitor usage** via Helicone dashboard
4. **Rotate keys frequently** after testing
5. **Never log or expose keys** in output

**Setup for test keys:**
```bash
# Create .env.local with test keys
cat > .env.local << 'EOF'
OPENAI_API_KEY=sk-test-minimal-quota-key
MISTRAL_API_KEY=test-key-with-limits
HELICONE_API_KEY=sk-helicone-test-key
NEXT_PUBLIC_SUPABASE_URL=https://test-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EOF

# Run dev server
npm run dev
```

---

## Security Best Practices for Copilot Agents

### ✅ DO

- **Use `.env.local`** for local secrets (already in `.gitignore`)
- **Use test/sandbox API keys** with low quotas
- **Monitor API usage** during testing
- **Rotate keys** after testing sessions
- **Clean up** `.env.local` after testing
- **Document** what testing was performed
- **Ask for human validation** before committing changes that affect secrets
- **Use environment variable names** without revealing values in logs

### ❌ DON'T

- **Don't commit** `.env.local` or any file with secrets
- **Don't log** secret values to console or files
- **Don't hardcode** API keys in source code
- **Don't use production keys** for testing
- **Don't expose** secrets in error messages
- **Don't share** secrets in PR descriptions or comments
- **Don't bypass** `.gitignore` for env files

---

## Accessing Secrets via GitHub Actions

If the repository has secrets configured in GitHub Actions:

### Reading from GitHub Secrets

Repository secrets can be accessed in workflows:

```yaml
# .github/workflows/test.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          MISTRAL_API_KEY: ${{ secrets.MISTRAL_API_KEY }}
          HELICONE_API_KEY: ${{ secrets.HELICONE_API_KEY }}
          # ... other secrets
        run: npm test
```

**Note:** Copilot agents cannot directly access GitHub secrets. They are only available within workflow runs.

---

## Alternative: Doppler Integration

For teams using Doppler (as CoralCake does in production):

### Doppler Service Tokens

1. **Create a service token** in Doppler (read-only, scoped to dev environment)
2. **Add as GitHub secret**: `DOPPLER_TOKEN`
3. **Use in workflows**:

```yaml
- name: Install Doppler CLI
  run: |
    curl -Ls https://cli.doppler.com/install.sh | sh
    
- name: Run with Doppler
  env:
    DOPPLER_TOKEN: ${{ secrets.DOPPLER_TOKEN }}
  run: doppler run -- npm run dev
```

This approach:
- ✅ Avoids storing individual secrets in GitHub
- ✅ Centralized secret management
- ✅ Automatic rotation and updates
- ✅ Audit trail in Doppler

---

## Testing Scenarios

### Scenario 1: Adding a New UI Component

**Requirements:** None  
**Process:**
1. Create/modify component files
2. Run `npm run lint`
3. Run `npx tsc --noEmit`
4. Create PR with description and screenshots

### Scenario 2: Adding a New API Route

**Requirements:** None (can test logic without runtime)  
**Process:**
1. Create route file with proper types
2. Add error handling and validation
3. Lint and typecheck
4. Document expected behavior
5. Create PR for human testing

### Scenario 3: Modifying LLM Provider Logic

**Requirements:** Test API keys (optional)  
**Process:**
1. Make code changes
2. Lint and typecheck
3. **Optional:** Test with minimal API key
4. Document changes and expected behavior
5. Create PR with test instructions

### Scenario 4: Debugging LLM Call Failures

**Requirements:** Test API keys + Helicone access  
**Process:**
1. Review Helicone logs (if access provided)
2. Test with `/provider-test` page
3. Add detailed error handling
4. Document findings
5. Create PR with fix

---

## Troubleshooting

### "Cannot read .env.local"

**Cause:** File doesn't exist or has wrong permissions.

**Solution:**
```bash
# Create from example
cp .env.example .env.local

# Set permissions
chmod 600 .env.local
```

### "API key is invalid"

**Cause:** Wrong key format or expired key.

**Solution:**
- Verify key format matches provider docs
- Check key isn't expired
- Test key with provider's API directly
- Rotate to a fresh key

### "Rate limit exceeded"

**Cause:** Too many API calls during testing.

**Solution:**
- Use Helicone caching (`Helicone-Cache-Enabled: true`)
- Reduce test frequency
- Use mock data instead
- Check Helicone dashboard for usage

---

## Summary: Secure Development Checklist

Before starting development:

- [ ] Understand task requirements
- [ ] Identify if secrets are needed
- [ ] Use code-only workflow if possible
- [ ] Set up `.env.local` with test keys if needed
- [ ] Never commit secrets
- [ ] Clean up after testing
- [ ] Document testing approach in PR

During development:

- [ ] Validate with lint + typecheck frequently
- [ ] Use minimal API calls
- [ ] Monitor usage if using real keys
- [ ] Log behavior, not secrets
- [ ] Test error paths

Before creating PR:

- [ ] Verify no secrets in code
- [ ] Check `.gitignore` excludes `.env.local`
- [ ] Run final lint + typecheck
- [ ] Document what was tested
- [ ] Request human validation for critical changes

---

## Contact & Support

If you need access to secrets or have questions:

1. **Check documentation**: Most tasks don't need secrets
2. **Use mocks**: Test with mock data when possible
3. **Request test keys**: Ask maintainers for low-quota test keys
4. **Document needs**: Explain why secrets are required

For security concerns or questions, contact the repository maintainers.
