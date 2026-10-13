# Keeping dltracker on free hosting

## What the screenshot establishes

The team was paused for Fluid Active CPU after using 301% of its four-hour allowance (about 12 CPU hours). An earlier alert reports 300% of 200,000 ISR write units, and another reports exhausting 10 GB of Fast Origin Transfer. These are separate resources. The low CDN request count shown for the recent window does not explain the earlier spikes; use the Usage dashboard's historical date ranges and per-route breakdowns.

Vercel Hobby currently includes four active CPU hours per month. Hobby deployments can be paused after exceeding the free allowance. Vercel says most exhausted features become available again after 30 days. An old August pause still visible in October needs an account-level check; a code change alone cannot clear it.

Sources checked October 13, 2026: [Hobby plan](https://vercel.com/docs/plans/hobby), [plan behavior](https://vercel.com/docs/plans), [disabled deployment troubleshooting](https://vercel.com/docs/errors/deployment_disabled), [ISR usage](https://vercel.com/docs/incremental-static-regeneration/limits-and-pricing).

## Cost controls in this revision

| Path | How it is served |
| --- | --- |
| Homepage | Hourly ISR with compact monthly analytics; no dataset-size query |
| `/player/<numeric-id>` | A `beforeFiles` rewrite to one weekly static `/player` shell; browser loads the JSON API |
| Player API | One stable URL per account, CDN cache for 30 minutes; Redis retains a compact snapshot for seven days with daily freshness |
| Explicit player refresh | `?refresh=1` response is `no-store`; refresh action still enforces its cooldown and rate limit |
| Malformed player URLs | Existing dynamic route returns 404 |
| Matches | On-demand cached rendered page; large raw upstream metadata fetched without also writing it into Next's persistent fetch cache |
| Public analytics | Five normalized time ranges, hourly timestamp buckets, additive metrics combined per hero/rank tier; raw responses are not also cached |
| Redis and rate limiting | `no-store` REST commands; Next never caches a lock acquisition or an old Redis GET |
| Navigation | Prefetch disabled so a table or hero grid doesn't generate visits to every linked page |
| Images | Direct upstream CDN images; Vercel image transformations remain disabled |

Asset requests now use `https://api.deadlock-api.com/v1/assets/…`, as documented in the [current API reference](https://api.deadlock-api.com/docs); the previous asset hostname no longer resolved during verification. The app no longer requires Prisma or a SQL connection: its only SQL call was an unused health probe. The old schema is retained as a reference, and no external database contents are changed.

Player shells intentionally have generic, non-indexed metadata. Unknown numeric profiles show an in-page message while their API returns 404. This trades per-player server rendering for lower CPU use. Public analytics are cached snapshots, not real-time feeds. A cold upstream failure can still delay a refresh.

## Restore the existing Vercel project

1. In the existing team's Usage dashboard, select the window around the CPU pause. Check Active CPU, ISR writes, origin transfer, and the routes responsible. Check whether bots or repeated requests caused the spike. These are team-wide limits; include other projects.
2. Confirm the free allowance is available again. If the project remains disabled after the reset, use the deployment controls or Vercel support to clear the old pause. Do not enable a paid plan or paid add-ons to troubleshoot.
3. Deploy this revision to a preview first. Preserve the existing environment variables. Numeric player lookup and name search can use community-cached Steam profiles without a key; `STEAM_API_KEY` is optional for direct Steam identity and vanity URL resolution. Redis snapshot sharing and distributed rate limiting need the two Upstash REST variables. Never expose these as `NEXT_PUBLIC_*` variables.
4. Verify `/`, hero analytics and filters, items, regional leaderboards, a known player, manual refresh, and a known match. Verify that numeric player URLs serve the static shell and that repeated ordinary player API requests hit the CDN. Check `x-vercel-cache` and Vercel's function invocation logs in production; local development does not model the CDN.
5. Promote the verified deployment, retaining `dltracker.app` on the same project. Confirm the public domain actually returns the new deployment.
6. Compare resource use after 24 hours and after seven days. A four-hour monthly allowance averages about eight CPU minutes per day. Aim below half the monthly allowance to leave room for bursts. Check ISR writes and origin transfer separately; don't rely only on request counts.

Redis is a performance dependency in production. Without it, distributed snapshot sharing and rate limiting are unavailable. The application can still run, but it cannot be assumed to stay within free limits. Monitor Upstash's own storage and command quotas too. Application rate limits run inside functions and therefore cannot prevent every CPU invocation; use Vercel's available firewall controls for abusive traffic based on observed logs.

### Recovering a deleted Redis database

The October 13 production failure was a deleted Upstash database: its REST hostname returned `ENOTFOUND`. Failed lock writes were incorrectly treated as another refresh already being in progress. Cache locks now distinguish acquisition, contention, and unavailability. Redis commands have a two-second timeout, no automatic retries, and a 30-second outage backoff. Cold snapshots can rebuild from upstream during an outage; Next's persistent cache still stores compact public datasets. Existing stale snapshots remain usable, and only locks actually acquired by this request are released.

Create a new free Upstash Redis database and update `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in the Vercel project's Production and Preview environment settings. Then redeploy. Redis contains rebuildable data and rate-limit counters, so restoring old cached data is unnecessary. Do not publish the token or prefix it with `NEXT_PUBLIC_`.

Run `PLAYWRIGHT_LIVE_DATA=1` with `PLAYWRIGHT_BASE_URL` pointing to the deployment to check actual hero statistics, tier-list rows, item win rates, and leaderboard entries. These checks exercise live APIs and are opt-in. The outage hotfix passed 66 unit tests and all 12 browser checks against a production build with Redis intentionally unreachable, including five real-data checks.

## If real traffic still exceeds Hobby

A free platform change must match the workload. Cloudflare Pages serves static assets without charging for individual static requests, but Pages Functions inherit Workers limits. Workers Free currently limits dynamic requests and CPU per invocation; moving this server-rendered Next.js app there unchanged is not a guaranteed free solution.

The stronger migration is a static frontend plus public browser requests to Deadlock API where CORS permits them, with a small cached proxy only for Steam identity and secret-backed operations. It requires replacing server actions and SSR data paths, verifying provider limits, and testing API availability/CORS. Keep API keys on the server. Do not change DNS until a complete replacement works on its preview URL.

References: [Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/).

This revision reduces identifiable waste. It does not establish a measured production budget or guarantee free hosting at arbitrary traffic levels.

## Security protections

Steam request errors and retry logs retain only the endpoint path, never the API key or query string. Native fetch error causes are discarded at this boundary because they can contain credential-bearing URLs.

Redis normally provides distributed API rate limiting. If Redis is missing, errors, or returns the SDK's fail-open timeout result, a bounded per-instance fixed-window limiter takes over. It uses the existing endpoint budgets, caps tracking at 10,000 identifiers, rejects new identifiers at capacity, and retries Redis after 30 seconds. This limits abuse on each running instance; it cannot enforce one global budget across serverless instances or survive cold starts. Keep Redis configured in production for distributed protection.

An enforced Content Security Policy restricts base URLs and form submissions to this origin and blocks embedded objects and framing. Script/resource restrictions remain report-only pending compatibility testing with generated Next scripts, Sentry, and Vercel Analytics. Environment files are ignored by Git except `.env.example`.

## Dependency audit

The lockfile resolves compatible updates including Next.js 16.4.0, Sentry 10.76.2, and Vitest 4.1.11. The full `npm audit --audit-level=high` reports zero vulnerabilities, including development dependencies. The full-audit CI gate remains enabled.

Two targeted overrides remediate lint dependencies: the 1.x `brace-expansion` dependency resolves to patched 1.1.21 or later, and only `@next/eslint-plugin-next`'s `fast-glob` dependency is replaced with `npm:tinyglobby@0.2.17`. Next 16.4.0 uses `globSync(pattern, { onlyDirectories: true })`, which tinyglobby supports, avoiding the unpatched `braces` dependency without downgrading Next or disabling its lint rules. Compatibility tests exercise actual Next link linting with directory, array, and brace-pattern root settings. Recheck this override when upgrading the Next lint plugin; remove it once upstream drops or fixes the vulnerable dependency chain.

## Local verification completed

Production build and type checks, lint, 52 unit tests, and six Chromium browser checks passed. Live community-data browser visits also passed for heroes, tier lists, items, hero details, the Asia leaderboard, a real player profile, and a real match. Player name search returned and rendered community results without a Steam key. Name search is fuzzy and the upstream corpus can omit an exact profile; numeric IDs are the more reliable lookup.

The subsequent security hardening passed 63 unit tests, lint, TypeScript checks, and seven Chrome browser checks, including enforcement of the base-URL policy while the homepage remained usable.

The build confirms `/` and `/player` are static. Desktop and mobile screenshots are saved in `docs/screenshots/homepage-revamp.png` and `docs/screenshots/homepage-mobile.png`. Local checks do not prove production CDN cache hits, a cleared Vercel pause, or monthly quota fit; those require the connected project and live usage measurements.

## Connected deployment attempt — October 13, 2026

Vercel account access was verified for `deadlock-tracker` in `miguel-beltran-projects`. A preview deployment of the tested local source to the existing project was rejected with HTTP 402, code `resource_creation_blocked`: “Your Team exceeded our fair use limits and has been blocked.” No deployment was created, and no plan, billing setting, domain, or production deployment was changed.

The account owner must resolve the team restriction before this project can accept a deployment. Suggested message for Vercel's available help channel:

> My Hobby team `miguel-beltran-projects` was paused after a CPU/ISR usage spike. I have prepared and tested fixes that use a shared static player shell, bounded compact analytics caches, stable cache URLs, and disabled speculative route prefetching. On October 13, deploying a preview to my existing `deadlock-tracker` project still returns HTTP 402 `resource_creation_blocked` (“Your Team exceeded our fair use limits and has been blocked”). Can you explain the remaining restriction and how to restore this team on Hobby without upgrading? I can provide the request ID `sin1:sfo1::tb6cz-1791894512789-b4b52787d28b`.
