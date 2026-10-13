# dltracker

A community Deadlock stats site for player profiles, hero and item statistics, regional leaderboards, and match history.

**[Open dltracker.app](https://dltracker.app)** · [Privacy notice](https://dltracker.app/privacy) · [Hosting guide](docs/free-hosting.md)

![Homepage](docs/screenshots/homepage-revamp.png)

## Features

- Search by player name, Account ID, Steam ID, or Steam profile URL. Vanity lookup uses an optional Steam API key.
- Explore player performance, recent matches, top heroes, and reported ranked badges.
- Compare hero win rates and pick rates by time range and rank bracket; browse the tier list.
- Filter item statistics by slot, tier, rank, and time range.
- Browse leaderboards across five regions and inspect match scoreboards and item builds.
- Use a responsive interface with keyboard navigation and reduced-motion support.

Stats come from community data and can be incomplete or delayed. Profile badges come from the latest tracked ranked match, including earned progress; Eternus divisions reflect the match-entry badge because Valve recalculates them daily. Missing rank data is shown as unavailable, separately from placement/no-rank reports. Leaderboard position is not a badge tier.

## Run locally

Use **Node.js 24 LTS** and npm. No SQL database or Prisma setup is required.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

In PowerShell, use `Copy-Item .env.example .env.local` instead of `cp`. Open [localhost:3000](http://localhost:3000). Remove unused placeholder values from `.env.local`; sample credentials are not valid credentials.

### Environment variables

| Variable | Purpose | Vercel type |
| --- | --- | --- |
| `UPSTASH_REDIS_REST_URL` | Shared snapshots and distributed rate limiting | Config |
| `UPSTASH_REDIS_REST_TOKEN` | Standard read/write REST token for that database | Secret |
| `STEAM_API_KEY` | Optional fresh Steam identities and vanity resolution | Secret |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional error monitoring; intentionally public | Config |
| `SENTRY_AUTH_TOKEN` | Optional build-time source-map uploads | Secret |
| `LOG_LEVEL` | Optional Pino logging level; defaults to `info` | Config |

Without a Steam key, numeric lookups and name search use community-cached profiles. Without healthy Redis, upstream fallback and per-instance rate limiting keep the app usable, but distributed sharing is unavailable. Keep Redis configured in production. Never commit `.env` files or expose private tokens through `NEXT_PUBLIC_*` variables.

## Architecture

Next.js App Router, React, TypeScript, Tailwind CSS, Framer Motion, Zod, Upstash Redis, Sentry, Vercel Analytics, and Pino.

```text
Browser → static page or server-rendered view → validated API data
               ↓                              ↓
        CDN-cached player API       compact Next/Redis snapshots
               ↓                              ↓
       Deadlock Community API + optional Steam Web API
```

Numeric player URLs share one static shell. Player JSON uses stable URLs with CDN caching; explicit refresh requests bypass that CDN response. Public analytics use hourly time buckets and a finite set of time ranges. Large responses are compacted before persistent caching. Redis REST commands are never cached by Next.

Cache locks distinguish contention from an outage. Stale data can remain usable if a rebuild fails; cold public datasets can rebuild without Redis. Navigation prefetch and Vercel image transformations are disabled to reduce unnecessary work.

Rank lookups use the current `/v1/players/{account_id}/rank` and `/v1/players/rank?account_ids=...` endpoints. A leaderboard page batches at most 50 linked identities and caches the result for an hour; it does not make one rank request per row or attach badges to unresolved names. Identity links are inferred from provider candidates and profile/hero signals; name collisions can still produce an incorrect association. Leaderboard snapshots and CDN responses refresh hourly.

Data sources: [Deadlock Community API](https://api.deadlock-api.com/docs) and [Steam Web API](https://steamcommunity.com/dev).

## Verify changes

```bash
npm run lint
npm run typecheck
npm run test:unit
npm audit --audit-level=high
npm run build
npx playwright install chromium
npm run test:e2e
```

CI runs lint, TypeScript, unit tests, and the full high-severity dependency audit. Vercel previews validate production builds. The scoped `tinyglobby` dependency override is covered by actual Next lint-rule compatibility tests; recheck it when upgrading the Next lint plugin.

The default browser suite checks rendering, navigation, the player shell, and security headers. **Run the opt-in live-data suite before approving a deployment**: a page returning HTTP 200 does not prove its data loaded.

```powershell
$env:PLAYWRIGHT_BASE_URL = 'https://your-preview-url.vercel.app'
$env:PLAYWRIGHT_LIVE_DATA = '1'
$env:PLAYWRIGHT_CHANNEL = 'chrome' # Optional: use installed Chrome
npm run test:e2e
```

Live-data checks require real hero statistics, tier-list entries, item win rates, and leaderboard players. For protected previews, use an authorized access method; do not disable deployment protection.

## Deploy and operate

Connect the repository to the existing Vercel project, configure Production and Preview variables, test a preview, and merge through the PR checks. Environment-variable changes require a new deployment.

Check Vercel CPU, ISR writes, transfer, errors, and Upstash storage/commands after deployment and during the following week. Caching reduces avoidable work; free hosting is not guaranteed for arbitrary traffic. Compare usage against ordinary Hobby limits rather than a temporary allowance. See [docs/free-hosting.md](docs/free-hosting.md) for recovery and verification details.

For a wider public launch, follow the [production readiness checklist](docs/production-readiness.md). Traffic targets, load measurements, provider quotas, and legal review must be assessed before claiming support for many users.

If an Upstash database is deleted after inactivity, create a replacement and update both REST variables before redeploying. Redis contains rebuildable caches and rate-limit counters; restoring old cache data is unnecessary.

## Privacy, support, and attribution

The site does not require accounts, but it processes public player data, IP-based rate limits, operational logs, analytics, and error reports. Recent player searches are stored locally in the browser. Read the [privacy notice](https://dltracker.app/privacy) and the [legal review checklist](docs/legal-review.md) before changing telemetry or data collection.

Report reproducible bugs through [GitHub issues](https://github.com/migueljbeltran/deadlock-tracker/issues). Do not post tokens or personal information in public issues. Optional support is available through [Ko-fi](https://ko-fi.com/trazen).

This is an independent community project, not affiliated with or endorsed by Valve. Deadlock, Steam, and related game assets belong to their respective rights holders. No open-source license is implied by this README; review the repository's licensing before redistribution.
