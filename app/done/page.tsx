import DoneRedirect from "./DoneRedirect";
import { sanitizeDisplayName } from "@/lib/validate";

export const dynamic = "force-dynamic";

export default function DonePage({
  searchParams,
}: {
  searchParams: { name?: string };
}) {
  const formUrl = process.env.CLUB_APPLICATION_FORM_URL || "/";
  const name = sanitizeDisplayName(searchParams.name);
  const heading = name ? `${name}, you're verified!` : "You're done!";

  return (
    <main className="page">
      <div className="shell">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hero-emoji" src="/emojis/starry_eyes.svg" alt="" aria-hidden="true" />
        <h1>{heading}</h1>
        <p className="lede">
          Your identity&apos;s been verified! You&apos;ll now be redirected back
          to your application.
        </p>
        <p className="fallback">
          If that doesn&apos;t work, <a href={formUrl}>click here.</a>
        </p>
      </div>
      <DoneRedirect formUrl={formUrl} />
    </main>
  );
}
