# Supabase Authentication Setup Guide

This guide explains how to properly configure Supabase authentication for CoralCake in both development and production environments.

## Overview

CoralCake uses Supabase for authentication with a magic link (passwordless) flow. The authentication requires proper configuration of redirect URLs in both the Supabase dashboard and your application environment variables.

## Key Concept: NEXT_PUBLIC_SITE_URL

The `NEXT_PUBLIC_SITE_URL` environment variable is **critical** for authentication to work correctly. It tells Supabase where to redirect users after they click the magic link in their email.

### Why It Matters

When a user requests a magic link:
1. CoralCake constructs a callback URL: `${NEXT_PUBLIC_SITE_URL}/auth/callback`
2. This URL is sent to Supabase as the `emailRedirectTo` parameter
3. Supabase includes this URL in the magic link email
4. After clicking the link, the user is redirected to this URL with auth tokens
5. The `/auth/callback` page processes the tokens and completes authentication

**If `NEXT_PUBLIC_SITE_URL` is misconfigured, authentication will fail.**

## Configuration Steps

### Step 1: Supabase Dashboard Configuration

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Navigate to **Authentication** → **URL Configuration**
3. Configure the following settings:

#### Site URL
Set this to your **primary production domain**:
```
https://coralcake.vercel.app
```

#### Redirect URLs
Add **all** environments where users might authenticate:
```
http://localhost:3000/auth/callback
https://coralcake.vercel.app/auth/callback
https://*.vercel.app/auth/callback
```

**Explanation:**
- `http://localhost:3000/auth/callback` - For local development
- `https://coralcake.vercel.app/auth/callback` - For production
- `https://*.vercel.app/auth/callback` - For Vercel preview deployments (PR previews)

### Step 2: Environment Variable Configuration

#### Local Development

Create `.env.local` in your project root (copy from `.env.example`):

```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Important:** Use `http://localhost:3000` (not `https`) for local development.

#### Production (Vercel)

In your Vercel project settings → Environment Variables:

```bash
NEXT_PUBLIC_SITE_URL=https://coralcake.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### Preview Deployments (Optional)

For Vercel preview deployments, you have two options:

**Option 1: Use Vercel System Environment Variable (Recommended)**
Vercel automatically provides `VERCEL_URL` which contains the deployment URL:
```bash
# This is automatically available in Vercel
NEXT_PUBLIC_SITE_URL=https://${VERCEL_URL}
```

However, Next.js doesn't support variable interpolation in env vars, so you need to set it in your `next.config.ts`:

```typescript
// next.config.ts
const nextConfig = {
  env: {
    NEXT_PUBLIC_SITE_URL: process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  },
};
```

**Option 2: Use Wildcard Redirect (Current Setup)**
Keep `NEXT_PUBLIC_SITE_URL=https://coralcake.vercel.app` for previews and rely on the wildcard redirect URL `https://*.vercel.app/auth/callback` in Supabase.

## Authentication Flow

### Detailed Flow

1. **User enters email** on `/login` page or in header
2. **CoralCake calls** `supabase.auth.signInWithOtp()` with:
   ```typescript
   {
     email: 'user@example.com',
     options: {
       emailRedirectTo: `${NEXT_PUBLIC_SITE_URL}/auth/callback?redirectTo=/runner`
     }
   }
   ```
3. **Supabase validates** the redirect URL against dashboard configuration
4. **Supabase sends email** with magic link containing the auth tokens
5. **User clicks link** and browser opens: `http://localhost:3000/auth/callback#access_token=...&refresh_token=...`
6. **Client-side callback** (`/auth/callback/page.tsx`):
   - Extracts tokens from URL hash
   - Calls `supabase.auth.setSession()` to establish client session
   - Calls `/api/auth/sync` to sync session to server cookies
7. **Server-side sync** (`/api/auth/sync/route.ts`):
   - Receives tokens
   - Calls `supabase.auth.setSession()` with server client
   - Sets httpOnly cookies for SSR
8. **User redirected** to intended destination (e.g., `/runner`)

### Code Locations

- **Login UI**: `src/app/login/page.tsx` and `src/components/Header.tsx`
- **Callback Handler**: `src/app/auth/callback/page.tsx`
- **Server Sync**: `src/app/api/auth/sync/route.ts`
- **Client Factory**: `src/lib/supabase/client.ts`
- **Server Factory**: `src/lib/supabase/server.ts` (read-only)
- **Server Action Factory**: `src/lib/supabase/server-action.ts` (writable cookies)

## Common Issues and Troubleshooting

### Issue: "Invalid redirect URL" error

**Cause:** The callback URL is not in the Supabase allowed redirect URLs list.

**Solution:**
1. Check your `NEXT_PUBLIC_SITE_URL` environment variable
2. Ensure `${NEXT_PUBLIC_SITE_URL}/auth/callback` is in Supabase redirect URLs
3. For preview deployments, ensure wildcard `https://*.vercel.app/auth/callback` is added

### Issue: Authentication works locally but not in production

**Cause:** `NEXT_PUBLIC_SITE_URL` is not set correctly in production.

**Solution:**
1. Check Vercel environment variables
2. Ensure `NEXT_PUBLIC_SITE_URL=https://coralcake.vercel.app` in production
3. Redeploy after changing environment variables

### Issue: User redirected to wrong domain

**Cause:** `NEXT_PUBLIC_SITE_URL` mismatch between environments.

**Solution:**
- Local: Must be `http://localhost:3000`
- Production: Must be `https://coralcake.vercel.app`
- Never mix http/https incorrectly

### Issue: Cookies not set after authentication

**Cause:** Cookie security settings or domain mismatch.

**Solution:**
Check `src/lib/supabase/server-action.ts`:
```typescript
const isProd = process.env.NODE_ENV === 'production';
const merged = {
  secure: isProd,  // false for localhost, true for production
  sameSite: 'lax',
  httpOnly: true,
};
```
This is already correctly configured.

### Issue: RLS (Row Level Security) errors after authentication

**Cause:** Server components not seeing authenticated user.

**Solution:**
1. Verify cookies are set (check browser DevTools → Application → Cookies)
2. Verify `/api/auth/sync` returned `{ ok: true }`
3. Check middleware is not stripping cookies
4. Test with `/auth-debug` page to see server-side session

## Testing Authentication

### Local Testing

1. Start dev server: `npm run dev`
2. Go to http://localhost:3000
3. Enter email and click "Send link"
4. Check email for magic link
5. Click link - should redirect to http://localhost:3000/auth/callback
6. Should auto-redirect to intended page
7. Verify authenticated state in header

### Production Testing

1. Go to https://coralcake.vercel.app
2. Follow same steps as local testing
3. Magic link should contain https://coralcake.vercel.app/auth/callback
4. Verify authentication persists across page refreshes

### Debug Endpoints

- `/auth-debug` - Shows server-side authentication state (requires auth)
- `/provider-test` - Tests LLM provider connections (requires auth)

## Security Considerations

### Cookie Settings

The app uses secure, httpOnly cookies in production:
- `secure: true` in production (HTTPS only)
- `secure: false` in development (allows HTTP)
- `httpOnly: true` always (prevents XSS)
- `sameSite: 'lax'` (CSRF protection)

### Redirect URL Validation

Supabase validates all redirect URLs against the allow list. Never use:
- User-controlled redirect URLs without validation
- Open redirects that could be exploited
- HTTP URLs in production

### Environment Variables

- `NEXT_PUBLIC_*` vars are exposed to the browser (safe for Supabase URL and anon key)
- `OPENAI_API_KEY`, `HELICONE_API_KEY` etc. are server-only (never exposed)
- Never commit `.env.local` to version control

## Migration Notes

### Switching Domains

If you change your production domain:

1. Update Vercel environment variable: `NEXT_PUBLIC_SITE_URL`
2. Update Supabase Site URL
3. Add new domain to Supabase Redirect URLs
4. Keep old domain for 24-48 hours during transition
5. Redeploy application
6. Test authentication thoroughly

### Adding New Environments

For staging or other environments:

1. Add redirect URL to Supabase: `https://staging.example.com/auth/callback`
2. Set `NEXT_PUBLIC_SITE_URL=https://staging.example.com` in that environment
3. Test authentication before launching

## Code Change Summary

**Good news:** No code changes are required for authentication to work in different environments. The current implementation is environment-agnostic and relies solely on proper configuration.

### What's Already Correct

✅ Dynamic callback URL construction using `NEXT_PUBLIC_SITE_URL`
✅ Proper token extraction from URL hash
✅ Client and server session synchronization
✅ Environment-aware cookie settings (`secure` flag)
✅ Proper redirect flow with `redirectTo` parameter

### What You Need to Configure

⚙️ Supabase dashboard redirect URLs (one-time setup)
⚙️ Environment variables for each deployment target
⚙️ (Optional) Doppler or other secret management

## Best Practices

1. **Use Doppler or similar** for secret management in production
2. **Never commit** `.env.local` or real secrets to git
3. **Test authentication** in preview deployments before merging to production
4. **Monitor** Supabase auth logs for failed redirects
5. **Keep documentation updated** when adding new environments
6. **Use consistent URLs** - no trailing slashes, proper protocol (http vs https)

## Reference Links

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side-rendering)

---

**Last Updated:** January 2025  
**Applies to:** CoralCake v0.1+  
**Author:** Copilot AI Agent
