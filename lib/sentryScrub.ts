// Strips sensitive data out of Sentry events before they leave the process.
// The auth flow puts secrets in URLs — the OAuth `code` and the HMAC-signed
// `state` token on /auth/callback, and the submission `id` / `name` on /done
// and /error — and those would otherwise ride along in the request URL,
// query string, and navigation breadcrumbs of every captured event or sampled
// transaction. We drop the query string entirely (none of our routes need it
// in Sentry), plus cookie / authorization headers.
//
// Pure string operations only, so this is safe to run in the Edge runtime.

type ScrubbableEvent = {
  request?: {
    url?: string;
    query_string?: unknown;
    headers?: { [key: string]: unknown };
  };
  breadcrumbs?: Array<{ data?: { [key: string]: unknown } } | undefined>;
};

function stripQuery(url: string): string {
  const q = url.indexOf("?");
  return q === -1 ? url : url.slice(0, q);
}

export function scrubSentryEvent<T extends ScrubbableEvent>(event: T): T {
  const req = event.request;
  if (req) {
    if (typeof req.url === "string") req.url = stripQuery(req.url);
    if ("query_string" in req) delete req.query_string;
    const headers = req.headers;
    if (headers) {
      for (const key of Object.keys(headers)) {
        const lower = key.toLowerCase();
        if (lower === "cookie" || lower === "authorization") delete headers[key];
      }
    }
  }

  if (Array.isArray(event.breadcrumbs)) {
    for (const crumb of event.breadcrumbs) {
      const data = crumb?.data;
      if (!data) continue;
      for (const field of ["url", "to", "from"]) {
        const value = data[field];
        if (typeof value === "string") data[field] = stripQuery(value);
      }
    }
  }

  return event;
}
