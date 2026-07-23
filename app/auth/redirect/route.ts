import { NextResponse, type NextRequest } from "next/server";
import { isValidSubmissionId } from "@/lib/validate";
import { createState } from "@/lib/state";
import { buildAuthorizationUrl } from "@/lib/oidc";
import { captureError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  const signup = req.nextUrl.searchParams.get("signup") === "1";

  if (!isValidSubmissionId(id)) {
    return new NextResponse("Bad Request: invalid id", { status: 400 });
  }

  try {
    const state = createState(id, signup);
    const authUrl = await buildAuthorizationUrl(state);
    return NextResponse.redirect(authUrl);
  } catch (err) {
    const errorId = captureError("auth/redirect", err);
    return NextResponse.redirect(new URL(`/error?eid=${errorId}`, req.nextUrl.origin));
  }
}
