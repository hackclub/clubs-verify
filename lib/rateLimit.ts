import { RateLimiterMemory } from "rate-limiter-flexible";

// In-memory rate limiting. This is per-instance (sufficient for the low traffic
// of a one-time verification step); it resets on cold start and is not shared
// across serverless instances.

const callbackLimiter = new RateLimiterMemory({
  keyPrefix: "auth_callback",
  points: 10, // requests
  duration: 60, // per 60s per IP
});

const optOutLimiter = new RateLimiterMemory({
  keyPrefix: "opt_out",
  points: 5,
  duration: 60,
});

/** Best-effort client IP extraction from proxy headers. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

async function tryConsume(
  limiter: RateLimiterMemory,
  key: string,
): Promise<boolean> {
  try {
    await limiter.consume(key);
    return true;
  } catch {
    return false; // rejected: out of points
  }
}

export function limitCallback(req: Request): Promise<boolean> {
  return tryConsume(callbackLimiter, clientIp(req));
}

export function limitOptOut(req: Request): Promise<boolean> {
  return tryConsume(optOutLimiter, clientIp(req));
}
