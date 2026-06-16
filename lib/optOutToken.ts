import { createHmac, randomBytes, timingSafeEqual } from "crypto";

// Short-lived, HMAC-signed token that authorizes a single opt-out POST. It is
// minted by the opt-out confirmation page (server component) and required by
// the API route, so a bare submission id — e.g. recovered from a leaked link or
// guessed — cannot trigger the permanent club deletion on its own; the caller
// must also present a fresh token bound to that exact id.
//
// Domain-separated from the OIDC state token (lib/state.ts) by the "optout:"
// prefix folded into the signature, so the two token types are never
// interchangeable even though they share STATE_SECRET.

const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes
const DOMAIN = "optout:";

interface OptOutPayload {
  submissionId: string;
  nonce: string;
  timestamp: number;
}

function getSecret(): string {
  const secret = process.env.STATE_SECRET;
  if (!secret) throw new Error("STATE_SECRET is not configured");
  return secret;
}

function sign(payloadB64: string): string {
  return createHmac("sha256", getSecret())
    .update(DOMAIN + payloadB64)
    .digest("base64url");
}

/** Builds a signed opt-out token bound to the given submission id. */
export function createOptOutToken(submissionId: string): string {
  const payload: OptOutPayload = {
    submissionId,
    nonce: randomBytes(16).toString("hex"),
    timestamp: Date.now(),
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${payloadB64}.${sign(payloadB64)}`;
}

/**
 * Verifies the signature (constant-time), freshness, and that the token was
 * issued for `submissionId`. Returns false for anything malformed, tampered,
 * expired, or bound to a different id.
 */
export function verifyOptOutToken(
  token: unknown,
  submissionId: string,
): boolean {
  if (typeof token !== "string") return false;

  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return false;

  const payloadB64 = token.slice(0, dot);
  const sigB64 = token.slice(dot + 1);

  const given = Buffer.from(sigB64);
  const expected = Buffer.from(sign(payloadB64));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return false;
  }

  let payload: OptOutPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return false;
  }

  if (
    typeof payload?.submissionId !== "string" ||
    typeof payload?.nonce !== "string" ||
    typeof payload?.timestamp !== "number"
  ) {
    return false;
  }
  if (payload.submissionId !== submissionId) return false;

  const age = Date.now() - payload.timestamp;
  if (!Number.isFinite(age) || age < 0 || age > TOKEN_TTL_MS) return false;

  return true;
}
