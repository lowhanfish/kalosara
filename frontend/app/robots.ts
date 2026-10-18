import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/news-seo";
export const dynamic = "force-dynamic";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/masyarakat/", "/admin/", "/api/", "/pencarian"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
