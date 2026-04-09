import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Disallow long-tail dynamic routes from crawlers. Player and match
        // pages are already `robots: noindex` in metadata, but many bots
        // (Bingbot, Ahrefs, GPTBot, etc.) honor robots.txt but not per-page
        // meta. Every crawl of a unique account/match URL would cost a
        // function invocation and a Redis/upstream fetch. Not worth it when
        // these pages provide no SEO value (noindex anyway).
        disallow: ["/api/", "/player/", "/match/"],
      },
    ],
    sitemap: "https://dltracker.app/sitemap.xml",
  };
}
