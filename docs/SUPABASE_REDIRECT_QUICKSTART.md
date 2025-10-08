# Supabase Redirect Configuration - Quick Reference

This is a quick reference for configuring Supabase authentication redirects. For detailed information, see [SUPABASE_AUTH_SETUP.md](SUPABASE_AUTH_SETUP.md).

## The One Critical Thing

**Add all your domains to Supabase redirect URLs.** The app automatically detects the correct URL at runtime.

## Configuration Checklist

### ✅ Supabase Dashboard (One-time setup)

In your Supabase project settings → Authentication → URL Configuration:

**Site URL:**
```
https://coralcake.vercel.app
```

**Redirect URLs (add all three):**
```
http://localhost:3000/auth/callback
https://coralcake.vercel.app/auth/callback
https://*.vercel.app/auth/callback
```

### ✅ All Environments

Create `.env.local` for local development (copy from `.env.example`):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

In Vercel, set the same environment variables. **No `NEXT_PUBLIC_SITE_URL` needed.**

## How It Works

The application automatically detects the correct callback URL using `window.location.origin`:

```typescript
// Automatically uses the correct domain at runtime
const callbackUrl = `${window.location.origin}/auth/callback`;
```

This means:
- ✅ Works in **any** environment without configuration
- ✅ No build-time environment variables needed
- ✅ Preview deployments work automatically
- ✅ No Doppler/environment-specific setup required

## Testing Authentication

### Local (http://localhost:3000)
1. Start dev server: `npm run dev`
2. Go to http://localhost:3000
3. Enter email, click "Send link"
4. Check email and click the magic link
5. Should redirect back to http://localhost:3000/auth/callback
6. Should auto-redirect to your intended page

### Production (https://coralcake.vercel.app)
1. Go to https://coralcake.vercel.app
2. Same steps as local
3. Magic link should point to https://coralcake.vercel.app/auth/callback

## Common Issues

### ❌ "Invalid redirect URL"
- **Fix:** Add the domain to Supabase's allowed redirect URLs
- **Local:** Add `http://localhost:3000/auth/callback`
- **Production:** Add `https://coralcake.vercel.app/auth/callback`
- **Previews:** Add `https://*.vercel.app/auth/callback`

### ❌ Auth works locally but not in production
- **Fix:** Add production URL to Supabase redirect URLs: `https://coralcake.vercel.app/auth/callback`
- **No code changes or redeployment needed**

### ❌ Wrong domain in magic link
- **Unlikely with current implementation** (uses runtime detection)
- **If it happens:** Clear browser cache and ensure you're running the latest code

## How It Works

1. User enters email
2. App detects current domain: `window.location.origin`
3. App calls Supabase with `emailRedirectTo: ${window.location.origin}/auth/callback?redirectTo=/runner`
4. Supabase validates URL against allowed redirect URLs
5. Supabase sends email with magic link to the detected domain
6. User clicks link → redirected to callback URL with auth tokens
7. Callback page processes tokens and sets up session
8. User redirected to intended destination

**Key advantage:** Works in any environment automatically, no configuration needed.

## Need More Help?

See [SUPABASE_AUTH_SETUP.md](SUPABASE_AUTH_SETUP.md) for:
- Detailed authentication flow explanation
- Troubleshooting guide
- Security considerations
- Preview deployment setup
- Code walkthrough

---

**Quick Answer:**
1. Add all domains to Supabase redirect URLs (one-time setup)
2. Set Supabase URL and anon key in environment variables
3. That's it! The app automatically detects the correct domain at runtime 🎉
