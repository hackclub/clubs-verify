import { notFound } from "next/navigation";
import Link from "next/link";
import { isValidSubmissionId } from "@/lib/validate";
import { isDev, DEV_SUBMISSION_ID } from "@/lib/dev";

export const dynamic = "force-dynamic";

const SIGNUP_URL =
  "https://auth.hackclub.com/welcome?return_to=https%3A%2F%2Fauth.hackclub.com%2Fverifications%2Fnew";

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

  const authHref = `/auth/redirect?id=${encodeURIComponent(id)}`;
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
            <strong>Here&apos;s the plan:</strong> make your account, verify your identity, then come
            right back here and choose{" "}
            <em>&ldquo;I already have a Hack Club Auth account&rdquo;</em> to
            finish your club application.
          </p>
        </div>

        <div className="option-list" style={{ marginTop: 28 }}>
          <a
            className="btn btn-primary"
            href={SIGNUP_URL}
            target="_blank"
            rel="noreferrer"
          >
            Create an account
          </a>
          <Link className="btn btn-secondary" href={authHref}>
            I&apos;ve made one, verify me
          </Link>
        </div>

        <p className="opt-out-link">
          <Link href={backHref}>Go back</Link>
        </p>
      </div>
    </main>
  );
}
