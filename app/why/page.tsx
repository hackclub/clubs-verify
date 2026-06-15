import { notFound } from "next/navigation";
import Link from "next/link";
import { isValidSubmissionId } from "@/lib/validate";
import { isDev, DEV_SUBMISSION_ID } from "@/lib/dev";

export const dynamic = "force-dynamic";

export default async function WhyPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  let id = (await searchParams).id;

  // We want a valid id so the "back" button can return to the right place. In
  // dev we fall back to a throwaway id; in prod a bad id 404s.
  if (!isValidSubmissionId(id)) {
    if (isDev) {
      id = DEV_SUBMISSION_ID;
    } else {
      notFound();
    }
  }

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
        <h1>Why do we verify your identity?</h1>
        <p className="lede">
          Quick rundown on what verification is for, and what we do (and
          don&apos;t) do with your info.
        </p>

        <div className="prose">
          <p>
            <strong>Hey there, I'm Lynn!</strong> I'm the person who made this verification flow for new Leaders applying.
            When I joined Hack Club, I also was kind of wondering "why do they need my ID???". So let me explain!
          </p>
          <p>
            Hack Club is a global community of high schoolers building things together and running clubs. 
            We put a lot of real resources behind Clubs, like funding and a ton of trust.
          </p>
          <p>
            <strong>Verifying yout identity keeps that safe.</strong> It helps us make sure that Clubs are started by real students, and not people trying to defraud us.
          </p>
          <p>
            It also helps us <strong>keep the community safe.</strong> Knowing the people leading clubs are who they say they are helps us look out for everyone.
          </p>
          <p>
            Hack Club was started by privacy nerds - it's personal and non-negotiable for us. <strong>We do not (and never will) sell your personal data.</strong>
          </p>
          <p>
            If you have more questions in regards to how identity verification works, reach out to identity@hackclub.com.
          </p>
        </div>

        <div style={{ marginTop: 32 }}>
          <Link className="btn btn-secondary" href={backHref}>
            Back to verification
          </Link>
        </div>
      </div>
    </main>
  );
}
