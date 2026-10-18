import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  cacheMaxMemorySize: 16 * 1024 * 1024,
  experimental: {
    proxyClientMaxBodySize: "21mb",
    imgOptConcurrency: 1,
    imgOptMaxInputPixels: 25_000_000,
    imgOptTimeoutInSeconds: 10,
  },
  images: {
    remotePatterns: [],
    // Never let the optimizer fetch authenticated API/private media.
    localPatterns: [{ pathname: "/images/**", search: "" }],
    deviceSizes: [360, 768, 1200, 1920],
    imageSizes: [32, 64, 128, 256],
    qualities: [75],
    formats: ["image/webp"],
    maximumRedirects: 0,
    maximumResponseBody: 20 * 1024 * 1024,
    maximumDiskCacheSize: 128 * 1024 * 1024,
    dangerouslyAllowSVG: false,
    dangerouslyAllowLocalIP: false,
  },
  async headers() {
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      // Static/ISR pages need Next hydration inline scripts. No eval in production.
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      `connect-src 'self'${process.env.NODE_ENV === "development" ? " ws: wss:" : ""}`,
      "frame-src https://www.openstreetmap.org",
      "media-src 'none'",
    ].join("; ");
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          ...(process.env.SITE_ORIGIN?.startsWith("https:")
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]
            : []),
        ],
      },
    ];
  },
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
