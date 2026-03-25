import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/api/", "/leaderboard", "/player/"],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/api/", "/leaderboard", "/player/"],
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/leaderboard", "/player/"],
        crawlDelay: 10,
      },
    ],
    sitemap: "https://dltracker.app/sitemap.xml",
  };
}
