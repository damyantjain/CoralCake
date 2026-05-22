// src/app/layout.tsx
import './globals.css';
import { headers } from 'next/headers';
import Header from '@/components/Header';
import AuthSync from '@/components/AuthSync';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { Metadata, Viewport } from 'next';

// The CSP middleware sets a per-request nonce in `x-nonce`. Reading it
// here opts the entire app into dynamic rendering, which is required so
// the inline framework <script> tags Next.js emits get a fresh nonce on
// every response (otherwise they'd be pre-rendered without one and the
// browser would block them under the strict CSP).
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'CoralCake - Compare LLMs with Performance Metrics',
  description: 'Run prompts across multiple language models and compare their performance, latency, token usage, and costs in real-time.',
  keywords: 'LLM, language models, OpenAI, Mistral, performance comparison, AI tools',
  authors: [{ name: 'CoralCake Team' }],
  robots: 'index, follow',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f97316',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read x-nonce to force dynamic rendering. The value isn't yet used in
  // any explicit <Script> tag, but reading it ensures the framework's
  // scripts inherit the request-scoped nonce.
  await headers();

  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <TooltipProvider delayDuration={300}>
          <AuthSync />
          <Header />
          <main>{children}</main>
        </TooltipProvider>
      </body>
    </html>
  );
}
