import { expect, test } from "@playwright/test";

// Visual review captures. Opt-in: SCREENS=1. Writes to ../.playwright-mcp/
test.skip(!process.env.SCREENS, "set SCREENS=1 to capture review screenshots");
test.setTimeout(180_000);
const out = (n: string) => `../.playwright-mcp/review-${n}.png`;

test("capture", async ({ page, context }, info) => {
  const tag = info.project.name;
  await page.goto("/studio");
  await page.getByRole("button", { name: "Look around with a sample face" }).click();
  await page.screenshot({ path: out(`${tag}-home`), fullPage: true });

  await page.getByLabel("What would you like?").fill("soft waves, close to my colour");
  await page.getByRole("button", { name: "Ask" }).click();
  const dialog = page.getByRole("dialog", { name: "Your Bloom guide" });
  await expect(dialog.getByRole("link", { name: /Try it on/ }).first()).toBeVisible({ timeout: 60_000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: out(`${tag}-guide`) });
  await dialog
    .getByRole("link", { name: /Try it on/ })
    .first()
    .click();
  await expect(page.getByRole("button", { name: "Save this look" })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Save this look" }).click();
  await page.getByRole("main").locator("ul li button").nth(2).click();
  await expect(page.getByRole("button", { name: "Save this look" })).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: "Save this look" }).click();
  await page.goto("/studio/try?tab=brows");
  await page.getByRole("button", { name: /Wispy/ }).click();
  await page.waitForTimeout(4000);
  await page.screenshot({ path: out(`${tag}-brows`), fullPage: true });

  await page.goto("/studio/saved");
  const sel = page.locator('button[aria-label^="Select"]');
  await sel.nth(0).click();
  await sel.nth(0).click();
  await page.getByRole("button", { name: "Ask family" }).click();
  await page.getByPlaceholder("Sara").fill("Sara");
  await page.getByRole("button", { name: "Create a private link" }).click();
  const url = await page.getByRole("dialog").locator("span[title]").first().getAttribute("title");
  const fam = await context.newPage();
  await fam.goto(url!);
  await fam.locator('button[aria-label^="Love"]').first().click();
  await fam.locator('button[aria-label$="not for her"]').nth(1).click();
  await fam.getByPlaceholder("Mum").fill("Mum");
  await fam.mouse.move(2, 2);
  await fam.waitForTimeout(700);
  await fam.screenshot({ path: out(`${tag}-family`), fullPage: true });
  await fam.getByRole("button", { name: /^Send to/ }).click();
  await expect(fam.getByText("Sent with love")).toBeVisible();
  await page.goto("/studio/saved");
  await page.getByRole("combobox").selectOption("family");
  await page.waitForTimeout(1500);
  await page.screenshot({ path: out(`${tag}-saved`), fullPage: true });
});
