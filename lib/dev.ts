// Helpers for local development. `next dev` sets NODE_ENV=development, while
// `next build` / `next start` (and Vercel) set it to "production". These
// affordances are compiled out of meaningful use in production: isDev is false,
// so the dev panel never renders and the id/env fallbacks never apply.

export const isDev = process.env.NODE_ENV !== "production";

// A throwaway, regex-valid submission id used when none is supplied locally so
// you can hit "/" with no query string and still poke at the UI.
export const DEV_SUBMISSION_ID = "dev-submission-0001";
