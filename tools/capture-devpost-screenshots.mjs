/** Capture seven 4:3 Devpost screenshots from Bloom's sample journey. */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const origin = process.env.BLOOM_CAPTURE_URL ?? "http://localhost:3000";
const output = resolve("docs/assets/devpost-screenshots");
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1080 },
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
});
const page = await context.newPage();

async function capture(name) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  await page.screenshot({ path: resolve(output, `${name}.png`), animations: "disabled" });
  process.stdout.write(`${name}.png\n`);
}

async function pickStyle(index) {
  await page.locator("ul.snap-x li button").nth(index).click();
  await page.getByRole("button", { name: "Save this look" }).waitFor({ timeout: 20_000 });
}

try {
  await mkdir(output, { recursive: true });

  await page.goto(origin);
  await page.waitForTimeout(2800);
  await capture("01-landing-page");

  await page.goto(`${origin}/studio`);
  await page.getByRole("button", { name: "Look around with a sample face" }).click();
  await page.getByRole("link", { name: "Open passport" }).click();
  await page.waitForTimeout(3500);
  await capture("02-hair-passport");

  await page.goto(`${origin}/studio`);
  await page.getByLabel("What would you like?").fill("soft waves, close to my colour");
  await page.getByRole("button", { name: "Ask", exact: true }).click();
  const guide = page.getByRole("dialog", { name: "Your Bloom guide" });
  await guide.getByRole("link", { name: /Try it on/ }).first().waitFor({ timeout: 60_000 });
  await capture("03-personal-guide");

  await page.goto(`${origin}/studio/try?tab=wigs`);
  await page.locator("ul.snap-x li button").first().waitFor();
  await pickStyle(0);
  await page.getByRole("button", { name: "Compare with your own hair" }).click();
  await capture("04-wig-try-on-and-fit");
  await page.getByRole("button", { name: "Stop comparing" }).click();
  await page.getByRole("button", { name: "Save this look" }).click();

  await pickStyle(1);
  await page.getByRole("button", { name: "Save this look" }).click();
  await page.getByRole("tab", { name: "Wraps" }).click();
  await pickStyle(0);
  await page.getByRole("radiogroup", { name: "Colour" }).getByRole("radio", { name: "Sage Green" }).click();
  await page.waitForTimeout(1000);
  await page.getByRole("button", { name: "Save this look" }).click();
  await page.getByRole("tab", { name: "Brows & lashes" }).click();
  await page.waitForTimeout(3500);
  await capture("05-wrap-and-beauty-options");

  await page.goto(`${origin}/studio/saved`);
  await page.locator('button[aria-label^="Select"]').first().waitFor();
  await page.locator('button[aria-label^="Select"]').first().click();
  await page.locator('button[aria-label^="Select"]').first().click();
  await page.getByRole("button", { name: "Ask family" }).click();
  await page.getByPlaceholder("Sara").fill("Sara");
  await page.getByRole("button", { name: "Create a private link" }).click();
  const shareUrl = await page.getByRole("dialog", { name: "Your link is ready" }).locator("span[title]").first().getAttribute("title");
  if (!shareUrl) throw new Error("The family link was not created.");
  const family = await context.newPage();
  await family.goto(shareUrl);
  await family.locator('button[aria-label^="Love"]').first().click();
  await family.getByPlaceholder("Mum").fill("Mum");
  await family.getByPlaceholder("The first one is so you.").fill("The first one looks so much like you.");
  await family.getByRole("button", { name: /^Send to/ }).click();
  await family.close();
  await page.goto(`${origin}/studio/saved`);
  await page.getByText("1 reply").waitFor({ timeout: 15_000 });
  await capture("06-saved-looks-and-family-vote");

  await page.getByRole("link", { name: "This is the one" }).last().click();
  await page.getByRole("heading", { name: "Pay less, or nothing at all" }).waitFor();
  await capture("07-choice-and-next-steps");
} finally {
  await browser.close();
}
