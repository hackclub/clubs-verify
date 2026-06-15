import Link from "next/link";
import { isValidSubmissionId, sanitizeDisplayName } from "@/lib/validate";

export const dynamic = "force-dynamic";

export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; eid?: string; id?: string; name?: string }>;
}) {
  const { reason, eid, id, name: rawName } = await searchParams;

  // ---- Not-verified variant ------------------------------------------------
  if (reason === "not_verified") {
    // "Try again" restarts the flow at the landing page when we still have a
    // valid submission id; otherwise it falls back to a plain retry.
    const tryAgainHref = isValidSubmissionId(id)
      ? `/?id=${encodeURIComponent(id)}`
      : "/";

    const name = sanitizeDisplayName(rawName);
    const heading = name
      ? `${name}, you're not verified yet...`
      : "You're not verified yet...";

    return (
      <main className="page">
        <div className="shell">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="hero-emoji" src="/emojis/unsure.svg" alt="" aria-hidden="true" />
          <h1>{heading}</h1>
          <p className="lede">
            Looks like you haven&apos;t verified your ID yet. When you finish,
            come back here and we&apos;ll take care of the rest.
          </p>
          <Link className="btn btn-primary" href={tryAgainHref}>
            Try again
          </Link>
        </div>
      </main>
    );
  }

  // ---- Generic error variant ----------------------------------------------
  const errorId = typeof eid === "string" ? eid : "unknown";

  return (
    <main className="page">
      <div className="shell">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hero-emoji" src="/emojis/dead.svg" alt="" aria-hidden="true" />
        <h1>An error has occurred :(</h1>
        <p className="lede">
          We ran into an unexpected issue. Try again in a bit, or reach out to
          us at{" "}
          <span className="support">
            <a href="mailto:clubs@hackclub.com">clubs@hackclub.com</a>
          </span>
          . When contacting us, share this ID:
        </p>
        <p className="error-id">
          <code>{errorId}</code>
        </p>
      </div>
    </main>
  );
}
