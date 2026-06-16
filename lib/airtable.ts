// Minimal Airtable REST client. No SDK. All calls run server-side only and use
// the AIRTABLE_API_KEY bearer token, which never reaches the client.

const BASE_ID = "appUfrUFraxH3D5Ob";
const LEADERS_TABLE = "Leaders";
const CLUBS_TABLE = "Clubs";
const IDV_RESULTS_TABLE = "idv_results";
const LINK_FIELD = "rel_leader_to_clubs";

const API_ROOT = "https://api.airtable.com/v0";

export type IdvStatus = "pending" | "verified" | "opted_out";

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
}

// Demo mode: when no API key is configured, every Airtable operation becomes a
// logged no-op so the verify / opt-out flows still complete end-to-end without
// a real base. Remove this behaviour by setting AIRTABLE_API_KEY.
function isDemoMode(): boolean {
  return !process.env.AIRTABLE_API_KEY;
}

function warnDemo(action: string, detail: string): void {
  console.warn(
    `[airtable] DEMO MODE (no AIRTABLE_API_KEY) — skipping ${action}: ${detail}. Nothing is being persisted.`,
  );
}

function authHeaders(extra?: Record<string, string>): HeadersInit {
  const key = process.env.AIRTABLE_API_KEY;
  if (!key) throw new Error("AIRTABLE_API_KEY is not configured");
  return { Authorization: `Bearer ${key}`, ...extra };
}

function encodePath(table: string, recordId?: string): string {
  const segments = [API_ROOT, BASE_ID, encodeURIComponent(table)];
  if (recordId) segments.push(encodeURIComponent(recordId));
  return segments.join("/");
}

/**
 * Finds the single Leaders record whose {submission_id} matches the given id.
 * Returns null if no record matches. Caller must have already validated the id
 * against the strict allowlist (so it is safe inside the formula string).
 */
export async function findLeaderBySubmissionId(
  submissionId: string,
): Promise<AirtableRecord | null> {
  if (isDemoMode()) {
    warnDemo("Leaders lookup", `submission_id=${submissionId}`);
    // Synthetic record so the flow proceeds past the "no record" guard.
    return { id: `demo-${submissionId}`, fields: {} };
  }

  const formula = `{submission_id} = "${submissionId}"`;
  const url = new URL(encodePath(LEADERS_TABLE));
  url.searchParams.set("filterByFormula", formula);
  url.searchParams.set("maxRecords", "1");

  const res = await fetch(url, { headers: authHeaders(), cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Airtable lookup failed (${res.status})`);
  }
  const data = (await res.json()) as { records?: AirtableRecord[] };
  return data.records?.[0] ?? null;
}

/** Updates the idv_status single-select field on a Leaders record. */
export async function updateIdvStatus(
  recordId: string,
  status: IdvStatus,
): Promise<void> {
  if (isDemoMode()) {
    warnDemo("idv_status update", `${recordId} -> ${status}`);
    return;
  }

  const res = await fetch(encodePath(LEADERS_TABLE, recordId), {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ fields: { idv_status: status } }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Airtable status update failed (${res.status})`);
  }
}

/**
 * Upserts an idv_results row keyed on {submission_id}: updates the matching
 * record's idv_status if one exists, otherwise creates a new record. Uses
 * Airtable's native performUpsert so the find/update/create is atomic.
 * Caller must have already validated submissionId against the strict allowlist.
 */
export async function upsertIdvResult(
  submissionId: string,
  status: IdvStatus,
  email?: string,
): Promise<void> {
  if (isDemoMode()) {
    warnDemo(
      "idv_results upsert",
      `submission_id=${submissionId} -> ${status}${email ? ` (email=${email})` : ""}`,
    );
    return;
  }

  const fields: Record<string, unknown> = {
    submission_id: submissionId,
    idv_status: status,
  };
  if (email) fields.email = email;

  const res = await fetch(encodePath(IDV_RESULTS_TABLE), {
    method: "PATCH",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({
      performUpsert: { fieldsToMergeOn: ["submission_id"] },
      records: [{ fields }],
    }),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Airtable idv_results upsert failed (${res.status})`);
  }
}

/** Returns the linked Clubs record IDs from a Leaders record, if any. */
export function getLinkedClubIds(record: AirtableRecord): string[] {
  const linked = record.fields[LINK_FIELD];
  if (!Array.isArray(linked)) return [];
  return linked.filter((v): v is string => typeof v === "string");
}

/**
 * Deletes a Clubs record by id. A 404 (record already gone) is treated as
 * success so the opt-out flow can be safely retried after a partial failure.
 */
export async function deleteClub(clubRecordId: string): Promise<void> {
  if (isDemoMode()) {
    warnDemo("Clubs deletion", clubRecordId);
    return;
  }

  const res = await fetch(encodePath(CLUBS_TABLE, clubRecordId), {
    method: "DELETE",
    headers: authHeaders(),
    cache: "no-store",
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`Airtable club deletion failed (${res.status})`);
  }
}
