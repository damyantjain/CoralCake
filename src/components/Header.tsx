'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [email, setEmail] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();
  const msgTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // get current session user (if any)
    supabase.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
    // listen for changes
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
      process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '');
    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });
    setLoading(false);
    setMsg(error ? error.message : 'Check your email for the sign-in link.');
    if (!error) setEmail('');
  }

  async function onSignOut() {
    await supabase.auth.signOut();
    setUserEmail(null);
  }

  return (
    <header className="sticky top-0 z-20 border-b bg-white backdrop-blur shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between p-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-semibold text-gray-900">CoralCake</Link>
          <nav className="hidden sm:flex items-center gap-4">
            <Link
              href="/runner"
              className={`text-sm ${pathname === '/runner' ? 'text-orange-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Runner
            </Link>
            <Link
              href="/compare"
              className={`text-sm ${pathname === '/compare' ? 'text-orange-600 font-medium' : 'text-gray-600 hover:text-gray-900'}`}
            >
              Compare
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          {userEmail ? (
            <>
              <span className="text-sm text-gray-600">{userEmail}</span>
              <button
                type="button"
                onClick={onSignOut}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50"
              >
                Sign out
              </button>
            </>
          ) : (
            <form onSubmit={onSendLink} className="flex items-center gap-2">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900"
              />
              <button
                type="submit"
                disabled={loading}
                className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {loading ? 'Sending…' : 'Send link'}
              </button>
            </form>
          )}
        </div>
      </div>
      {msg && <div className="bg-emerald-50 px-4 py-2 text-center text-sm text-emerald-700">{msg}</div>}
    </header>
  );
}
