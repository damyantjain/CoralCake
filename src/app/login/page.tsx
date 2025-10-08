'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';

function LoginPageComponent() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/';

  async function onSendLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const callbackUrl = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${callbackUrl}?redirectTo=${encodeURIComponent(redirectTo)}`
      }
    });

    setLoading(false);
    if (error) {
      setMsg(error.message);
    } else {
      setMsg('Check your email for the sign-in link.');
      setEmail('');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-white">
            Sign in to <span className="text-orange-400">CoralCake</span>
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Enter your email to receive a magic link
          </p>
        </div>
        <div className="mt-8 bg-white shadow-lg rounded-lg p-8">
          <form onSubmit={onSendLink} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-orange-500 focus:border-orange-500 focus:z-10 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>

            {msg && (
              <div className={`rounded-md p-4 ${msg.includes('error') || msg.includes('Error') ? 'bg-red-50 border border-red-200' : 'bg-emerald-50 border border-emerald-200'}`}>
                <div className={`text-sm ${msg.includes('error') || msg.includes('Error') ? 'text-red-800' : 'text-emerald-800'}`}>
                  {msg}
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? 'Sending...' : 'Send magic link'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-600">
              By signing in, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    }>
      <LoginPageComponent />
    </Suspense>
  );
}
