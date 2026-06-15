import { notFound } from "next/navigation";
import Link from "next/link";
import { isValidSubmissionId } from "@/lib/validate";
import { isDev, DEV_SUBMISSION_ID } from "@/lib/dev";
import DevPanel from "@/components/DevPanel";

export const dynamic = "force-dynamic";

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  let id = (await searchParams).id;

  // Middleware already 400s invalid ids before we render; this is a defensive
  // backstop so the page never builds links from an untrusted value. In
  // development we fall back to a throwaway id instead of 404-ing.
  if (!isValidSubmissionId(id)) {
    if (isDev) {
      id = DEV_SUBMISSION_ID;
    } else {
      notFound();
    }
  }

  const authHref = `/auth/redirect?id=${encodeURIComponent(id)}`;
  const optOutHref = `/opt-out?id=${encodeURIComponent(id)}`;

  return (
    <main className="page">
      <div className="shell">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hero-emoji" src="/emojis/wave_hmn_y2.svg" alt="" aria-hidden="true" />
        <h1>Let&apos;s verify your identity!</h1>
        <p className="lede">
          We need to verify your identity before you can continue your
          club application. <strong>It should take around a minute.</strong>
        </p>

        <p className="learn-more">
          <Link href={`/why?id=${encodeURIComponent(id)}`}>
            Why do we need this?
          </Link>
        </p>

        <div className="option-list">
          <Link
            className="option option--primary"
            href={`/new-account?id=${encodeURIComponent(id)}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="option-emoji" src="/emojis/thinking.svg" alt="" aria-hidden="true" />
            <span className="option-text">
              <span className="option-title">I'm new to Hack Club!</span>
              <span className="option-desc">
                We'll help you make a Hack Club Auth account and verify!
              </span>
            </span>
          </Link>

          <Link className="option option--secondary" href={authHref}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="option-emoji" src="/emojis/smile.svg" alt="" aria-hidden="true" />
            <span className="option-text">
              <span className="option-title">
                I already have a Hack Club Auth account!
              </span>
              <span className="option-desc">
                Sign in using your account and we'll check if you're already verified.
              </span>
            </span>
          </Link>
        </div>

        <p className="opt-out-link">
          <Link href={optOutHref}>I&apos;d rather not do this...</Link>
        </p>

        {isDev && <DevPanel id={id} />}
      </div>
    </main>
  );
}
