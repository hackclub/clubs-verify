import { notFound } from "next/navigation";
import Link from "next/link";
import { isValidSubmissionId } from "@/lib/validate";
import { isDev, DEV_SUBMISSION_ID } from "@/lib/dev";

export const dynamic = "force-dynamic";

export default async function NewAccountPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  let id = (await searchParams).id;

  // Keep a valid id so the user can return to verification after signing up.
  if (!isValidSubmissionId(id)) {
    if (isDev) {
      id = DEV_SUBMISSION_ID;
    } else {
      notFound();
    }
  }

  const authHref = `/auth/redirect?id=${encodeURIComponent(id)}&signup=1`;
  const backHref = `/?id=${encodeURIComponent(id)}`;

  return (
    <main className="page">
      <div className="shell">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="hero-emoji"
          src="/emojis/thinking.svg"
          alt=""
          aria-hidden="true"
        />
        <h1>New to Hack Club? Let&apos;s fix that!</h1>
        <p className="lede">
          You&apos;ll need a Hack Club Auth account before we can verify you. The
          good news: it only takes a minute.
        </p>

        <div className="prose">
          <p>
            Hack Club Auth is the single login you&apos;ll use across everything
            Hack Club. Creating one is quick and free.
          </p>
          <p>
            <strong>Here&apos;s the plan:</strong> hit the button below to sign in with
            Hack Club Auth. If you&apos;re not verified yet, we&apos;ll take you
            straight to verification so you can finish your club application.
          </p>
        </div>

        <div className="option-list" style={{ marginTop: 28 }}>
          <Link className="btn btn-primary" href={authHref}>
            Let&apos;s go!
          </Link>
        </div>

        <p className="opt-out-link">
          <Link href={backHref}>Go back</Link>
        </p>
      </div>
    </main>
  );
}
