import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  htmlLimitedBots: /.*/,
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${process.env.API_INTERNAL_URL ?? "http://localhost:4000"}/api/v1/:path*`,
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
