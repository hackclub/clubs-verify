export const dynamic = "force-dynamic";

// Shown after a leader opts out. Unlike /done, there is no auto-redirect back
// to the application form — their application has been deleted.
export default function RemovedPage() {
  return (
    <main className="page">
      <div className="shell">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="hero-emoji" src="/emojis/wave_hmn_y2.svg" alt="" aria-hidden="true" />
        <h1>Your application&apos;s been removed.</h1>
        <p className="lede">
          You&apos;ve opted out of identity verification, so we&apos;ve deleted
          your club application. If you change your mind, you&apos;re always
          welcome to apply again.
        </p>
        <p className="fallback">
          Questions? Reach out at{" "}
          <span className="support">
            <a href="mailto:clubs@hackclub.com">clubs@hackclub.com</a>
          </span>
          .
        </p>
      </div>
    </main>
  );
}
