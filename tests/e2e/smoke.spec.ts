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
  const input = page.getByPlaceholder("Seek a soul...");
  await expect(input).toBeVisible();
  await input.fill("test player");
  await expect(input).toHaveValue("test player");
});
