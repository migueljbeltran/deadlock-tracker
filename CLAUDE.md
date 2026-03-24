# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Project:** dltracker - A Deadlock stats tracker with an "Occult Noir" design aesthetic.

## Commands

- `npm run dev` - Start development server (<http://localhost:3000>)
- `npm run build` - Production build
- `npm run lint` - Run ESLint
- `npx prisma generate` - Generate Prisma client after schema changes
- `npx prisma db push` - Push schema to database (development)
- `npx prisma migrate dev` - Create migration (production-ready)

## Tech Stack

- **Framework:** Next.js 16 with App Router
- **Language:** TypeScript (strict mode)
- **UI:** React 19
- **Styling:** Tailwind CSS 4 (CSS-first config via `@theme inline`)
- **Database:** PostgreSQL via Prisma 6 (Supabase)
- **Cache/Rate Limiting:** Upstash Redis
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Validation:** Zod
- **Logging:** Pino (structured JSON in prod, pretty in dev)
- **Error Monitoring:** Sentry (`@sentry/nextjs`)
- **Analytics:** Vercel Analytics
- **Utilities:** clsx + tailwind-merge (`lib/utils/cn.ts`)

## Project Structure

```
app/
  layout.tsx              # Root layout with fonts and vignette
  page.tsx                # Homepage with interactive search
  globals.css             # Tailwind config and CSS variables
  api/search/route.ts     # Search API (Zod validation, rate limited, logged)
  api/health/route.ts     # Health check (app + DB + Deadlock API status)
  global-error.tsx        # Global error boundary (Sentry capture)
  player/[accountId]/
    page.tsx              # Player profile (server component, parallel data fetching)
    loading.tsx           # SigilLoader loading state
    error.tsx             # Error boundary with retry
    not-found.tsx         # "Soul Not Found" themed 404
  heroes/
    page.tsx              # Heroes grid (server component, aggregated stats)
    loading.tsx           # SigilLoader loading state
    [heroId]/
      page.tsx            # Hero detail (server component, global stats)
      loading.tsx         # SigilLoader loading state
      error.tsx           # Error boundary with retry
      not-found.tsx       # "Hero Not Found" themed 404
  match/[matchId]/
    page.tsx              # Match detail (server component, team scoreboards)
    loading.tsx           # SigilLoader loading state
    error.tsx             # Error boundary with retry
    not-found.tsx         # "Match Not Found" themed 404
  leaderboard/
    page.tsx              # Leaderboard (server component, region tabs)
    loading.tsx           # SigilLoader loading state

components/
  ui/                     # Base design system (Button, Card, Input, SigilLoader, Pagination)
  layout/                 # Layout components (Header, Footer, SigilBackground, ArtDecoDivider)
  motion/                 # Animation primitives (FadeIn, ScrollReveal, CountUp, GlowCard, StaggerList, StaggerItem)
  search/                 # SearchBar, SearchResults, RecentSearches, HeroSearchSection
  player/                 # PlayerHeader, TopHeroes, MatchHistoryList
  hero/                   # HeroCard, HeroGrid, WinRateCircle, HeroDetailHeader, HeroDescription, HeroGlobalStats
  match/                  # MatchHeader, TeamScoreboard
  leaderboard/            # RegionSelector, LeaderboardTable

lib/
  db.ts                   # Prisma client singleton
  logger.ts               # Pino structured logger (server-only)
  ratelimit.ts            # Upstash rate limiter with no-op fallback
  validations.ts          # Zod schemas for API input validation
  api/                    # Server-only API wrappers (Steam + Deadlock)
    types.ts              # TypeScript interfaces + ApiError
    steam.ts              # Vanity resolve, player summaries, ID conversion
    deadlock.ts           # Heroes, matches, stats, leaderboards
    index.ts              # Barrel export
  hooks/
    useRecentSearches.ts  # localStorage hook (SSR-safe)
  utils/
    cn.ts                 # Tailwind class merge utility
    format.ts             # formatDuration, formatTimeAgo, formatNumber

prisma/
  schema.prisma           # Database schema

# Root config files
instrumentation.ts        # Next.js instrumentation hook (Sentry registration)
sentry.client.config.ts   # Sentry client-side init
sentry.server.config.ts   # Sentry server-side init
sentry.edge.config.ts     # Sentry edge runtime init
.github/workflows/ci.yml  # GitHub Actions CI (lint → typecheck → build)
```

## Design System: "Occult Noir Ascended"

Theme colors are defined as CSS variables in `globals.css`:

- `--soul` / `--soul-glow` - Primary accent (green)
- `--amber` - Secondary accent (gold)
- `--sigil` - Tertiary accent (teal)
- `--blood` - Danger/loss (red)
- `--surface` / `--deep` / `--void` - Background layers

Fonts:

- Display: Cinzel Decorative (titles)
- Heading: Cinzel (section headers)
- Body: Inter (text)
- Mono: JetBrains Mono (stats/data)

### Visual Systems (CSS utilities in `globals.css`)

- **Glassmorphism:** `.glass-panel` (frosted backdrop-blur card), `.card-shimmer` (hover light sweep), `.animated-border` (rotating conic gradient border on hover)
- **Page Atmospheres:** `.atmosphere-soul` (green radials), `.atmosphere-amber` (gold radials), `.atmosphere-blood` (red radials) — each page has a unique atmospheric identity
- **Win Rate Bars:** `.winrate-bar` / `.winrate-bar-fill` — 6px glowing green-over-red bars
- **Glow Variables:** `--glow-soul-ambient`, `--glow-amber-ambient` — ambient box-shadow presets for cards/panels

## Data Sources

### Deadlock Community API (no auth required)

- **Assets API:** `https://assets.deadlock-api.com`
  - `GET /v2/heroes` — hero list (id, name, class_name, images, descriptions)
  - `GET /v2/heroes/{id}` — single hero
  - `GET /v2/items` — all items with properties and images
  - `GET /v2/ranks` — rank tiers with badge images
- **Game Data API:** `https://api.deadlock-api.com`
  - `GET /v1/players/hero-stats?account_ids=ID` — per-hero stats for a player
  - `GET /v1/matches/metadata?account_ids=ID&include_player_info=true&limit=N` — match history
  - `GET /v1/matches/{match_id}/metadata` — full match detail
  - `GET /v1/analytics/hero-stats` — global hero win/loss aggregates
  - `GET /v1/analytics/player-stats/metrics?account_ids=ID` — player performance percentiles
  - `GET /v1/leaderboard/{region}` — regional leaderboard (NAmerica, SAmerica, Europe, Asia, Oceania)

### Steam Web API (requires STEAM_API_KEY)

- `GET /ISteamUser/ResolveVanityURL/v1/` — vanity URL → Steam64 ID
- `GET /ISteamUser/GetPlayerSummaries/v2/` — Steam64 ID → player name, avatar, profile
- **ID conversion:** `accountId = steam64 - 76561197960265728` (Deadlock API uses Account IDs, Steam uses Steam64 IDs)
- **No player search by name exists in the Deadlock API** — Steam API is the bridge for name lookups

### Important API Notes

- Match history endpoint without time/limit filters can return massive payloads (15M+ matches in DB) — always use `limit` or `min_unix_timestamp`
- Match details use numeric hero/item IDs — cross-reference with assets API
- Leaderboard has `account_name` but no search-by-name endpoint
- Steam API key is in `.env` as `STEAM_API_KEY` — never expose client-side
- Hero analytics (`/v1/analytics/hero-stats`) returns data bucketed by rank tier — aggregate across buckets for global stats (sum wins/losses per hero)
- All external API fetches have 10s timeouts (`AbortSignal.timeout(10_000)`)

## API Integration (`lib/api/`)

- `types.ts` — TypeScript interfaces for all API responses + `ApiError` class
- `steam.ts` — Steam API wrappers + ID conversion (server-only, with structured logging)
- `deadlock.ts` — Deadlock API wrappers with Next.js fetch caching (server-only, with structured logging)
- `index.ts` — barrel export

Import from `@/lib/api` in server components/route handlers.

## Security

- **Rate limiting:** Upstash Redis sliding window (10 req/60s per IP) on `/api/search`
- **Input validation:** Zod schemas in `lib/validations.ts`
- **Security headers:** CSP (report-only), X-Frame-Options, HSTS, etc. in `next.config.ts`
- **Error boundaries:** All 6 page-level `error.tsx` files + `global-error.tsx` report to Sentry
- **Health endpoint:** `GET /api/health` — checks app, database, and Deadlock API status
- **Secrets:** All in `.env` / `.env.local` (gitignored), `server-only` enforced on API modules

## Observability

- **Sentry:** Error monitoring on client, server, and edge runtimes
- **Pino:** Structured JSON logging on all API wrappers and the search route
- **Vercel Analytics:** Page views and Web Vitals in `<Analytics />` (root layout)
- **CI:** GitHub Actions runs lint → tsc → build on every PR to master

## Path Aliases

- `@/*` maps to project root (e.g., `@/components/ui`)

## Environment Variables

See `.env.example` for all variables with setup links. Key ones:

| Variable | Required | Purpose |
|----------|----------|---------|
| `STEAM_API_KEY` | Yes | Steam Web API (player lookups) |
| `DATABASE_URL` | Yes (prod) | Supabase PostgreSQL connection |
| `UPSTASH_REDIS_REST_URL` | No | Rate limiting (no-ops without) |
| `UPSTASH_REDIS_REST_TOKEN` | No | Rate limiting (no-ops without) |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Sentry error monitoring (silent without) |
| `SENTRY_AUTH_TOKEN` | No | Source map upload during builds |

## Development Progress

### Feature Phases (UI)
- **Phase 0 (Foundation):** ✅ Complete — design system, components, Prisma schema
- **Phase 1 (Search & Player Profile):** ✅ Complete — search API route, search UI, player profile with hero stats + match history
- **Phase 2 (Heroes Grid):** ✅ Complete — hero grid page with filtering, sorting, and aggregated win-rate stats
- **Phase 3 (Hero Detail):** ✅ Complete — hero detail page with global stats, lore/playstyle descriptions
- **Phase 4 (Match Detail):** ✅ Complete — match detail page with team scoreboards, cross-linked players/heroes
- **Phase 5 (Leaderboard):** ✅ Complete — leaderboard page with region selector, rank badges, top heroes
- **Phase 6 (Homepage Polish):** ✅ Complete — async hero count, linked CTA buttons
- **Phase 7 (Visual Redesign):** ✅ Complete — "Occult Noir Ascended" glassmorphism, animated borders, page atmospheres, motion components, enhanced loading/error/not-found states

### Infrastructure Phases
- **Phase 1 (Security Hardening):** ✅ Complete — Zod validation, Upstash rate limiting, security headers, secret audit
- **Phase 2 (Deployment & CI/CD):** ✅ Complete — GitHub Actions CI, Ko-fi links, Vercel/Supabase/Upstash configured, Speed Insights, Image Optimization disabled
- **Phase 3 (Observability):** ✅ Complete — Sentry error monitoring, Pino logging, health endpoint, Vercel Analytics
- **Phase 3.5 (Dev Warnings & Lint Cleanup):** ✅ Complete — React 19 lint fixes, Image fill mode, scroll-behavior, cache fixes, Dependabot alerts resolved
- **Phase 4 (Scaling & Caching):** Pending — Redis caching for Deadlock API, leaderboard batch/throttle, stale-while-error fallback, CSP enforcing
