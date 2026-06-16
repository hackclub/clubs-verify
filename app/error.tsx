"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect, useState } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [errorId, setErrorId] = useState<string>("unknown");

  useEffect(() => {
    const eventId = Sentry.captureException(error);
    if (eventId) setErrorId(eventId);
  }, [error]);

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
        <button className="btn btn-primary" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </main>
  );
}
