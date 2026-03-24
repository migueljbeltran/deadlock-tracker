# dltracker

A Deadlock stats tracker with an "Occult Noir" design aesthetic — blending 1930s Art Deco with supernatural elements. Search players, view hero stats, and browse match history in an atmospheric, immersive interface.

<!-- ![dltracker screenshot](screenshot.png) -->

## Features

- **Player Search** — Look up players by Steam ID, vanity name, or profile URL
- **Player Profiles** — Hero stats, match history, career stats, rank estimation
- **Heroes Directory** — Browse all heroes with win rates, pick rates, filtering and sorting
- **Hero Detail** — Global stats, lore, playstyle descriptions
- **Match Detail** — Full team scoreboards with linked players and heroes
- **Leaderboard** — Regional rankings (NA, SA, EU, Asia, Oceania)
- **Items & Tier Lists** — Item stats and hero tier list

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4 (CSS-first config)
- **Animations:** Framer Motion
- **Database:** PostgreSQL via Prisma 6 (Supabase)
- **Cache/Rate Limiting:** Upstash Redis
- **Validation:** Zod
- **Error Monitoring:** Sentry
- **Logging:** Pino
- **Analytics:** Vercel Analytics
- **Data Sources:** [Deadlock Community API](https://deadlock-api.com) + Steam Web API

## Getting Started

```bash
# Clone and install
git clone https://github.com/migueljbeltran/deadlock-tracker.git
cd deadlock-tracker
npm install

# Set up environment
cp .env.example .env.local
# Fill in your STEAM_API_KEY (required) and other vars (see .env.example for details)

# Generate Prisma client
npx prisma generate

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

See `.env.example` for all variables with setup instructions. Only `STEAM_API_KEY` is required for local development — all other services (Redis, Sentry, Analytics) gracefully no-op when unconfigured.

## Project Status

### Feature Phases

| Phase | Status |
|-------|--------|
| 0 - Foundation (design system, components) | Done |
| 1 - Search & Player Profile | Done |
| 2 - Heroes Grid | Done |
| 3 - Hero Detail Page | Done |
| 4 - Match Detail | Done |
| 5 - Leaderboard | Done |
| 6 - Homepage Polish | Done |
| 7 - Visual Redesign ("Occult Noir Ascended") | Done |

### Infrastructure Phases

| Phase | Status |
|-------|--------|
| 1 - Security Hardening (rate limiting, validation, headers) | Done |
| 2 - Deployment & CI/CD (Vercel, Supabase, GitHub Actions) | Done |
| 3 - Observability (Sentry, Pino, health checks, analytics) | Done |
| 4 - Data Reliability Layer (caching, stale-while-error) | Planned |
| 5 - Testing (Playwright E2E) | Planned |
| 6 - UX Completion & Polish | Planned |

## Design

The "Occult Noir Ascended" theme uses a dark palette with soul-green (#3DDC84) accents, amber/gold highlights, and Art Deco geometric patterns. The visual layer features glassmorphism panels with backdrop blur, animated conic-gradient borders on hover, per-page atmospheric radial gradients, and glowing win-rate bars. Fonts include Cinzel Decorative for display text and JetBrains Mono for stats.

## Support

If you find dltracker useful, consider [supporting on Ko-fi](https://ko-fi.com/trazen).

## License

This project is not affiliated with Valve Corporation. Deadlock and all related properties are trademarks of Valve Corporation.
