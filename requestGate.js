"use strict";

function createRequestGate({ windowMs = 10 * 60_000, limit = 40, maxKeys = 1_000, now = Date.now } = {}) {
  const buckets = new Map();

  return function take(key = "unknown") {
    const timestamp = now();
    let bucket = buckets.get(key);
    if (bucket && timestamp >= bucket.resetAt) {
      buckets.delete(key);
      bucket = null;
    }
    if (!bucket) {
      if (buckets.size >= maxKeys) {
        for (const [candidate, value] of buckets) {
          if (timestamp >= value.resetAt) buckets.delete(candidate);
        }
        if (buckets.size >= maxKeys) return { allowed: false, retryAfter: Math.ceil(windowMs / 1_000) };
      }
      bucket = { count: 0, resetAt: timestamp + windowMs };
      buckets.set(key, bucket);
    }
    if (bucket.count >= limit) return { allowed: false, retryAfter: Math.max(1, Math.ceil((bucket.resetAt - timestamp) / 1_000)) };
    bucket.count += 1;
    return { allowed: true, retryAfter: 0 };
  };
}

module.exports = { createRequestGate };
