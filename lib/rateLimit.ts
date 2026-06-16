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

// Number of trusted reverse proxies in front of the app (e.g. 1 for a single
// CDN / load balancer like Vercel). The real client IP is the entry this many
// hops from the RIGHT of X-Forwarded-For — everything to its left is appended
// by the client and is attacker-controlled, so we must not key rate limits on
// it. Taking the leftmost entry (the old behaviour) let anyone bypass the limit
// by sending a spoofed `X-Forwarded-For` header.
const TRUSTED_PROXY_HOPS = Math.max(
  1,
  Number(process.env.TRUSTED_PROXY_HOPS ?? "1") || 1,
);

/** Client IP from proxy headers, ignoring client-spoofable XFF entries. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) {
    const ips = fwd
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (ips.length > 0) {
      const idx = ips.length - TRUSTED_PROXY_HOPS;
      const ip = idx >= 0 ? ips[idx] : ips[0];
      if (ip) return ip;
    }
  }
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
