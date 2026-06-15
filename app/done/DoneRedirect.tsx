"use client";

import { useEffect } from "react";

/**
 * Redirects to the club application form after a short delay. The URL is
 * resolved server-side and passed in as a prop (it is a public form URL, not a
 * secret).
 */
export default function DoneRedirect({ formUrl }: { formUrl: string }) {
  useEffect(() => {
    const t = setTimeout(() => {
      window.location.assign(formUrl);
    }, 3000);
    return () => clearTimeout(t);
  }, [formUrl]);

  return null;
}
