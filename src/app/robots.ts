import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Signed-in and transactional pages have no public value.
      disallow: ["/dashboard", "/garden$", "/garden/", "/calendar", "/settings", "/onboarding", "/auth", "/unsubscribe", "/api"],
    },
    sitemap: siteUrl("/sitemap.xml"),
    host: siteUrl(),
  };
}
