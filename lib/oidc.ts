import { Issuer, type Client } from "openid-client";

// OIDC against auth.hackclub.com. We never persist any token: the access /
// refresh / id tokens returned by the code exchange are read once for their
// claims and then dropped when the request handler returns.

const DISCOVERY_URL = "https://auth.hackclub.com/.well-known/openid-configuration";
// `profile` releases the name / given_name / family_name claims, used for the
// personalised greeting on /done and /error.
export const OIDC_SCOPES = "openid email profile verification_status";

let clientPromise: Promise<Client> | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

/** Discovers the issuer once and memoizes the configured client for reuse. */
export function getOidcClient(): Promise<Client> {
  if (!clientPromise) {
    clientPromise = (async () => {
      const issuer = await Issuer.discover(DISCOVERY_URL);
      return new issuer.Client({
        client_id: requireEnv("HACKCLUB_OAUTH_CLIENT_ID"),
        client_secret: requireEnv("HACKCLUB_OAUTH_CLIENT_SECRET"),
        redirect_uris: [requireEnv("HACKCLUB_OAUTH_REDIRECT_URI")],
        response_types: ["code"],
      });
    })().catch((err) => {
      // Allow a later request to retry discovery instead of caching the failure.
      clientPromise = null;
      throw err;
    });
  }
  return clientPromise;
}

export function getRedirectUri(): string {
  return requireEnv("HACKCLUB_OAUTH_REDIRECT_URI");
}

/** Builds the authorization endpoint URL for the given signed state token. */
export async function buildAuthorizationUrl(state: string): Promise<string> {
  const client = await getOidcClient();
  return client.authorizationUrl({
    scope: OIDC_SCOPES,
    state,
  });
}

export interface VerificationClaims {
  verificationStatus: unknown;
  firstName?: string;
}

/**
 * Best-effort first name from the ID token claims, for a friendly greeting.
 * Falls back to undefined when no usable name claim is present (e.g. the
 * provider didn't include `name` / `given_name`). Never falls back to email.
 */
function deriveFirstName(claims: Record<string, unknown>): string | undefined {
  const given = typeof claims.given_name === "string" ? claims.given_name : "";
  const full = typeof claims.name === "string" ? claims.name : "";
  const raw = given || full.trim().split(/\s+/)[0] || "";
  const cleaned = raw.trim().slice(0, 40);
  return cleaned || undefined;
}

/**
 * Exchanges the authorization code for tokens, reads the verification_status
 * claim from the validated ID token, and immediately discards every token.
 * The expected state is passed through so openid-client's own check passes; the
 * authentic HMAC validation has already happened in the caller.
 */
export async function exchangeCodeForClaims(
  code: string,
  expectedState: string,
): Promise<VerificationClaims> {
  const client = await getOidcClient();

  let tokenSet = await client.callback(
    getRedirectUri(),
    { code, state: expectedState },
    { state: expectedState },
  );

  try {
    const claims = tokenSet.claims();
    return {
      verificationStatus: claims["verification_status"],
      firstName: deriveFirstName(claims),
    };
  } finally {
    // Drop all token material. Nothing is stored, logged, or returned.
    tokenSet = undefined as never;
  }
}

/**
 * Normalizes the verification_status claim to a boolean "is verified" result.
 * Hack Club Auth reports this as the string "verified" when complete.
 */
export function isVerified(status: unknown): boolean {
  return typeof status === "string" && status.toLowerCase() === "verified";
}
