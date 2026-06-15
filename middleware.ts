import { NextResponse, type NextRequest } from "next/server";

// Hard-reject malformed `id` params before any page renders. Route handlers
// (/auth/redirect, /auth/callback, /api/opt-out) additionally validate the id
// themselves; this layer guards the user-facing page routes that need it.
//
// Edge runtime: keep this to a plain regex (no node:crypto here).
const ID_PATTERN = /^[A-Za-z0-9-]{10,100}$/;

// Page routes that require a valid `id` query param.
const ID_REQUIRED_PATHS = new Set<string>(["/", "/opt-out"]);

export function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  if (ID_REQUIRED_PATHS.has(pathname)) {
    const id = searchParams.get("id");
    if (!id || !ID_PATTERN.test(id)) {
      // Let the request through to the page, which renders a friendly
      // "are you sure you're in the right place?" not-found page (and in
      // development falls back to a dev id). The page never builds links from
      // an untrusted value, so passing the bad id along is safe.
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  // Run only on the page routes we care about; skip static assets & _next.
  matcher: ["/", "/opt-out"],
};
