import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

type LimiterConfig = {
  name: string;
  limit: number;
  windowSeconds: number;
};

type LimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

const upstashConfigured =
  !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN;

let warnedNoUpstash = false;
function warnDevFallback() {
  if (!warnedNoUpstash && process.env.NODE_ENV !== 'test') {
    console.warn(
      '[ratelimit] UPSTASH_REDIS_REST_URL/TOKEN not set — falling back to in-memory limiter. ' +
        'Not safe in production (per-instance, lost on cold start).',
    );
    warnedNoUpstash = true;
  }
}

const memCounters = new Map<string, { count: number; resetAt: number }>();

function memLimit(key: string, cfg: LimiterConfig): LimitResult {
  const now = Date.now();
  const windowMs = cfg.windowSeconds * 1000;
  const existing = memCounters.get(key);
  if (!existing || existing.resetAt <= now) {
    memCounters.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, limit: cfg.limit, remaining: cfg.limit - 1, reset: now + windowMs };
  }
  existing.count += 1;
  const remaining = Math.max(0, cfg.limit - existing.count);
  return {
    success: existing.count <= cfg.limit,
    limit: cfg.limit,
    remaining,
    reset: existing.resetAt,
  };
}

const redis = upstashConfigured ? Redis.fromEnv() : null;
const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(cfg: LimiterConfig): Ratelimit | null {
  if (!redis) return null;
  let limiter = upstashLimiters.get(cfg.name);
  if (!limiter) {
    limiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(cfg.limit, `${cfg.windowSeconds} s`),
      analytics: false,
      prefix: `cc:ratelimit:${cfg.name}`,
    });
    upstashLimiters.set(cfg.name, limiter);
  }
  return limiter;
}

export async function checkRateLimit(
  cfg: LimiterConfig,
  identifier: string,
): Promise<LimitResult> {
  const key = `${cfg.name}:${identifier}`;
  const limiter = getUpstashLimiter(cfg);
  if (!limiter) {
    warnDevFallback();
    return memLimit(key, cfg);
  }
  const r = await limiter.limit(identifier);
  return { success: r.success, limit: r.limit, remaining: r.remaining, reset: r.reset };
}

export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

export const RUN_LIMITER: LimiterConfig = { name: 'run', limit: 10, windowSeconds: 60 };
export const RUN_LIMITER_IP: LimiterConfig = { name: 'run-ip', limit: 30, windowSeconds: 60 };
export const EVALUATE_LIMITER: LimiterConfig = { name: 'evaluate', limit: 60, windowSeconds: 60 };

export function rateLimitHeaders(r: LimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(r.limit),
    'X-RateLimit-Remaining': String(r.remaining),
    'X-RateLimit-Reset': String(Math.ceil(r.reset / 1000)),
  };
}
