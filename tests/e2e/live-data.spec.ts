import { expect, test } from "@playwright/test";

// Opt in for preview/production checks; these must exercise real upstream data,
// not mocked responses or just a successful HTTP status and page shell.
test.describe("live data pages", () => {
  test.skip(process.env.PLAYWRIGHT_LIVE_DATA !== "1", "Set PLAYWRIGHT_LIVE_DATA=1 to verify real datasets");
  test.describe.configure({ mode: "serial", timeout: 90_000 });

  test("homepage meta watch contains hero statistics", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Hero statistics are temporarily unavailable.", { exact: false })).toHaveCount(0);
    await expect(page.locator('main a[href^="/heroes/"]').filter({ hasText: "Win rate" }).first()).toBeVisible({ timeout: 60_000 });
  });

  for (const [path, heading] of [["/heroes", "Heroes"], ["/heroes/tier-list", "Hero Tier List"]]) {
    test(`${path} displays actual hero rows and statistics`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible({ timeout: 60_000 });
      await expect.poll(() => page.locator('main a[href^="/heroes/"]').count()).toBeGreaterThan(10);
      await expect(page.locator("main")).toContainText(/\d+\.\d+%/);
    });
  }

  test("items contains names and win rates", async ({ page }) => {
    await page.goto("/items");
    await expect(page.getByRole("heading", { name: "Items", exact: true })).toBeVisible({ timeout: 60_000 });
    await expect(page.locator("main")).toContainText(/\d+\.\d+%/, { timeout: 60_000 });
    await expect(page.getByText("No items found", { exact: true })).toHaveCount(0);
  });

  test("leaderboard API and UI contain player entries", async ({ page, request }) => {
    const response = await request.get("/api/leaderboard?region=Asia&page=1");
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body.entries.length).toBeGreaterThan(10);
    expect(body.entries[0].account_name).toBeTruthy();
    await page.goto("/leaderboard?region=Asia");
    // API and SSR requests can straddle an upstream refresh. Check populated
    // standings rather than requiring independently fetched snapshots to agree.
    await expect.poll(() => page.locator("main table tbody tr").count(), { timeout: 60_000 }).toBeGreaterThan(10);
    const rankedEntry = body.entries.find((entry: { ranked_rank?: number | null; profileAccountId?: number | null }) =>
      entry.ranked_rank != null && entry.ranked_rank > 0 && entry.profileAccountId != null);
    expect(rankedEntry).toBeTruthy();
    await expect(page.locator("main table tbody tr td:nth-child(3) img").first()).toBeVisible({ timeout: 60_000 });
    await page.goto(`/player/${rankedEntry.profileAccountId}`);
    await expect(page.getByText("Latest ranked match", { exact: true })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText("(Estimated)", { exact: true })).toHaveCount(0);
  });
});
