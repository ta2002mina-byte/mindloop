import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Everything past these prefixes is private, signed-in-only content.
      disallow: [
        "/dashboard",
        "/thoughts",
        "/patterns",
        "/predictions",
        "/worry-capsules",
        "/decisions",
        "/insights",
        "/settings",
        "/report",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
