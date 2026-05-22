import { randomBytes } from 'crypto';

// Utility for wrapping promises with timeout
export function withTimeout<T>(p: Promise<T>, ms = 30_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      }
    );
  });
}

// URL-safe 10-char slug from 8 random bytes (~48 bits of entropy after
// trimming). Used for /b/[slug] benchmark URLs.
export function generateSlug(): string {
  return randomBytes(8).toString('base64url').slice(0, 10);
}