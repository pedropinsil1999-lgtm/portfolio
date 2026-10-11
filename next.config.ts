import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Tailwind is compiled through PostCSS (postcss.config.mjs), as the Next.js
  // docs recommend. The previous @tailwindcss/turbopack loader rule served
  // stale CSS in dev: edits to globals.css never reached the browser.
};

export default nextConfig;
