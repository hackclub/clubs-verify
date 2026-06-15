import { NextResponse, type NextRequest } from "next/server";
import { isValidSubmissionId } from "@/lib/validate";
import {
  findLeaderBySubmissionId,
  updateIdvStatus,
  getLinkedClubIds,
  deleteClub,
} from "@/lib/airtable";
import { limitOptOut } from "@/lib/rateLimit";
import { newErrorId, logError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const origin = req.nextUrl.origin;

  if (!(await limitOptOut(req))) {
    return new NextResponse("Too Many Requests", { status: 429 });
  }

  // The confirmation form posts the id as form data.
  const form = await req.formData().catch(() => null);
  const id = form?.get("id");

  if (!isValidSubmissionId(id)) {
    return new NextResponse("Bad Request: invalid id", { status: 400 });
  }

  try {
    const record = await findLeaderBySubmissionId(id);
    if (!record) {
      const eid = newErrorId();
      logError(eid, "api/opt-out", new Error("no Leaders record for submissionId"));
      return NextResponse.redirect(new URL(`/error?eid=${eid}`, origin), 303);
    }

    // Mark opted out, then remove the linked Clubs record(s).
    await updateIdvStatus(record.id, "opted_out");

    const clubIds = getLinkedClubIds(record);
    for (const clubId of clubIds) {
      await deleteClub(clubId);
    }

    return NextResponse.redirect(new URL("/removed", origin), 303);
  } catch (err) {
    const eid = newErrorId();
    logError(eid, "api/opt-out", err);
    return NextResponse.redirect(new URL(`/error?eid=${eid}`, origin), 303);
  }
}
