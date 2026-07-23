import { NextResponse, type NextRequest } from "next/server";
import { verifyState } from "@/lib/state";
import { exchangeCodeForClaims, isVerified } from "@/lib/oidc";
import { upsertIdvResult } from "@/lib/airtable";
import { isValidSubmissionId, sanitizeSlackId } from "@/lib/validate";
import { limitCallback } from "@/lib/rateLimit";
import { captureError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const errorRedirect = (eid: string) =>
    NextResponse.redirect(new URL(`/error?eid=${eid}`, origin));

  // Rate limit before doing any work (token exchange, Airtable, etc).
  if (!(await limitCallback(req))) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");

  // 1. Verify the HMAC-signed, freshness-checked state FIRST.
  const payload = verifyState(state);
  if (!payload || !isValidSubmissionId(payload.submissionId)) {
    return new NextResponse("Bad Request: invalid state", { status: 400 });
  }

  if (!code) {
    return new NextResponse("Bad Request: missing code", { status: 400 });
  }

  const submissionId = payload.submissionId;

  try {
    // 2. Exchange the code; read verification_status; discard all tokens.
    const { verificationStatus, firstName, email, slackId } =
      await exchangeCodeForClaims(code, state!);

    if (!isVerified(verificationStatus)) {
      // Users who came through /new-account are sent to start verification
      // rather than to the not-verified error page. return_to points back at
      // our own /auth/redirect so that, once verified, the OIDC check re-runs
      // and completes the flow automatically.
      if (payload.signup) {
        const returnTo = new URL("/auth/redirect", origin);
        returnTo.searchParams.set("id", submissionId);
        returnTo.searchParams.set("signup", "1");
        const verifyUrl = new URL("https://auth.hackclub.com/portal/verify");
        verifyUrl.searchParams.set("return_to", returnTo.toString());
        return NextResponse.redirect(verifyUrl);
      }
      const url = new URL("/error", origin);
      url.searchParams.set("reason", "not_verified");
      url.searchParams.set("id", submissionId);
      if (firstName) url.searchParams.set("name", firstName);
      return NextResponse.redirect(url);
    }

    // 3. Verified -> upsert the result into idv_results (keyed on submission_id).
    await upsertIdvResult(submissionId, "verified", email, sanitizeSlackId(slackId));
    const doneUrl = new URL("/done", origin);
    if (firstName) doneUrl.searchParams.set("name", firstName);
    return NextResponse.redirect(doneUrl);
  } catch (err) {
    const eid = captureError("auth/callback", err);
    return errorRedirect(eid);
  }
}
