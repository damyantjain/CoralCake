# Supabase Authentication Setup Guide

This guide explains how to properly configure Supabase authentication for CoralCake in both development and production environments.

## Overview

CoralCake uses Supabase for authentication with a magic link (passwordless) flow. The authentication requires proper configuration of redirect URLs in both the Supabase dashboard and your application environment variables.

## Key Concept: Dynamic Redirect URLs

CoralCake uses **runtime detection** to automatically determine the correct callback URL for authentication. This means authentication works seamlessly in any environment without requiring environment-specific configuration.

### How It Works

When a user requests a magic link:
1. CoralCake constructs a callback URL using `window.location.origin`: `${window.location.origin}/auth/callback`
2. This automatically uses the correct domain:
   - `http://localhost:3000/auth/callback` when running locally
   - `https://coralcake.vercel.app/auth/callback` in production
   - `https://preview-xyz.vercel.app/auth/callback` in preview deployments
3. This URL is sent to Supabase as the `emailRedirectTo` parameter
4. Supabase includes this URL in the magic link email
5. After clicking the link, the user is redirected to this URL with auth tokens
6. The `/auth/callback` page processes the tokens and completes authentication

**The authentication flow automatically adapts to any environment without configuration changes.**

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

#### Required Variables (All Environments)

Create `.env.local` in your project root (copy from `.env.example`):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Note:** You do NOT need to set `NEXT_PUBLIC_SITE_URL` anymore. The application automatically detects the correct URL using `window.location.origin` at runtime.

#### Production (Vercel)

In your Vercel project settings → Environment Variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

#### Preview Deployments

Preview deployments work automatically without any additional configuration. The authentication flow detects the preview URL at runtime and uses it for the callback.

## Authentication Flow

### Detailed Flow

1. **User enters email** on `/login` page or in header
2. **CoralCake calls** `supabase.auth.signInWithOtp()` with:
   ```typescript
   {
     email: 'user@example.com',
     options: {
       emailRedirectTo: `${window.location.origin}/auth/callback?redirectTo=/runner`
     }
   }
   ```
3. **Supabase validates** the redirect URL against dashboard configuration
4. **Supabase sends email** with magic link containing the auth tokens
5. **User clicks link** and browser opens to the callback URL with tokens: `${origin}/auth/callback#access_token=...&refresh_token=...`
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
1. Verify the URL where you're accessing the app is in Supabase redirect URLs
2. For local development: Ensure `http://localhost:3000/auth/callback` is added
3. For production: Ensure `https://coralcake.vercel.app/auth/callback` is added
4. For preview deployments: Ensure wildcard `https://*.vercel.app/auth/callback` is added

### Issue: Authentication works locally but not in production

**Cause:** The production URL is not in the Supabase allowed redirect URLs list.

**Solution:**
1. Go to Supabase dashboard → Authentication → URL Configuration
2. Add `https://coralcake.vercel.app/auth/callback` to redirect URLs
3. No code changes or redeployment needed

### Issue: Different redirect URL in magic link email

**Cause:** This should not happen with the current implementation using `window.location.origin`.

**Solution:**
If you see a mismatched URL in the magic link:
1. Clear your browser cache and try again
2. Verify you're running the latest version of the code
3. Check the browser console for the actual callback URL being sent

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

1. Update Supabase Site URL in dashboard
2. Add new domain to Supabase Redirect URLs: `https://new-domain.com/auth/callback`
3. Keep old domain in redirect URLs for 24-48 hours during transition
4. Test authentication on new domain
5. Remove old domain from redirect URLs after transition

**Note:** No code changes or environment variable updates needed. The app automatically detects the domain at runtime.

### Adding New Environments

For staging or other environments:

1. Add redirect URL to Supabase: `https://staging.example.com/auth/callback`
2. Deploy the application to staging
3. Test authentication - it will work automatically

**No environment-specific configuration needed.**

## Code Implementation

### How It Works

The authentication flow uses **runtime detection** to automatically adapt to any environment:

```typescript
// In src/app/login/page.tsx and src/components/Header.tsx
const callbackUrl = `${window.location.origin}/auth/callback`;
await supabase.auth.signInWithOtp({
  email,
  options: { 
    emailRedirectTo: `${callbackUrl}?redirectTo=${encodeURIComponent(redirectTo)}`
  }
});
```

### What's Correct

✅ **Runtime URL detection** using `window.location.origin` (not build-time env vars)
✅ **Proper token extraction** from URL hash
✅ **Client and server session synchronization**
✅ **Environment-aware cookie settings** (`secure` flag based on NODE_ENV)
✅ **Proper redirect flow** with `redirectTo` parameter

### What You Need to Configure

⚙️ **Supabase dashboard redirect URLs** (one-time setup for each domain)
⚙️ **Supabase environment variables** (URL and anon key)
⚙️ **(Optional) Doppler** or other secret management

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
