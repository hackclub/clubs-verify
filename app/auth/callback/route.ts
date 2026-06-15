import { NextResponse, type NextRequest } from "next/server";
import { verifyState } from "@/lib/state";
import { exchangeCodeForClaims, isVerified } from "@/lib/oidc";
import { findLeaderBySubmissionId, updateIdvStatus } from "@/lib/airtable";
import { isValidSubmissionId } from "@/lib/validate";
import { limitCallback } from "@/lib/rateLimit";
import { newErrorId, logError } from "@/lib/errors";

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
    const { verificationStatus, firstName } = await exchangeCodeForClaims(
      code,
      state!,
    );

    if (!isVerified(verificationStatus)) {
      const url = new URL("/error", origin);
      url.searchParams.set("reason", "not_verified");
      url.searchParams.set("id", submissionId);
      if (firstName) url.searchParams.set("name", firstName);
      return NextResponse.redirect(url);
    }

    // 3. Verified -> mark the Leaders record.
    const record = await findLeaderBySubmissionId(submissionId);
    if (!record) {
      const eid = newErrorId();
      logError(eid, "auth/callback", new Error("no Leaders record for submissionId"));
      return errorRedirect(eid);
    }

    await updateIdvStatus(record.id, "verified");
    const doneUrl = new URL("/done", origin);
    if (firstName) doneUrl.searchParams.set("name", firstName);
    return NextResponse.redirect(doneUrl);
  } catch (err) {
    const eid = newErrorId();
    logError(eid, "auth/callback", err);
    return errorRedirect(eid);
  }
}
