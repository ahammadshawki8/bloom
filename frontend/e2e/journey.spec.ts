import { expect, test } from "@playwright/test";

// The judge's path: landing -> studio -> sample face -> try a look -> save ->
// ask family -> family votes -> the heart comes back.
test("a full Bloom journey on the sample face", async ({ page, context }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Choose your hair before treatment does.");

  await page.getByRole("main").getByRole("button", { name: "Open your studio" }).first().click();
  await expect(page).toHaveURL(/\/studio$/);
  await page.getByRole("button", { name: "Look around with a sample face" }).click();
  await page.getByRole("link", { name: "Try a look" }).click();

  await expect(page).toHaveURL(/\/studio\/try/);
  const firstLook = page.getByRole("main").locator("ul li button").first();
  await firstLook.click();
  await expect(page.getByRole("button", { name: "Save this look" })).toBeVisible({ timeout: 15_000 });
  await page.getByRole("button", { name: "Save this look" }).click();
  await expect(page.getByText("Saved to your looks.")).toBeVisible();

  await page.goto("/studio/saved");
  await page.locator('button[aria-label^="Select"]').first().click();
  await page.getByRole("button", { name: "Ask family" }).click();
  await page.getByPlaceholder("Sara").fill("Sara");
  await page.getByRole("button", { name: "Create a private link" }).click();
  await expect(page.getByRole("dialog", { name: "Your link is ready" })).toBeVisible();
  const url = await page.getByRole("dialog").locator("span[title]").first().getAttribute("title");
  expect(url).toMatch(/\/s\/\w+/);

  // Family opens the link (same browser storage in preview mode)
  const family = await context.newPage();
  await family.goto(url!);
  await expect(family.getByText("Sara would love your help")).toBeVisible();
  await family.locator('button[aria-label^="Choose"]').first().click();
  await family.getByPlaceholder("Mum").fill("Mum");
  await family.getByRole("button", { name: /Send my heart/ }).click();
  await expect(family.getByText("Sent with love")).toBeVisible();

  await page.goto("/studio/saved");
  await expect(page.getByText("1 reply")).toBeVisible();
});

test("every studio page has no horizontal scroll", async ({ page }) => {
  for (const path of ["/", "/studio", "/studio/passport", "/studio/passport/new", "/studio/try", "/studio/saved", "/studio/privacy", "/offline"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow, path).toBeLessThanOrEqual(1);
  }
});
