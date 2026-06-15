"use client";

import { useState } from "react";
import Link from "next/link";

// Development-only testing shortcuts, collapsed into a native <details>
// dropdown. Rendered solely when isDev is true (see lib/dev.ts), so it is never
// present in a production build. Each link jumps straight to an end-state
// screen so every page can be previewed without real OIDC or Airtable creds.
//
// Double-click the panel to hide it for the rest of the session (state only —
// a page refresh brings it back).
export default function DevPanel({ id }: { id: string }) {
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  const q = encodeURIComponent(id);

  const links: { label: string; href: string }[] = [
    { label: "Verified → /done", href: "/done?name=Lynn" },
    {
      label: "Not verified → /error",
      href: `/error?reason=not_verified&id=${q}&name=Lynn`,
    },
    { label: "Opted out → /removed", href: "/removed" },
    { label: "Generic error → /error", href: "/error?eid=dev-test" },
    { label: "Opt-out confirm page", href: `/opt-out?id=${q}` },
  ];

  return (
    <details className="dev-box" onDoubleClick={() => setHidden(true)}>
      <summary className="dev-summary">
        development, go nuts :3
        <span className="dev-hint">double-click to hide</span>
      </summary>
      <div className="dev-actions">
        {links.map((l) => (
          <Link key={l.href} className="dev-btn" href={l.href}>
            {l.label}
          </Link>
        ))}
      </div>
    </details>
  );
}
