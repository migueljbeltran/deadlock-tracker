# PRD: dltracker Public Beta (Deadlock Stats Tracker)

## Summary
`dltracker` is a web app for Deadlock players to search a player profile, review hero/match performance, browse global hero analytics, and inspect regional leaderboards in an "Occult Noir" visual style.
This PRD defines the complete public-beta scope and a dated roadmap from March 3, 2026 to June 30, 2026 with a hybrid cache strategy (live API + selective DB caching).

## Product Goals
- Launch a stable public beta for Deadlock players.
- Deliver fast, reliable profile and match exploration despite third-party API variability.
- Preserve the existing branded visual identity while improving trust, correctness, and UX consistency.

## Non-Goals (Beta)
- No account/authentication system in beta.
- No user-generated content/social features.
- No paid monetization features in beta.
- No native mobile app (web responsive only).

## Long-Term Vision

After beta, dltracker evolves into a community platform. All core stats remain free forever.

### Authentication & Accounts
- NextAuth.js (Auth.js v5) with Steam OpenID + Discord OAuth.
- Steam first (zero friction — players already have accounts), Discord for community tie-in.
- Prisma schema extends with `User`, `Account`, `Session` tables (NextAuth adapter).
- Unlocks: persistent favorites, notification preferences, search history sync.

### User-Generated Content & Social
- Custom hero tier lists (shareable via URL).
- Community build guides with item/ability orders.
- Threaded comments on hero/match pages (with community moderation).
- Public dltracker profiles showing activity and created content.
- Follow system for player rank/match updates.

### Mobile
- **Step 1:** PWA — installable, offline shell, push notifications. Reuses web codebase.
- **Step 2:** React Native or Capacitor wrapper if PWA engagement warrants it.

### Sustainability Model
Philosophy: **Everything that exists today stays free forever. Supporters get convenience and cosmetics, never gated stats.**

Revenue is about keeping the lights on, not extracting value. The app should feel community-run.

**1. Donate / Tip (Lowest friction, day-one ready)**
A simple "Support dltracker" link in the footer and about page. No sign-up required.
- **Ko-fi** — one-time tips or monthly membership, zero platform fees on tips, gaming community is familiar with it.
- **Buy Me a Coffee** — similar to Ko-fi, slightly broader audience.
- **GitHub Sponsors** — good if the repo is public, integrates with the dev workflow.
- Pick one (Ko-fi recommended for gaming context). Can add day one — no backend work needed.
- Optional: small "Supported by the community" heart icon in the footer that links to the Ko-fi page.

**2. Supporter Tier (~$2.99/month or $19.99/year)**
Framed as "support dltracker" rather than "unlock premium." All stats and match history are fully accessible to everyone — supporters get cosmetic and convenience perks:
- Ad-free experience (the only perk that removes something).
- Supporter badge on profile and comments.
- Custom profile themes (alternate color palettes within the Occult Noir aesthetic).
- Stat export (CSV/image for sharing on socials).
- Priority data refresh (shorter cache TTL).
- Early access to new features.

**3. Lightweight Ads (Non-supporters only)**
- Single static banner per page (Carbon Ads or similar developer/gaming-friendly network).
- No pop-ups, no interstitials, no autoplay video, no tracking-heavy ad networks.
- Ads never appear during loading, search, or on error pages.

**4. One-Time Cosmetics (Future, at scale)**
- Profile banners, animated badges, stat card themes.
- Transparent flat pricing. No loot boxes, no gacha, no FOMO tactics.
- Only worth building at 10K+ MAU.

**What stays free (non-negotiable):**
- All player stats, hero stats, match details, leaderboards.
- Full match history with no caps — browsing, filtering, and pagination available to all users.
- Search and profile viewing.
- Community content (tier lists, guides).
- Core app functionality — no "upgrade to see this stat" gates.

**Tech stack for payments:**
- Ko-fi link (external, no backend needed) — implement immediately.
- Stripe Checkout + Billing for supporter subscriptions (when accounts are added).
- `/api/webhooks/stripe` for subscription sync.
- Server-side `user.isSupporter` check — never client-side gating.

## Target Users
- Primary: Active Deadlock players checking own stats and match outcomes.
- Secondary: Competitive players scouting top leaderboard players/heroes.
- Tertiary: Casual observers browsing heroes and meta trends.

## Current Baseline (from repository)
- All core routes implemented and functional: `/`, `/heroes`, `/heroes/[heroId]`, `/player/[accountId]`, `/match/[matchId]`, `/leaderboard`.
- Search route implemented: `GET /api/search?q=...` with Steam vanity/URL/Steam64 handling.
- Data sources: Deadlock API + Steam Web API.
- Local recent-search UX exists (`localStorage`, max 5).
- Visual redesign complete: "Occult Noir Ascended" — glassmorphism, animated gradient borders, page atmospheres, motion components (FadeIn, ScrollReveal, CountUp, GlowCard, StaggerList).
- Zero TypeScript compile errors; production build passes cleanly.
- `/about` and `/privacy` pages implemented with full content.
- Security hardening complete: Zod validation, Upstash rate limiting, security headers.
- CI/CD: GitHub Actions PR checks (lint → tsc → build), Vercel auto-deploy.
- Observability: Sentry error monitoring, Pino structured logging, health endpoint, Vercel Analytics.
- Ko-fi donation link in footer and about page.
- Deployed to Vercel with Supabase (PostgreSQL) and Upstash Redis.

## Success Metrics (Beta Exit)
- p95 server response time for cacheable data routes under 900ms.
- Player profile page render success rate >= 99.0% (excluding 4xx user-input errors).
- Search success-to-result rate >= 85% for valid Steam identifiers.
- Match detail load failure rate <= 2%.
- Lighthouse mobile performance >= 75 on core pages (`/`, `/player/[id]`, `/heroes`, `/leaderboard`).
- Zero TypeScript compile errors in CI.

## Functional Requirements

### 1) Player Discovery
- User can search by:
  - Steam64 ID.
  - Vanity name.
  - Steam community URL (`/id/...` or `/profiles/...`).
- Search API returns:
  - `200` with `{ success: true, player: { accountId, name, avatar } }`.
  - `400` for empty/invalid query.
  - `404` for not found.
  - `500` for upstream/internal failure.
- On successful selection:
  - Navigate to `/player/{accountId}`.
  - Save recent search locally (deduplicated, max 5).

### 2) Player Profile
- `/player/{accountId}` shows:
  - Steam identity card (name/avatar/profile signal).
  - Estimated rank badge from recent match badge averages.
  - Top heroes (sorted by matches, top 6).
  - Match history (default last 20) with result, hero, K/D/A, duration, relative time.
- Invalid account IDs return not-found UX.
- Upstream partial failures degrade gracefully:
  - Hero stats/match history can show empty-state text without crashing profile page.

### 3) Heroes Directory
- `/heroes` shows playable heroes only.
- Client controls:
  - Search by hero name.
  - Sort by name, win rate, pick rate, total matches.
- Hero cards include image, role, win/pick rate, matches.

### 4) Hero Detail
- `/heroes/{heroId}` shows:
  - Hero identity + visual assets.
  - Lore/playstyle/role description if available.
  - Aggregated global metrics across rank buckets:
    - Win rate, pick rate, total matches.
    - Avg K/D/A, avg damage, avg net worth.
- If no analytics for a hero, show explicit "no data yet" message.

### 5) Match Detail
- `/match/{matchId}` shows:
  - Match metadata header.
  - Two team scoreboards with winner indicator.
  - Player name, hero icon/link, K/D/A, net worth, LH/denies, level.
  - Links to hero and player pages.
- Invalid/empty match payload routes to not-found UX.

### 6) Leaderboard
- `/leaderboard?region={NAmerica|SAmerica|Europe|Asia|Oceania}`.
- Defaults to `NAmerica` for invalid/missing region.
- Table includes rank number, player, rank badge, top heroes.
- Player/hero links navigate into detailed pages.

### 7) Legal & Trust UX
- Add real routes for `/about` and `/privacy`.
- About page must state unofficial status and data-source attribution.
- Privacy page must define no-login data handling and localStorage behavior.

## Important Public APIs / Interfaces / Types

### Existing public interface (keep stable)
- `GET /api/search?q=<string>`
- URL contracts:
  - `/player/:accountId`
  - `/heroes/:heroId`
  - `/match/:matchId`
  - `/leaderboard?region=:region`

### New internal interfaces for beta hardening
- `GET /api/health`
  - Returns app status, dependency status summary.
- `GET /api/player/:accountId/snapshot`
  - Returns normalized cached profile summary used by profile page.
- `GET /api/match/:matchId/snapshot`
  - Returns normalized cached match detail for page rendering.

### Type/interface decisions
- Standardize `TeamScoreboard` props to one contract:
  - `players`, `heroMap`, `playerNameMap`, `isWinner`, `teamLabel`.
- Introduce normalized DTOs:
  - `PlayerSnapshot`, `HeroAggregateSnapshot`, `MatchSnapshot`.
- Add explicit error envelope for internal APIs:
  - `{ success: false, code, message, retryable }`.

## Data & Caching Strategy (Hybrid)
- Continue live fetch from Deadlock/Steam APIs.
- Add Prisma-backed caches with TTL:
  - `PlayerSummaryCache` TTL 10 min.
  - `PlayerHeroStatsCache` TTL 5 min.
  - `PlayerMatchHistoryCache` TTL 2 min.
  - `HeroAnalyticsCache` TTL 30 min.
  - `LeaderboardCache` TTL 10 min.
  - `MatchDetailCache` TTL 24h.
- Read path:
  - Use fresh cache first.
  - Fallback to live API if stale/missing.
  - On upstream failure, serve stale cache when available.
- Store fetch timestamps and source status for observability.

## Non-Functional Requirements

### Reliability
- Graceful degradation for each upstream failure mode.
- Stale-while-error: serve cached data when APIs are down.

### Performance
- Use parallel data fetches for independent resources.
- Keep hydration minimal on data-heavy pages.
- Redis (Upstash) hot cache for frequently accessed endpoints.
- ISR for slow-changing pages (hero list, hero detail).

### Security
- `STEAM_API_KEY` server-only, never exposed to client bundles.
- Rate limiting on `/api/search` via Upstash Ratelimit (Redis-backed, serverless-safe).
- Input validation with Zod schemas on all API routes.
- Security headers in `next.config.ts`:
  - `Content-Security-Policy` — restrict script/style sources.
  - `X-Frame-Options: DENY` — prevent clickjacking.
  - `X-Content-Type-Options: nosniff` — prevent MIME sniffing.
  - `Strict-Transport-Security` — enforce HTTPS.
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy` — disable unused browser APIs (camera, microphone, etc.).

### Accessibility
- Keyboard navigability for search and tables.
- Semantic headings and contrast-compliant text.
- `aria-live` regions for dynamic search results.

### SEO
- Route-level metadata for all public pages (implemented).
- Static sitemap for core routes (implemented via `app/sitemap.ts`).
- `robots.txt` (implemented via `app/robots.ts`).
- Dynamic sitemap for hero/player pages (planned).

## Analytics & Observability
- Track events:
  - `search_submitted`, `search_success`, `search_not_found`.
  - `profile_viewed`, `hero_viewed`, `match_viewed`, `leaderboard_region_changed`.
- Record API dependency metrics:
  - Upstream latency, error rate, stale-cache fallback count.
- Add structured logs with request ID correlation.

## Test Cases & Scenarios

### Unit
- Steam ID conversion roundtrip.
- Search query extraction from raw Steam URLs.
- Hero analytics aggregation math.
- Rank estimation from badge arrays.
- Formatter utilities (`duration`, `time ago`, number formatting).

### Integration
- `/api/search`:
  - empty query -> 400.
  - invalid URL -> 400.
  - vanity not found -> 404.
  - successful vanity -> player payload.
- Snapshot endpoints:
  - cache hit.
  - cache miss + live success.
  - live failure + stale fallback.
  - live failure + no cache.

### Route/component behavior
- `/player/[accountId]` invalid param -> not found.
- `/match/[matchId]` empty players -> not found.
- Leaderboard invalid region defaults to NAmerica.
- Search dropdown closes on outside click.
- Recent searches dedupe and cap at 5.

### End-to-end smoke
- Home search -> player page.
- Player match click -> match detail.
- Leaderboard hero icon click -> hero detail.
- All loading/error states render without crash.

## Infrastructure Stack

### Hosting & Deployment
- **Platform:** Vercel (serverless) — native Next.js support, auto-scales, free hobby tier.
- **Why serverless:** Short-lived request/response pages, no persistent connections, unpredictable traffic, solo developer. Serverless auto-scales on viral spikes and costs $0 at low traffic.
- **Deployment:** Auto-deploy on push to `master` via Vercel GitHub integration.
- **Domain:** `dltracker.gg` — configure via Vercel DNS or Cloudflare (free CDN + DNS).

### Database
- **Primary:** Supabase (managed PostgreSQL) — free tier (500MB, 50K MAU). Already targeted by Prisma schema. Built-in auth adapter for future accounts.
- **Hot cache / Rate limiting:** Upstash Redis — free tier (10K commands/day). Serverless-native (HTTP-based, no persistent connections). Used for rate limiting and caching frequently-hit endpoints.
- **Data flow:**
  1. Request arrives → rate limiter checks Upstash Redis.
  2. Check Supabase for fresh cached data.
  3. Cache hit → serve from DB (fast, no external API call).
  4. Cache miss → fetch from Steam + Deadlock APIs → store in Supabase → return to user.
  5. API failure → serve stale cache if available → degrade gracefully if not.

### CI/CD (GitHub Actions)
- **PR checks workflow:** On every pull request → `npm run lint` → `tsc --noEmit` → `npm run build`.
- **Deploy workflow:** On merge to `master` → Vercel auto-deploys (no custom workflow needed).
- **Future:** Add Playwright E2E tests to PR checks once test suite is established.

### Error Monitoring
- **Sentry** (free developer tier, 5K events/month) — Next.js SDK for automatic error capture on both server and client, stack traces with source maps, performance monitoring.

### Logging
- **Pino** for structured server-side logging — timestamps, log levels, JSON output, request ID correlation. Replaces `console.log` for production debugging.

### Analytics
- **Vercel Analytics** (free tier) or **Plausible** (privacy-friendly, no cookies). Track page views and core user flows without invasive tracking.

### Cost Summary (Production)
| Service | Tier | Monthly Cost |
|---------|------|-------------|
| Vercel | Hobby | $0 |
| Supabase | Free | $0 |
| Upstash Redis | Free | $0 |
| Sentry | Developer | $0 |
| GitHub Actions | Free (public repo) | $0 |
| Domain (dltracker.gg) | Annual | ~$15/year |
| **Total** | | **~$1.25/month** |

## Roadmap

### Phase 0: Baseline Stabilization ✅ Complete
- ~~Fix TypeScript contract mismatch in match flow.~~ ✅
- ~~Add missing `/about` and `/privacy` pages.~~ ✅
- ~~Zero TS errors, all nav/footer links resolve.~~ ✅

### Phase 1: Security Hardening ✅ Complete
- ~~Add rate limiting on `/api/search` via Upstash Ratelimit (sliding window, 10 req/60s per IP).~~ ✅
- ~~Add security headers in `next.config.ts` (CSP report-only, X-Frame-Options, HSTS, etc.).~~ ✅
- ~~Add Zod input validation on all API routes.~~ ✅
- ~~Audit: ensure no secrets in client bundles or git history.~~ ✅
- ~~Add 10s fetch timeouts to all external API calls.~~ ✅
- ~~Scrub internal error messages from health endpoint responses.~~ ✅
- ~~Add Sentry `beforeSend` hooks to strip sensitive headers.~~ ✅

### Phase 2: Deployment & CI/CD ✅ Complete
- ~~Deploy to Vercel — connect GitHub repo, configure environment variables.~~ ✅
- ~~Set up Supabase project — wire `DATABASE_URL` to Vercel env vars.~~ ✅
- ~~Set up Upstash Redis — wire connection to Vercel env vars.~~ ✅
- [ ] Configure custom domain with DNS.
- ~~Add GitHub Actions PR checks workflow (`lint` → `tsc --noEmit` → `build`).~~ ✅
- ~~Add Ko-fi donation link to footer and about page.~~ ✅
- ~~Add Vercel Speed Insights.~~ ✅
- ~~Disable Vercel Image Optimization (external assets already WebP).~~ ✅

### Phase 3: Error Monitoring & Observability ✅ Complete
- ~~Integrate Sentry Next.js SDK (server + client + edge error capture).~~ ✅
- ~~Add structured logging with Pino (all API wrappers + search route).~~ ✅
- ~~Add `GET /api/health` endpoint (app + database + Deadlock API checks).~~ ✅
- ~~Set up Vercel Analytics.~~ ✅

### Phase 3.5: Dev Warnings & Lint Cleanup ✅ Complete
- ~~Fix React 19 lint errors (purity, setState-in-effect, unused imports).~~ ✅
- ~~Migrate useRecentSearches to useSyncExternalStore.~~ ✅
- ~~Convert all external `<Image>` to fill mode (eliminate width/height warnings).~~ ✅
- ~~Fix scroll-behavior: move to `data-scroll-behavior` attribute (Next.js 16).~~ ✅
- ~~Fix items fetch cache conflict (response >2MB exceeds Next.js cache limit).~~ ✅
- ~~Fix Pino MaxListenersExceededWarning in dev.~~ ✅
- ~~Update eslint-config-next to match Next.js 16.2.x.~~ ✅
- ~~Add explicit read-only permissions to CI workflow.~~ ✅
- ~~Merge Dependabot PR for flatted prototype pollution fix.~~ ✅
- ~~Dismiss effect Dependabot alert (dev-only, not exploitable).~~ ✅

### Phase 4: Scaling & Caching Layer
**Trigger:** ~1K+ DAU or frequent Deadlock API 429s.

- [ ] Add Redis caching layer for Deadlock API responses (hero stats, leaderboard, match history).
  - Short TTLs: 60s for leaderboard, 300s for hero stats, 600s for match history.
  - Eliminates redundant upstream API calls across concurrent visitors.
- [ ] Batch/throttle leaderboard match history fetches to avoid Deadlock API 429s.
- [ ] Implement stale-while-error fallback: serve cached data when upstream is down.
- [ ] Cache items endpoint response in Redis (>2MB, exceeds Next.js fetch cache limit).
- [ ] Switch CSP from report-only to enforcing after monitoring violations.
- [ ] Add CI trigger on push to master (currently only runs on PRs).
- [ ] Exit criteria: zero 429s under normal traffic; pages render during upstream outages.

### Phase 5: Testing
- [ ] Set up Playwright for E2E tests.
- [ ] E2E: Homepage → search → player profile.
- [ ] E2E: Heroes grid → hero detail.
- [ ] E2E: Player profile → match detail.
- [ ] E2E: Leaderboard → region switching.
- [ ] API tests: `/api/search` — valid Steam ID, vanity URL, invalid input, rate limit.
- [ ] Add Playwright to GitHub Actions PR checks.

### Phase 6: UX Completion & Polish
- [ ] Improve error messages with retryability hints.
- [ ] Add "last updated" and "data source" indicators on cached pages.
- [ ] Refine empty states and skeleton consistency.
- [ ] Dynamic sitemap for hero/player pages.
- ~~`robots.txt` generation.~~ ✅ (implemented as `app/robots.ts`)
- [ ] Accessibility pass: `aria-live` regions, contrast audit, keyboard navigation.
- [ ] Responsive audit across breakpoints.

### Phase 7: User Accounts & Social
- [ ] NextAuth.js with Steam OpenID + Discord OAuth.
- [ ] User model in Prisma (`User`, `Account`, `Session` tables).
- [ ] Persistent favorites / bookmarks (account-linked).
- [ ] Search history sync across devices.
- [ ] Public dltracker profiles.
- [ ] Follow system for player updates.

### Phase 8: Community Features
- [ ] Custom hero tier lists (create, share via URL).
- [ ] Community build guides with item/ability orders.
- [ ] Threaded comments on hero/match pages.
- [ ] Moderation: flag/report system + admin panel.

### Phase 9: Advanced Features
- [ ] Player comparison (side-by-side stats).
- [ ] Match history filtering (by hero, date, win/loss).
- [ ] OG image generation for social share cards.
- [ ] Hero matchup matrices and win rate trends over time.
- [ ] PWA support (installable, offline shell, push notifications).

### Phase 10: Sustainability
- [ ] Stripe integration for supporter subscriptions.
- [ ] Supporter perks: ad-free, badge, custom themes, stat export, priority refresh.
- [ ] Lightweight ad integration for non-supporters (Carbon Ads or similar).
- [ ] Cosmetic marketplace (profile banners, animated badges) — only at scale (10K+ MAU).

## Risks & Mitigations
- **Third-party API instability:**
  Mitigate with TTL cache + stale fallback + health checks.
- **Deadlock API rate limiting (429s):**
  Already hitting 429s on leaderboard page when fetching match histories for multiple accounts in parallel. Mitigate with Redis caching layer (Phase 4) and request batching/throttling. Current graceful degradation: empty match data shown.
- **Schema drift in external APIs:**
  Mitigate with runtime guards and typed normalization layer.
- **Heavy payload endpoints:**
  Items endpoint response exceeds Next.js 2MB fetch cache limit. Currently using `cache: "no-store"`. Mitigate with Redis caching in Phase 4.
- **Visual regressions from rapid polish:**
  Keep E2E smoke tests and route-level checks.
- **Serverless cold starts:**
  Mitigate with Vercel edge caching and ISR for static-ish pages.
- **Database connection churn (serverless):**
  Supabase provides built-in connection pooling (PgBouncer, pool size 15, max 200 clients). Upstash Redis uses HTTP (no connection pool needed).
- **Vercel free tier limits:**
  Image Optimization disabled (external assets already WebP). Monitor Fluid Active CPU (58% at 12h post-deploy). Upgrade triggers: ~1K DAU for Upstash ($1-2/mo), ~5K DAU for Vercel Pro ($20/mo).
- **Cost scaling:**
  Free tiers cover ~500-1K DAU. Upgrade path: Upstash pay-as-you-go → Vercel Pro → Supabase Pro. Monitor usage dashboards monthly. If traffic exceeds free limits, supporter revenue and ads should offset upgraded tiers.

## Assumptions & Defaults
- Launch objective: Public beta → full production platform.
- Architecture: Serverless (Vercel) + managed Postgres (Supabase) + managed Redis (Upstash).
- Data approach: Hybrid cache layer (live API + DB cache with TTL).
- No user auth required until Phase 7.
- Deadlock/Steam APIs remain primary source of truth.
- PostgreSQL and Prisma remain the storage stack.
- Primary locale is English (`en-US`) for date/number formatting.
- Monetization is community-first: all core features stay free, supporter perks are cosmetic/convenience only.
