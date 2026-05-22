'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

export default function Header() {
  const [email, setEmail] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const msgTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserEmail(session?.user?.email ?? null);
    });
    return () => {
      sub.subscription.unsubscribe();
      if (msgTimeoutRef.current) clearTimeout(msgTimeoutRef.current);
    };
  }, []);

  // Auto-clear the inline msg after 5s so a stale "Check your email…"
  // banner doesn't linger across navigation.
  useEffect(() => {
    if (!msg) return;
    if (msgTimeoutRef.current) clearTimeout(msgTimeoutRef.current);
    msgTimeoutRef.current = setTimeout(() => setMsg(null), 5000);
    return () => {
      if (msgTimeoutRef.current) clearTimeout(msgTimeoutRef.current);
    };
  }, [msg]);

  async function onSendLink(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setMsg('Enter your email.');
      return;
    }
    setLoading(true);
    setMsg(null);
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '');
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { emailRedirectTo: `${origin}/auth/callback` },
    });
    setLoading(false);
    setMsg(error ? error.message : 'Check your email for the sign-in link.');
    if (!error) setEmail('');
  }

  async function onSignOut() {
    await supabase.auth.signOut();
    setUserEmail(null);
  }

  const navLinkClass = (active: boolean) =>
    cn(
      'text-sm transition-colors',
      active ? 'text-primary font-medium' : 'text-muted-foreground hover:text-foreground',
    );

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 p-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-foreground">
            CoralCake
          </Link>
          <nav className="hidden sm:flex items-center gap-4" aria-label="Primary">
            <Link href="/runner" className={navLinkClass(pathname === '/runner')}>
              Runner
            </Link>
            <Link href="/compare" className={navLinkClass(pathname === '/compare')}>
              Compare
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {userEmail ? (
            <>
              <span className="hidden sm:inline text-sm text-muted-foreground" aria-label="Signed in as">
                {userEmail}
              </span>
              <Button type="button" variant="outline" size="sm" onClick={onSignOut}>
                Sign out
              </Button>
            </>
          ) : (
            <form onSubmit={onSendLink} className="flex items-center gap-2">
              <Label htmlFor="header-email" className="sr-only">
                Email address
              </Label>
              <Input
                id="header-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="h-8 w-44 sm:w-56"
                autoComplete="email"
              />
              <Button type="submit" variant="outline" size="sm" disabled={loading}>
                {loading ? 'Sending…' : 'Send link'}
              </Button>
            </form>
          )}
        </div>
      </div>
      {msg && (
        <Alert
          role={msg.toLowerCase().includes('error') ? 'alert' : 'status'}
          className="mx-auto max-w-6xl rounded-none border-x-0 border-t-0"
        >
          <AlertDescription className="text-center">{msg}</AlertDescription>
        </Alert>
      )}
    </header>
  );
}
