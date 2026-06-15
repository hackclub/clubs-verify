import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page">
      <div className="shell">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hero-emoji" src="/emojis/unsure.svg" alt="" aria-hidden="true" />
        <h1>Are you sure you&apos;re in the right place?</h1>
        <p className="lede">
          This link is missing the details we need to verify your identity. Double
          check that you opened the full link from your club application.
        </p>
        <p className="learn-more">
          <Link href="https://apply.hackclub.com">Back to Apply</Link>
        </p>
      </div>
    </main>
  );
}
