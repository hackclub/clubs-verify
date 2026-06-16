import { notFound } from "next/navigation";
import Link from "next/link";
import { isValidSubmissionId } from "@/lib/validate";
import { isDev, DEV_SUBMISSION_ID } from "@/lib/dev";
import { createOptOutToken } from "@/lib/optOutToken";

export const dynamic = "force-dynamic";

export default async function OptOutPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  let id = (await searchParams).id;

  if (!isValidSubmissionId(id)) {
    if (isDev) {
      id = DEV_SUBMISSION_ID;
    } else {
      notFound();
    }
  }

  const backHref = `/?id=${encodeURIComponent(id)}`;
  // Bind a fresh signed token to this id; the POST handler requires it.
  const optOutToken = createOptOutToken(id);

  return (
    <main className="page">
      <div className="shell">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hero-emoji" src="/emojis/scared.svg" alt="" aria-hidden="true" />
        <h1>Are you sure?</h1>
        <p className="lede">
          Opting out will remove your application. You won&apos;t be able to
          continue without verifying your identity!
        </p>

        <div className="option-list">
          <Link className="option option--secondary" href={backHref}>
            <span className="option-text">
              <span className="option-title">Actually, let&apos;s go back</span>
              <span className="option-desc">
                Take me back to the verification options.
              </span>
            </span>
          </Link>

          {/* Posts to the server handler, which removes the application. */}
          <form action="/api/opt-out" method="post">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="token" value={optOutToken} />
            <button className="option option--danger" type="submit">
              <span className="option-text">
                <span className="option-title">
                  Yes, remove my application.
                </span>
                <span className="option-desc">
                  This permanently deletes your club application.
                </span>
              </span>
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
