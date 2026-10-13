import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Crosshair, Layers3, Trophy, TrendingUp } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSearchSection } from "@/components/search/HeroSearchSection";
import { DataFreshness } from "@/components/ui/DataFreshness";
import { getHeroes, getHeroAnalyticsSnapshot } from "@/lib/api";
import { aggregateHeroAnalytics } from "@/lib/utils/heroAnalytics";
import { formatNumber } from "@/lib/utils/format";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: { absolute: "dltracker — Deadlock Stats, Hero Win Rates & Match History" },
  description: "Find your Deadlock player profile, review recent matches, compare hero win rates, and explore regional leaderboards. Free, with no sign-up required.",
  alternates: { canonical: "/" },
};

const tools = [
  { href: "/heroes", icon: Crosshair, number: "01", title: "Find your next main", description: "Compare hero win rates and pick rates across time ranges and rank brackets.", label: "Explore heroes" },
  { href: "/items", icon: Layers3, number: "02", title: "Make every soul count", description: "Compare item results by category, tier, and rank. See the sample behind each stat.", label: "Browse items" },
  { href: "/leaderboard", icon: Trophy, number: "03", title: "Follow the climb", description: "Explore the ranked players in all five regions and their most-played heroes.", label: "View leaderboard" },
];

export default async function Home() {
  const [heroes, analytics] = await Promise.all([
    getHeroes().catch(() => []),
    getHeroAnalyticsSnapshot("month").catch(() => null),
  ]);
  const playable = heroes.filter((hero) => hero.player_selectable !== false && !hero.disabled && !hero.in_development);
  const { analyticsMap } = aggregateHeroAnalytics(analytics?.data ?? [], null);
  const leaders = playable.map((hero) => {
    const stats = analyticsMap.get(hero.id);
    return { hero, matches: stats?.matches ?? 0, winRate: stats?.matches ? stats.wins / stats.matches * 100 : 0 };
  }).filter((hero) => hero.matches >= 1000)
    .sort((a, b) => b.winRate - a.winRate || b.matches - a.matches).slice(0, 5);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="relative flex-1">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[650px] bg-[radial-gradient(ellipse_at_20%_20%,rgba(61,220,132,0.07),transparent_60%)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <section className="grid gap-10 pt-12 pb-12 sm:pt-16 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:pt-20 lg:pb-16">
            <div>
              <p className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-amber"><span className="h-px w-8 bg-amber" /> The Cursed Apple, by the numbers</p>
              <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight text-text-primary sm:text-6xl lg:text-7xl">Know your game.<br /><span className="font-heading text-amber-light">Own your climb.</span></h1>
              <p className="mt-6 max-w-lg text-base leading-7 text-text-secondary">Your matches, your heroes, your next advantage. A clearer view of Deadlock, built for the people who play it.</p>
              <div id="search" className="mt-8 scroll-mt-24"><HeroSearchSection /></div>
              <p className="mt-4 text-xs text-text-secondary">Free to use <span className="mx-2 text-amber" aria-hidden="true">·</span> No sign-up <span className="mx-2 text-amber" aria-hidden="true">·</span> Powered by the community</p>
            </div>
            <div className="self-center rounded-2xl border border-border-subtle bg-deep shadow-[var(--shadow-depth-md)]">
              <div className="border-b border-border-subtle px-5 py-5 sm:px-6">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-text-primary"><TrendingUp className="h-5 w-5 text-soul" /> Meta watch</h2>
                  <span className="rounded-md border border-border-subtle px-2 py-1 text-[11px] text-text-secondary">Past month</span>
                </div>
                <p className="mt-2 text-xs text-text-secondary">Highest win rates · All ranks · 1,000+ hero appearances</p>
              </div>
              {leaders.length > 0 ? (
                <ol className="divide-y divide-border-subtle/60">
                  {leaders.map(({ hero, winRate, matches }, index) => (
                    <li key={hero.id}>
                      <Link prefetch={false} href={`/heroes/${hero.id}`} className="group flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-surface sm:px-6">
                        <span className="w-4 font-mono text-xs text-text-secondary">{index + 1}</span>
                        {hero.images?.icon_image_small_webp || hero.images?.icon_hero_card_webp ? <Image src={(hero.images.icon_image_small_webp || hero.images.icon_hero_card_webp)!} alt="" width={44} height={44} className="h-11 w-11 rounded-lg bg-surface object-cover" /> : <Crosshair className="h-11 w-11 rounded-lg bg-surface p-3 text-amber" />}
                        <div className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-text-primary group-hover:text-soul">{hero.name}</span><span className="text-xs text-text-secondary">{formatNumber(matches)} appearances</span></div>
                        <div className="text-right"><span className={`block font-mono text-base tabular-nums ${winRate >= 50 ? "text-soul" : "text-blood"}`}>{winRate.toFixed(1)}%</span><span className="text-[10px] uppercase tracking-wider text-text-secondary">Win rate</span></div>
                        <ArrowRight className="ml-1 h-4 w-4 text-text-secondary group-hover:text-soul" />
                      </Link>
                    </li>
                  ))}
                </ol>
              ) : <div className="px-6 py-12 text-sm leading-6 text-text-secondary">Hero statistics are temporarily unavailable. You can still search players or explore the hero roster.</div>}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border-subtle px-5 py-4 sm:px-6">
                {analytics && leaders.length > 0 ? <DataFreshness fetchedAt={analytics.fetchedAt} /> : <span className="text-xs text-text-secondary">Community match data</span>}
                <Link prefetch={false} href="/heroes/tier-list" className="flex items-center gap-1 text-xs font-medium text-amber hover:text-amber-light">Full tier list <ArrowRight className="h-3.5 w-3.5" /></Link>
              </div>
            </div>
          </section>
          <section aria-label="Deadlock tools" className="grid gap-4 md:grid-cols-3">
            {tools.map(({ href, icon: Icon, number, title, description, label }) => (
              <Link prefetch={false} key={href} href={href} className="group flex flex-col rounded-xl border border-border-subtle bg-deep p-6 transition-colors hover:border-amber/50 hover:bg-surface">
                <div className="mb-6 flex items-center justify-between"><Icon className="h-6 w-6 text-amber" /><span className="font-mono text-xs text-text-secondary">{number}</span></div>
                <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
                <p className="mt-2 flex-1 text-sm leading-6 text-text-secondary">{description}</p>
                <span className="mt-6 flex items-center gap-2 text-sm font-medium text-soul">{label}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
              </Link>
            ))}
          </section>
          <section className="mt-10 flex flex-col justify-between gap-6 border-t border-border-subtle pt-8 sm:flex-row sm:items-center">
            <div><h2 className="text-sm font-semibold text-text-primary">A community project. An open book.</h2><p className="mt-2 max-w-2xl text-xs leading-6 text-text-secondary">Stats reflect matches available to the Deadlock API, rather than every game played. Cached results can lag behind new matches and patches; check update times before comparing.</p></div>
            <Link prefetch={false} href="/about" className="shrink-0 text-sm text-amber hover:text-amber-light">About the data <span aria-hidden="true">↗</span></Link>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
