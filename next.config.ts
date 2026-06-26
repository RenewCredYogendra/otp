import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a standalone output bundle — required for Railway / Docker deploys.
  output: "standalone",

  // Fail the build on TypeScript errors.
  typescript: { ignoreBuildErrors: false },

  // Disable the "X-Powered-By: Next.js" header.
  poweredByHeader: false,

  // Security headers applied to every route.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options",        value: "DENY" },
          { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy",     value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
