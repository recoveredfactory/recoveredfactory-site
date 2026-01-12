type Bucket = {
  tokens: number;
  lastRefillMs: number;
};

const buckets = new Map<string, Bucket>();
const MAX_TOKENS = 30;
const REFILL_TOKENS_PER_SECOND = 0.5;

export function checkRateLimit(key: string, nowMs = Date.now()): boolean {
  const bucket = buckets.get(key) ?? {
    tokens: MAX_TOKENS,
    lastRefillMs: nowMs,
  };

  const elapsedSeconds = (nowMs - bucket.lastRefillMs) / 1000;
  bucket.tokens = Math.min(
    MAX_TOKENS,
    bucket.tokens + elapsedSeconds * REFILL_TOKENS_PER_SECOND,
  );
  bucket.lastRefillMs = nowMs;

  if (bucket.tokens < 1) {
    buckets.set(key, bucket);
    return false;
  }

  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return true;
}

// In-memory only: replace with Redis/Dynamo for distributed rate limits.
