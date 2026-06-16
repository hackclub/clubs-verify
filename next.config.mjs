import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Allows verification/CI builds to target an isolated dist dir
  // (e.g. NEXT_DIST_DIR=.next-verify) so they never clobber the `.next`
  // a running `next dev` is actively serving from. Defaults to `.next`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  silent: !process.env.CI,
});
