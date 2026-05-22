import { randomBytes } from 'crypto';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Combine class names with Tailwind-aware conflict resolution. Standard
// shadcn/ui helper — keeps variants from later args overriding earlier ones.
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

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