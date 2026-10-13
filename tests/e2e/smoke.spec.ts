import { expect, test } from "@playwright/test";

const routes = ["/", "/about", "/privacy"] as const;

for (const route of routes) {
  test(`${route} renders`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.ok()).toBe(true);
    await expect(page.locator("body")).toBeVisible();
  });
}

test("search input accepts text", async ({ page }) => {
  await page.goto("/");
  const input = page.getByRole("searchbox", { name: "Search for a Deadlock player" });
  await expect(input).toBeVisible();
  await input.fill("test player");
  await expect(input).toHaveValue("test player");
});

test("security headers block an external base URL while the homepage remains usable", async ({ page }) => {
  const response = await page.goto("/");
  const headers = response?.headers();
  expect(headers?.["content-security-policy"]).toContain("base-uri 'self'");
  expect(headers?.["content-security-policy"]).toContain("object-src 'none'");
  expect(headers?.["x-content-type-options"]).toBe("nosniff");
  const originalBase = await page.evaluate(() => document.baseURI);
  const afterInjection = await page.evaluate(() => {
    const base = document.createElement("base");
    base.href = "https://example.com/";
    document.head.appendChild(base);
    return document.baseURI;
  });
  expect(afterInjection).toBe(originalBase);
  await expect(page.getByRole("searchbox", { name: "Search for a Deadlock player" })).toBeVisible();
});

test("numeric player URLs use the shared shell and browser API", async ({ page }) => {
  await page.route("**/api/player/123", (route) => route.fulfill({
    json: {
      success: true,
      snapshot: {
        player: {
          steamid: "76561197960265851", personaname: "Shell Test Player",
          profileurl: "https://steamcommunity.com/profiles/76561197960265851",
          avatar: "/favicon.ico", avatarmedium: "/favicon.ico", avatarfull: "/favicon.ico",
          personastate: 0, communityvisibilitystate: 3,
        },
        heroStats: [], matches: [], metrics: null, rankEstimate: null,
        status: "complete", fetchedAt: "2026-10-13T10:00:00Z",
      },
      benchmark: null, isStale: false, shouldRefresh: false,
    },
  }));
  const response = await page.goto("/player/123");
  expect(response?.ok()).toBe(true);
  await expect(page.getByRole("heading", { name: "Shell Test Player" })).toBeVisible();
  expect(page.url()).toContain("/player/123");
});

test("mobile navigation exposes its state and closes with Escape", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const menu = page.getByRole("button", { name: "Toggle navigation" });
  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(menu).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
