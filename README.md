<div align="center">

# DLTRACKER

**A living record of souls and matches from the Cursed Apple.**

Track players, analyze heroes, and explore match history in Deadlock, wrapped in an atmospheric Occult Noir interface inspired by 1930s Art Deco and the supernatural.

**[dltracker.app](https://dltracker.app)**

![Homepage](docs/screenshots/homepage.png)

</div>

---

## Features

### Player Profiles

Search any player by player name, Steam ID, vanity URL, or profile link. View career stats, estimated rank, performance percentiles, top heroes, and resilient paginated match history.

![Player Profile](docs/screenshots/player-profile.png)

### Heroes

Browse all 38 playable heroes with win rates, pick rates, and match counts. Filter by time range and rank bracket. Sort by any stat.

![Heroes Grid](docs/screenshots/heroes-grid.png)

### Hero Detail

Deep-dive into any hero with lore, playstyle descriptions, global statistics, and a full performance breakdown by rank tier.

<details>
<summary>View hero detail screenshots</summary>

![Hero Detail](docs/screenshots/hero-detail.png)
![Hero Statistics](docs/screenshots/hero-stats.png)
![Performance by Rank](docs/screenshots/rank-breakdown.png)

</details>

### Match Detail

Full team scoreboards with K/D/A, net worth, last hits, item builds, and cross-linked players and heroes.

![Match Detail](docs/screenshots/match-detail.png)

### Tier List

Heroes ranked into S/A/B/C/D tiers by win rate and pick rate. Filter by time range and rank bracket to see how the meta shifts.

![Tier List](docs/screenshots/tier-list.png)

### Items

171 items tracked with win rates and match counts. Filter by time range, rank bracket, type (Weapon/Vitality/Spirit), and tier.

<details>
<summary>View items screenshot</summary>

![Items](docs/screenshots/items.png)

</details>

### Leaderboard

Regional rankings across NA, SA, EU, Asia, and Oceania with rank badges, top heroes, top-50 initial loading, and safely enriched player profile links.

<details>
<summary>View leaderboard screenshot</summary>

![Leaderboard](docs/screenshots/leaderboard.png)

</details>

---

## Architecture

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, ISR, Suspense streaming) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS 4 (CSS-first config) |
| Animations | Framer Motion |
| Database | PostgreSQL via Prisma 6 (Supabase) |
| Cache / Rate Limiting | Upstash Redis |
| Monitoring | Sentry, Pino (structured JSON logging), Vercel Analytics |
| Validation | Zod |
| Testing | Vitest, React Testing Library, jsdom, Playwright |
| CI/CD | GitHub Actions (lint, typecheck, unit tests, security audit) |
| Data Sources | [Deadlock Community API](https://deadlock-api.com) + Steam Web API |

### Key Engineering Decisions

- **ISR + `generateStaticParams`** for hero and match pages: pre-renders 38 hero pages at build time and caches match pages on first visit.
- **Suspense streaming** on data-heavy pages: the page shell renders instantly while API data streams in, improving perceived load time.
- **Multi-signal account resolution** on the leaderboard: ambiguous leaderboard account IDs are resolved with Steam profile and hero-pattern signals only for the visible page.
- **Cache resilience for expensive paths**: shared read-through cache helpers serve stale snapshots on rebuild failure and avoid duplicate rebuilds with short Redis locks.
- **Rank estimation from match badges**: player ranks are estimated by averaging team badge values from recent matches and mapping them to rank tiers.
- **Runtime API guards**: critical Steam and Deadlock payloads are validated with Zod before cached data reaches rendering code.
- **Reusable client snapshot hooks**: player and leaderboard views keep fetch state, abort handling, refresh behavior, and loading transitions in focused hooks with unit coverage.
- **Custom design system**: "Occult Noir Ascended" theme with glassmorphism panels, animated conic-gradient borders, per-page atmospheric gradients, and glowing stat bars.

### Local Verification

```bash
npm run lint
npx tsc --noEmit
npm run test:unit
npm run test:e2e
npm audit --audit-level=high
npm run build
```

GitHub Actions runs lint, typecheck, unit tests, and high-severity audit on pull requests. Vercel deploy previews validate production builds.

### Data Flow

```
User searches player name
  → Steam Vanity URL API (resolve name → Steam64 ID)
  → Steam Player Summary API (name, avatar)
  → Convert Steam64 → Account ID (subtract offset)
  → Deadlock API (hero stats, match history, performance metrics)
  → Rank estimation (badge averaging from recent matches)
  → Server-rendered profile page with ISR caching
```

---

## Design

The **Occult Noir Ascended** theme uses a dark palette with soul-green (`#3DDC84`) and amber accents, frosted glassmorphism panels, animated gradient borders on hover, and unique atmospheric radial gradients per page section. Typography pairs Cinzel Decorative (display) with JetBrains Mono (stats/data).

---

## Support

If you find dltracker useful, consider [supporting on Ko-fi](https://ko-fi.com/trazen).

## Disclaimer

This project is not affiliated with Valve Corporation. Deadlock and all related properties are trademarks of Valve Corporation.
