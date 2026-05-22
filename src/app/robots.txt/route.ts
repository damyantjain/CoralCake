export const runtime = 'edge';

export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /

# Allow crawling of main pages
Allow: /runner
Allow: /runs-last

# Disallow sensitive endpoints
Disallow: /api/

Sitemap: https://coralcake.vercel.app/sitemap.xml`;

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}