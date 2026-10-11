import { expect, test } from "@playwright/test";
import path from "node:path";

// Spends real YouCam units (about 17). Opt-in: LIVE_YOUCAM=1 with the backend running.
test.skip(!process.env.LIVE_YOUCAM, "set LIVE_YOUCAM=1 to run against the real YouCam API");
test.setTimeout(240_000);

test("a real passport and a real try-on through the backend", async ({ page }, info) => {
  test.skip(info.project.name !== "desktop", "run once");
  await page.goto("/studio/passport/new");
  await page.getByRole("button", { name: "Begin" }).click();
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /photo/i }).click();
  await (await chooser).setFiles(path.resolve(process.cwd(), "../docs/spike/spike-inputs/src_face_reshape_01_85c8ffc055.jpg"));
  await page.getByRole("button", { name: "Skip the side photos" }).click();
  await page.getByRole("button", { name: "Skip and finish" }).click();
  await expect(page.getByText("your hair, kept")).toBeVisible({ timeout: 120_000 });
  await expect(page.getByText(/YouCam face analyzer/i).first()).toBeVisible();
  await page.getByRole("button", { name: "Save and see my matches" }).click();
  await expect(page).toHaveURL(/\/studio\/try/);
  await page.getByRole("main").locator("ul li button").first().click();
  await expect(page.locator('img[src*="results%2F"], img[src*="/results/"]').first()).toBeVisible({ timeout: 120_000 });
  await expect(page.getByText(/Fit score/)).toBeVisible();
});
