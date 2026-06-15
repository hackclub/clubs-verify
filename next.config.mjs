/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Allows verification/CI builds to target an isolated dist dir
  // (e.g. NEXT_DIST_DIR=.next-verify) so they never clobber the `.next`
  // a running `next dev` is actively serving from. Defaults to `.next`.
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
