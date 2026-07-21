type Bucket = { count: number; resetAt: number };

declare global {
  var eyedComunRateLimits: Map<string, Bucket> | undefined;
}

const buckets = global.eyedComunRateLimits || new Map<string, Bucket>();
global.eyedComunRateLimits = buckets;

export class RateLimitError extends Error {
  constructor(public readonly retryAfterSeconds: number) {
    super("Has realizado demasiadas solicitudes");
  }
}

export function enforceRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  if (current.count >= limit) {
    throw new RateLimitError(Math.max(1, Math.ceil((current.resetAt - now) / 1000)));
  }
  current.count += 1;

  if (buckets.size > 10_000) {
    for (const [bucketKey, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(bucketKey);
    }
  }
}

export function rateLimitResponse(error: unknown) {
  if (!(error instanceof RateLimitError)) return null;
  return Response.json(
    { error: error.message },
    { status: 429, headers: { "Retry-After": String(error.retryAfterSeconds) } },
  );
}
