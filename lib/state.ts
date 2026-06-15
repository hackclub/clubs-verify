import { createHmac, randomBytes, timingSafeEqual } from "crypto";

// We do not use a server-side session store. Instead the OIDC `state` param is a
// self-contained, HMAC-signed token. The callback re-derives the signature and
// verifies it before trusting any field, and rejects anything older than the TTL.

const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

export interface StatePayload {
  submissionId: string;
  nonce: string;
  timestamp: number;
}

function getSecret(): string {
  const secret = process.env.STATE_SECRET;
  if (!secret) throw new Error("STATE_SECRET is not configured");
  return secret;
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

function sign(payloadB64: string): string {
  return createHmac("sha256", getSecret()).update(payloadB64).digest("base64url");
}

/** Builds a signed state token: `<base64url(json)>.<base64url(hmac)>`. */
export function createState(submissionId: string): string {
  const payload: StatePayload = {
    submissionId,
    nonce: randomBytes(16).toString("hex"),
    timestamp: Date.now(),
  };
  const payloadB64 = base64url(JSON.stringify(payload));
  return `${payloadB64}.${sign(payloadB64)}`;
}

/**
 * Verifies the HMAC signature (constant-time) and the freshness of a state
 * token. Returns the decoded payload, or null if the token is malformed,
 * tampered with, or expired.
 */
export function verifyState(state: unknown): StatePayload | null {
  if (typeof state !== "string") return null;

  const dot = state.indexOf(".");
  if (dot <= 0 || dot === state.length - 1) return null;

  const payloadB64 = state.slice(0, dot);
  const sigB64 = state.slice(dot + 1);

  const expectedSig = sign(payloadB64);
  const given = Buffer.from(sigB64);
  const expected = Buffer.from(expectedSig);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return null;
  }

  let payload: StatePayload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (
    typeof payload?.submissionId !== "string" ||
    typeof payload?.nonce !== "string" ||
    typeof payload?.timestamp !== "number"
  ) {
    return null;
  }

  const age = Date.now() - payload.timestamp;
  if (!Number.isFinite(age) || age < 0 || age > STATE_TTL_MS) return null;

  return payload;
}
