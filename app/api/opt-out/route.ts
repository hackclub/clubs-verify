import { NextResponse, type NextRequest } from "next/server";
import { isValidSubmissionId } from "@/lib/validate";
import {
  findLeaderBySubmissionId,
  updateIdvStatus,
  getLinkedClubIds,
  deleteClub,
} from "@/lib/airtable";
import { limitOptOut } from "@/lib/rateLimit";
import { verifyOptOutToken } from "@/lib/optOutToken";
import { captureError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const origin = req.nextUrl.origin;

  if (!(await limitOptOut(req))) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  // Reject cross-site form submissions: this is a destructive POST, so only
  // honour it when the Origin header (sent by browsers on form posts) matches
  // our own origin. Requests without an Origin (e.g. same-origin in some
  // browsers) fall through to the token check below.
  const reqOrigin = req.headers.get("origin");
  if (reqOrigin && reqOrigin !== origin) {
    return new NextResponse("Bad Request: bad origin", { status: 400 });
  }

  // The confirmation form posts the id and a signed opt-out token as form data.
  const form = await req.formData().catch(() => null);
  const id = form?.get("id");
  const token = form?.get("token");

  if (!isValidSubmissionId(id)) {
    return new NextResponse("Bad Request: invalid id", { status: 400 });
  }

  // Require a fresh, id-bound signed token so a bare submission id cannot drive
  // the permanent deletion on its own — the caller must have rendered the
  // confirmation page for this same id.
  if (!verifyOptOutToken(token, id)) {
    return new NextResponse("Bad Request: invalid token", { status: 400 });
  }

  try {
    const record = await findLeaderBySubmissionId(id);
    if (!record) {
      const eid = captureError("api/opt-out", new Error("no Leaders record for submissionId"));
      return NextResponse.redirect(new URL(`/error?eid=${eid}`, origin), 303);
    }

    // Remove the linked Clubs record(s) FIRST, then mark opted out. With this
    // ordering a deletion failure leaves the leader still "pending" so a retry
    // re-runs cleanly, rather than reporting success while clubs still exist.
    // deleteClub tolerates an already-deleted record, so retries are safe.
    const clubIds = getLinkedClubIds(record);
    for (const clubId of clubIds) {
      await deleteClub(clubId);
    }

    await updateIdvStatus(record.id, "opted_out");

    return NextResponse.redirect(new URL("/removed", origin), 303);
  } catch (err) {
    const eid = captureError("api/opt-out", err);
    return NextResponse.redirect(new URL(`/error?eid=${eid}`, origin), 303);
  }
}
