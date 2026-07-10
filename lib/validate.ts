// Submission IDs come from Fillout and are echoed back to us as a query param.
// We treat them as untrusted input and apply a strict allowlist before they are
// ever used in a redirect, an Airtable formula, or a signed state payload.

const ID_PATTERN = /^[A-Za-z0-9-]{10,100}$/;

// Slack IDs are short uppercase-alphanumeric strings (e.g. "U01ABC23DEF").
// Allowlisted before being written to Airtable, so a malformed / unexpected
// claim value never lands in the slack_id field.
const SLACK_ID_PATTERN = /^[A-Z0-9]{6,32}$/;

/**
 * Returns the Slack ID when it matches the strict allowlist, otherwise
 * undefined. Used to guard the value before it is persisted to Airtable.
 */
export function sanitizeSlackId(input: unknown): string | undefined {
  return typeof input === "string" && SLACK_ID_PATTERN.test(input)
    ? input
    : undefined;
}

/**
 * Returns true only when `id` is a string of 10-100 chars consisting solely of
 * ASCII alphanumerics and hyphens. Everything else is rejected.
 */
export function isValidSubmissionId(id: unknown): id is string {
  return typeof id === "string" && ID_PATTERN.test(id);
}

/**
 * Tidies a first name for display (it arrives via a query param, so treat it as
 * untrusted). Strips angle brackets and control whitespace and caps the length.
 * React escapes on render too; this is for clean presentation. Returns
 * undefined when there's nothing usable to show.
 */
export function sanitizeDisplayName(input: unknown): string | undefined {
  if (typeof input !== "string") return undefined;
  const cleaned = input
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 40);
  return cleaned || undefined;
}
