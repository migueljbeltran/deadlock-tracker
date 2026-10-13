import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PlayerSearchBar } from "@/components/search/PlayerSearchBar";
import { PlayerProfileShell } from "@/components/player/PlayerProfileShell";
import { getHeroes, getRanks } from "@/lib/api";

// One shared CDN page for every player. Only the JSON API runs on cache misses.
export const revalidate = 604800;
export const metadata: Metadata = {
  title: "Deadlock Player Stats & Match History",
  description: "Review a Deadlock player's hero performance, recent matches, and estimated rank.",
  robots: { index: false, follow: false },
};

export default async function PlayerPageShell() {
  const [heroes, ranks] = await Promise.all([getHeroes(), getRanks()]);
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="relative flex-1 atmosphere-soul">
        <div className="relative z-20 mx-auto max-w-3xl px-4 pt-6 sm:px-6 lg:px-8"><PlayerSearchBar /></div>
        <PlayerProfileShell heroes={heroes.map((hero) => ({
          id: hero.id, class_name: hero.class_name, name: hero.name,
          description: {},
          images: {
            icon_image_small_webp: hero.images?.icon_image_small_webp,
            icon_hero_card_webp: hero.images?.icon_hero_card_webp,
          },
        }))} ranks={ranks} />
      </main>
      <Footer />
    </div>
  );
}
