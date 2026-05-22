'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function LoginPageComponent() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const searchParams = useSearchParams();

  async function onSendLink(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setIsError(true);
      setMsg('Enter your email.');
      return;
    }
    setLoading(true);
    setMsg(null);
    setIsError(false);

    const rawRedirect = searchParams.get('redirectTo');
    const safeRedirect =
      rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
        ? rawRedirect
        : '/';
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '');
    const callbackUrl = `${origin}/auth/callback?redirectTo=${encodeURIComponent(safeRedirect)}`;

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: callbackUrl },
    });

    setLoading(false);
    if (error) {
      setIsError(true);
      setMsg(error.message);
    } else {
      setIsError(false);
      setMsg('Check your email for the sign-in link.');
      setEmail('');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-white">
            Sign in to <span className="text-primary">CoralCake</span>
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            Enter your email to receive a magic link
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Magic link</CardTitle>
            <CardDescription>
              We&apos;ll email you a one-time link to sign in. No password needed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSendLink} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>

              {msg && (
                <Alert variant={isError ? 'destructive' : 'default'} role={isError ? 'alert' : 'status'}>
                  <AlertDescription>{msg}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Sending…' : 'Send magic link'}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              By signing in, you agree to our terms of service and privacy policy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="text-center">
            <div
              className="motion-safe:animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"
              role="status"
              aria-label="Loading"
            />
            <p className="text-white">Loading…</p>
          </div>
        </div>
      }
    >
      <LoginPageComponent />
    </Suspense>
  );
}
