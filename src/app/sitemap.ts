import type { MetadataRoute } from "next";
import { MONTHS, siteUrl } from "@/lib/seo";
import { LIBRARY } from "@/plants";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: siteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: siteUrl("/plants"), lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: siteUrl("/gardening-tips"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    ...MONTHS.map((m) => ({ url: siteUrl(`/gardening-tips/${m}`), lastModified: now, changeFrequency: "monthly" as const, priority: 0.8 })),
    ...LIBRARY.map((g) => ({ url: siteUrl(`/plants/${g.key}`), lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 })),
  ];
}
