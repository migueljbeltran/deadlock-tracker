# Public rollout checklist

This is a staged launch plan, not a guarantee of capacity or free hosting. The initial daily-visitor target is undecided.

## Before releasing this update

- Review and deploy the lock-cleanup fix, current ranking integration, README, and legal notices from the same tested commit.
- Run the opt-in live-data browser suite against the preview and then production. Verify real hero/item statistics, leaderboard badges, a ranked profile, privacy contact, and terms links.
- Confirm Production and Preview Redis credentials refer to active databases, with read/write tokens stored as secrets. Confirm no private token appears in browser bundles or public logs.
- Confirm the project qualifies for the hosting plan's permitted use, including how optional support is handled; quota compliance alone is insufficient.
- Enrich only linked leaderboard accounts. Links inferred from provider candidates and profile/hero signals can still be wrong when names collide; position on the regional leaderboard is not a badge tier. Protected/missing rank records must remain unavailable.

## Observe the first day and week

- Record traffic, error rate, response time, and CDN cache behavior before estimating capacity.
- Track Vercel active CPU, function invocations, ISR writes, transfer, and Upstash storage/commands against ordinary plan allowances. Limits and usage can be shared with other projects; a temporary allowance is not the long-term budget.
- Inspect rank API failures and upstream rate limiting. Visible leaderboard pages use one cached batch of at most 50 accounts; profiles use a separately cached rank lookup. Third-party uptime and quotas are dependencies.
- Compare incremental daily usage after the release, rather than counting historic usage from the old implementation as the new site's running cost. Keep a previous good deployment available for rollback.

## Before increasing traffic substantially

- Choose a daily visitor and peak-concurrency target from observed demand.
- Run a bounded load test locally or on infrastructure that permits it, with warm-cache and cold-cache cases. Vercel's fair-use rules prohibit load testing without authorization; obtain that authorization before testing a hosted preview. Measure latency, errors, memory, upstream calls, and rate-limit behavior. Mock upstream APIs while discovering limits, rather than stressing their public services.
- Reduce hot-path work or move workloads if projected usage exceeds the normal free budget. A successful build and browser test are functional evidence, not a load test.
- Complete the retention, consent, rights-request, and provider review in [legal-review.md](legal-review.md). The notice currently describes an operator in the Philippines. Reassess the operator location and applicable rules if that changes; creating the app or hosting in California is not, by itself, a compliance determination.

## References

- [Vercel Hobby plan](https://vercel.com/docs/plans/hobby)
- [Current rank and leaderboard API](https://api.deadlock-api.com/docs)
- [Hosting and Redis recovery](free-hosting.md)
