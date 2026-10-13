# Privacy and legal review

Reviewed October 13, 2026. This is an operational checklist, not a determination that the site complies with every applicable law.

## Current facts

- The operator currently runs this independent project from the Philippines; the server's region does not by itself determine legal jurisdiction.
- Public privacy contact approved by the operator: `trazenmain@gmail.com`.
- No account registration, Steam login, passwords, payment-card collection, or session replay is implemented.
- The app displays and caches public player identifiers, names, avatars, matches, and statistics. Public availability does not make identifying information cease to be personal data.
- IP addresses support Redis rate limits. Searches and player identifiers can appear in application logs and cache keys.
- Recent player selections are stored in browser local storage; a Clear control is available.
- Vercel hosts the app and receives analytics. Upstash stores snapshots and counters. Sentry receives error/performance diagnostics when configured. Browsers load third-party avatars/game images directly.
- Ko-fi is an external optional-support link; payment handling occurs there.

## Changes prepared

The privacy notice describes these categories, purposes, providers, overseas processing, retention limits, local storage, requests, and the operator's contact. Site terms describe data accuracy, acceptable use, third-party rights, optional support, and contact. Neither page claims certification or universal compliance.

## Decisions to complete before treating this as a compliance sign-off

1. Review Philippine Data Privacy Act applicability, the appropriate lawful grounds for each processing purpose, controller duties, and whether NPC registration or a designated privacy officer is required for this project's circumstances. Do not assume a hobby project is automatically exempt.
2. Verify actual Vercel/Sentry log and event retention, provider account regions, access controls, and backup policies. Match the notice to any later configuration changes.
3. Decide whether to offer analytics/monitoring preferences or prior consent for audiences where required. Cookie-free analytics does not by itself establish that all collection is exempt; local storage and similar technologies also need assessment. A cosmetic banner that does not control collection is insufficient.
4. Define a private request workflow: proportionate verification, upstream correction/referral, cache invalidation, and any suppression needed to prevent removed data being immediately fetched again. Do not promise upstream deletion or publish request details in GitHub issues.
5. Review international applicability if offering the service to or monitoring visitors in other jurisdictions. California privacy requirements depend on applicability criteria, not merely a California server. Seek qualified advice for a formal legal sign-off.
6. Check Steam and community API terms and game-asset usage. A Valve disclaimer does not grant intellectual-property rights. Choose a repository license only after deciding what rights can be granted; do not imply the game assets are owned by this project.
7. Reassess notices and any consent requirements before adding accounts, ads, embedded payments, replay, email marketing, or new telemetry. Do not collect children's information intentionally without assessing relevant requirements.
8. Confirm hosting eligibility as well as quotas. Vercel Hobby is restricted to non-commercial personal use; its current fair-use rules explicitly permit asking for donations. Keep Ko-fi support voluntary and separate from paid features or products. Reassess before adding ads, paid features, commercial sponsorships, or payment in exchange for services; choose a suitable alternative host if the project no longer qualifies.

## Private request procedure

- Monitor `trazenmain@gmail.com`; enable account two-factor authentication and keep access limited to the operator.
- Record the receipt date, affected profile URL, requested action, verification needed, and outcome in a private record. If records are kept locally, use the ignored `.privacy-requests/` directory; do not commit them or attach them to public issues. Git ignores are not encryption or access control.
- Assess the applicable response deadline and lawful basis for the request. Acknowledge receipt and use proportionate verification; do not routinely request government identification or Steam credentials.
- Investigate the source and affected application/provider records. Coordinate corrections upstream where needed. Before promising removal, implement and verify any necessary suppression across profiles, search, and leaderboards so cache regeneration does not undo the action.
- Explain what was changed, which third-party records you cannot control, and any retention required by law. Retain only necessary correspondence under a documented retention period.
- For a suspected breach, restrict access, preserve relevant evidence securely, revoke exposed credentials, and assess applicable notification duties. A normal bug report is not a substitute for an incident response.

## Primary references

- [Philippine Data Privacy Act](https://privacy.gov.ph/data-privacy-act-/)
- [NPC implementing rules](https://privacy.gov.ph/implementing-rules-regulations-data-privacy-act-2012/)
- [Vercel Web Analytics data collection](https://vercel.com/docs/analytics/privacy-policy)
- [Sentry privacy notice](https://sentry.io/privacy/)
- [ICO guidance on storage/access technologies](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-storage-and-access-technologies/)
- [California Attorney General CCPA applicability](https://www.oag.ca.gov/privacy/ccpa)
- [Steam Web API terms](https://steamcommunity.com/dev/apiterms)
- [Vercel Hobby eligibility](https://vercel.com/docs/plans/hobby)
- [Vercel fair-use and donation rules](https://vercel.com/docs/limits/fair-use-guidelines)

Validate current rules and provider practices when revisiting this checklist.
