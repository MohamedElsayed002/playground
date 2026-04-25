import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const analyzeEnabled = process.env.ANALYZE === "true" || process.env.ANALYZE === "1";

if (analyzeEnabled) {
  console.log(
    "[bundle-analyzer] Enabled: after the build, open analyze/client.html in your browser (from this app directory).",
  );
}

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: analyzeEnabled,
  /** Static HTML is written under analyze/; avoids relying on the OS opening a browser. */
  openAnalyzer: false,
});

const nextConfig: NextConfig = {
  output: "standalone",
  // Cause an error in different files
  // cacheComponents: true,
  logging: {
    fetches: {
      fullUrl: true,
    },
    incomingRequests: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "playground-images-914561792613.s3.amazonaws.com",
        port: "",
      },
    ],
  },
};

const sentryWrapped = withSentryConfig(nextConfig, {
  org: "unemployed-7m",
  project: "playground-nextjs",

  silent: !process.env.CI,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",

  automaticVercelMonitors: true,
  disableLogger: true,
});

export default withBundleAnalyzer(sentryWrapped);
