# dltracker

A Deadlock stats tracker with an "Occult Noir" design aesthetic — blending 1930s Art Deco with supernatural elements. Search players, view hero stats, and browse match history in an atmospheric, immersive interface.

<!-- ![dltracker screenshot](screenshot.png) -->

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS 4 (CSS-first config)
- **Animations:** Framer Motion
- **Database:** PostgreSQL via Prisma 6
- **Data Sources:** [Deadlock Community API](https://deadlock-api.com) + Steam Web API

## Getting Started

```bash
# Clone and install
git clone https://github.com/your-username/deadlock-tracker.git
cd deadlock-tracker
npm install

# Set up environment
cp .env.example .env
# Add your STEAM_API_KEY to .env

# Generate Prisma client
npx prisma generate

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Status

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

## Design

The "Occult Noir Ascended" theme uses a dark palette with soul-green (#3DDC84) accents, amber/gold highlights, and Art Deco geometric patterns. The visual layer features glassmorphism panels with backdrop blur, animated conic-gradient borders on hover, per-page atmospheric radial gradients, and glowing win-rate bars. Fonts include Cinzel Decorative for display text and JetBrains Mono for stats.
