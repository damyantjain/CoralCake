'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

function AuthCallbackComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    (async () => {
      // Only honor relative same-origin redirects — refuse anything that
      // could send the user (and their fresh session) to a third party.
      const rawRedirect = searchParams.get('redirectTo');
      const redirectTo =
        rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
          ? rawRedirect
          : '/';

      // Parse tokens from the URL hash fragment: #access_token=...&refresh_token=...
      const hash = window.location.hash.startsWith('#')
        ? window.location.hash.substring(1)
        : '';
      const params = new URLSearchParams(hash);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      if (!access_token || !refresh_token) {
        console.error('No access/refresh token in callback URL');
        router.replace('/?auth=error_missing_tokens');
        return;
      }

      // 1) Set client session
      const { error: setErr } = await supabase.auth.setSession({
        access_token,
        refresh_token,
      });
      if (setErr) {
        console.error('setSession error', setErr);
        router.replace('/?auth=error_setsession');
        return;
      }

      // 2) Sync to server cookies so Server Components can see user
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token, refresh_token }),
      });
      if (!res.ok) {
        console.error('sync failed', await res.text());
        router.replace('/?auth=error_sync');
        return;
      }

      // 3) Redirect to intended destination
      router.replace(redirectTo);

      // 4) Signal to other tabs that auth succeeded and close this tab if it was opened from another tab
      try {
        // Signal success to other tabs via localStorage. Do NOT include the
        // access token — that's a bearer credential and putting it in
        // localStorage exposes it to any XSS in the app.
        localStorage.setItem('coralcake_auth_success', JSON.stringify({
          timestamp: Date.now(),
          redirectTo,
        }));

        // Clean up localStorage after 15 seconds to prevent stale data
        setTimeout(() => {
          try {
            localStorage.removeItem('coralcake_auth_success');
          } catch {
            // Ignore cleanup errors
          }
        }, 15000);

        // Try to communicate with opener window (if this tab was opened by clicking magic link)
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage({
            type: 'CORALCAKE_AUTH_SUCCESS',
            redirectTo
          }, window.location.origin);

          // Close this tab since the original tab will handle the redirect
          setTimeout(() => {
            window.close();
          }, 1000);
        }
      } catch (error) {
        // Ignore localStorage/postMessage errors - auth still succeeded
        console.log('Cross-tab communication failed (non-critical):', error);
      }
    })();
  }, [router, searchParams]);

  return <p className="p-4 text-sm">Signing you in…</p>;
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<p className="p-4 text-sm">Loading…</p>}>
      <AuthCallbackComponent />
    </Suspense>
  );
}
