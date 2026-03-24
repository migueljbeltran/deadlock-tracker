import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: "/api/",
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: "/api/",
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/player/*/page=*"],
        crawlDelay: 10,
      },
    ],
    sitemap: "https://dltracker.app/sitemap.xml",
  };
}
