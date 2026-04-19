type Bucket = {
  tokens: number;
  updatedAt: number;
};

type LimiterOptions = {
  capacity: number;
  refillPerSecond: number;
  maxEntries?: number;
};

// In-memory token bucket. Good enough for a single Node instance; swap for
// Upstash/Redis once the app is horizontally scaled.
export function createRateLimiter(options: LimiterOptions) {
  const capacity = options.capacity;
  const refillPerMs = options.refillPerSecond / 1000;
  const maxEntries = options.maxEntries ?? 5000;
  const buckets = new Map<string, Bucket>();

  return function consume(key: string, cost = 1): boolean {
    const now = Date.now();
    let bucket = buckets.get(key);

    if (!bucket) {
      if (buckets.size >= maxEntries) {
        const oldestKey = buckets.keys().next().value;
        if (oldestKey !== undefined) {
          buckets.delete(oldestKey);
        }
      }
      bucket = { tokens: capacity, updatedAt: now };
      buckets.set(key, bucket);
    } else {
      const elapsed = now - bucket.updatedAt;
      bucket.tokens = Math.min(capacity, bucket.tokens + elapsed * refillPerMs);
      bucket.updatedAt = now;
      // Refresh LRU position.
      buckets.delete(key);
      buckets.set(key, bucket);
    }

    if (bucket.tokens < cost) {
      return false;
    }

    bucket.tokens -= cost;
    return true;
  };
}

export function readClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  return "anonymous";
}
