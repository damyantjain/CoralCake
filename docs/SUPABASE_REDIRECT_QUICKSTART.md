# Supabase Redirect Configuration - Quick Reference

This is a quick reference for configuring Supabase authentication redirects. For detailed information, see [SUPABASE_AUTH_SETUP.md](SUPABASE_AUTH_SETUP.md).

## The One Critical Thing

**Set `NEXT_PUBLIC_SITE_URL` correctly for each environment.**

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

### ✅ Local Development

Create `.env.local` (copy from `.env.example`):
```bash
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### ✅ Production (Vercel)

In Vercel project settings → Environment Variables:
```bash
NEXT_PUBLIC_SITE_URL=https://coralcake.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Code Changes Required?

**No.** The existing codebase is already properly configured. It uses `NEXT_PUBLIC_SITE_URL` to dynamically construct callback URLs:

```typescript
// This already works correctly in both environments
const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`;
```

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
- **Fix:** Ensure callback URL is in Supabase's allowed list
- **Check:** Does `${NEXT_PUBLIC_SITE_URL}/auth/callback` match one of the configured redirect URLs?

### ❌ Auth works locally but not in production
- **Fix:** Set `NEXT_PUBLIC_SITE_URL=https://coralcake.vercel.app` in Vercel environment variables
- **Remember:** Redeploy after changing environment variables

### ❌ Wrong domain in magic link
- **Fix:** Check that `NEXT_PUBLIC_SITE_URL` is correct for the environment
- **Local:** Must be `http://localhost:3000` (not https)
- **Production:** Must be `https://coralcake.vercel.app` (not http)

## How It Works

1. User enters email
2. App calls Supabase with `emailRedirectTo: ${NEXT_PUBLIC_SITE_URL}/auth/callback?redirectTo=/runner`
3. Supabase validates URL against allowed redirect URLs
4. Supabase sends email with magic link
5. User clicks link → redirected to callback URL with auth tokens
6. Callback page processes tokens and sets up session
7. User redirected to intended destination

## Need More Help?

See [SUPABASE_AUTH_SETUP.md](SUPABASE_AUTH_SETUP.md) for:
- Detailed authentication flow explanation
- Troubleshooting guide
- Security considerations
- Preview deployment setup
- Code walkthrough

---

**Quick Answer to the Issue:**
No code changes needed. Just ensure:
1. Supabase dashboard has all three redirect URLs configured
2. `NEXT_PUBLIC_SITE_URL` is set correctly in each environment
3. Environment is correct (http for local, https for prod)

That's it! 🎉
