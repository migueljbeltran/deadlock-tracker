import type { MetadataRoute } from "next";
import { getHeroes } from "@/lib/api";

export const revalidate = 604800; // Regenerate sitemap once per week

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://dltracker.app";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/heroes`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/heroes/tier-list`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/items`, lastModified: new Date(), changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/leaderboard`, lastModified: new Date(), changeFrequency: "hourly", priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.2 },
  ];

  // Dynamic hero pages
  let heroPages: MetadataRoute.Sitemap = [];
  try {
    const heroes = await getHeroes();
    heroPages = heroes
      .filter((h) => h.player_selectable !== false && !h.disabled && !h.in_development)
      .map((h) => ({
        url: `${baseUrl}/heroes/${h.id}`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.7,
      }));
  } catch {
    // If hero fetch fails, return static pages only
  }

  return [...staticPages, ...heroPages];
}
