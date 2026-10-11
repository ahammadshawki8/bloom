/** Record Bloom in the browser, then export full-colour MP4s and smooth GIF previews. */
import { chromium } from "playwright";
import gifsicle from "gifsicle";
import { copyFile, mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const origin = process.env.BLOOM_CAPTURE_URL ?? "http://localhost:3000";
const only = process.argv[2];
const output = resolve("docs/assets/devpost-gifs");
const scratch = await mkdtemp(join(tmpdir(), "bloom-devpost-capture-"));
const browser = await chromium.launch({ headless: true });

async function newPage() {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    recordVideo: { dir: scratch, size: { width: 1280, height: 900 } },
  });
  // A small recording clock keeps Chromium emitting frames while the UI is still.
  // The corner is cropped from exports. The clock is recreated after navigation.
  await context.addInitScript(() => {
    document.addEventListener("DOMContentLoaded", () => {
      const dot = document.createElement("span");
      dot.setAttribute("aria-hidden", "true");
      Object.assign(dot.style, { position: "fixed", right: "0", bottom: "0", width: "12px", height: "12px", zIndex: "2147483647" });
      document.body.append(dot);
      let light = false;
      window.setInterval(() => { dot.style.backgroundColor = (light = !light) ? "#fff" : "#000"; }, 40);
    });
  });
  return { context, page: await context.newPage() };
}

async function sample(page) {
  await page.goto(`${origin}/studio`);
  await page.getByRole("button", { name: "Look around with a sample face" }).click();
  await page.getByRole("link", { name: "Try a look" }).waitFor();
}

async function firstLook(page) {
  await page.getByRole("link", { name: "Try a look" }).click();
  const first = page.locator("ul.snap-x li button").first();
  await first.waitFor();
  await first.click();
  await page.getByRole("button", { name: "Save this look" }).waitFor();
}

function run(program, args) {
  const result = spawnSync(program, args, { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 });
  if (result.status !== 0) throw new Error(`${program} failed: ${result.stderr || result.error}`);
  return result.stdout.trim();
}

async function capture(name, context, page, events, targetSeconds = 8, leadSeconds = 0) {
  await page.waitForTimeout(1500);
  const started = Date.now();
  for (const [frame, action] of Object.entries(events)) {
    const due = started + Number(frame) * 250;
    if (Date.now() < due) await page.waitForTimeout(due - Date.now());
    await action();
  }
  const end = started + targetSeconds * 1000;
  if (Date.now() < end) await page.waitForTimeout(end - Date.now());
  await page.evaluate(() => {
    const dot = document.querySelector('span[aria-hidden="true"][style*="2147483647"]');
    if (dot) dot.style.backgroundColor = "#f00";
  });
  await page.waitForTimeout(120);
  const recordedSeconds = (Date.now() - started) / 1000;
  const video = page.video();
  await context.close();
  const source = await video.path();
  const fullDuration = Number(run("ffprobe", [
    "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", source,
  ]));
  const sourceSpan = recordedSeconds + leadSeconds;
  const start = Math.max(0, fullDuration - sourceSpan);
  const trim = `trim=start=${start.toFixed(3)}:duration=${sourceSpan.toFixed(3)},setpts=PTS-STARTPTS,setpts=PTS*${(recordedSeconds / sourceSpan).toFixed(6)}`;
  const mp4 = join(output, `${name}.mp4`);
  const gif = join(output, `${name}.gif`);
  const palette = join(scratch, `${name}-palette.png`);

  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", source,
    "-vf", `${trim},crop=1264:884:0:0,fps=25,format=yuv420p`, "-an", "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-movflags", "+faststart", mp4]);
  const gifWidth = name === "check-the-render" ? 1024 : 1120;
  const gifFrames = `${trim},crop=1264:884:0:0,fps=18,scale=${gifWidth}:-2:flags=lanczos`;
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", source,
    "-vf", `${gifFrames},palettegen=max_colors=256:stats_mode=full:reserve_transparent=0`, palette]);
  run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-i", source, "-i", palette,
    "-filter_complex", `[0:v]${gifFrames}[video];[video][1:v]paletteuse=dither=sierra2_4a`, "-loop", "0", gif]);
  const optimized = join(scratch, `${name}-optimized.gif`);
  run(gifsicle, ["-O3", "--lossy=30", gif, "-o", optimized]);
  await copyFile(optimized, gif);
  process.stdout.write(`${name}: ${recordedSeconds.toFixed(1)} seconds, source ${fullDuration.toFixed(1)} seconds, trim from ${start.toFixed(1)}, recorded MP4 and 18 fps GIF\n`);
}

async function main() {
  await mkdir(output, { recursive: true });

  if (!only || only === "hair-passport") {
    const { context, page } = await newPage();
    await page.goto(`${origin}/studio`);
    await capture("hair-passport", context, page, {
      4: () => page.getByRole("button", { name: "Look around with a sample face" }).click(),
      15: () => page.getByRole("link", { name: "Open passport" }).click(),
    });
  }

  if (!only || only === "find-and-try") {
    const { context, page } = await newPage();
    await sample(page);
    await page.getByRole("link", { name: "Try a look" }).click();
    await page.locator("ul.snap-x li button").first().waitFor();
    await capture("find-and-try", context, page, {
      3: () => page.locator("ul.snap-x li button").first().click(),
      13: () => page.locator("ul.snap-x li button").nth(1).click(),
      21: () => page.getByRole("tab", { name: "Wraps" }).click(),
      25: () => page.locator("ul.snap-x li button").first().click(),
    }, 8, 0.9);
  }

  if (!only || only === "check-the-render") {
    const { context, page } = await newPage();
    await sample(page);
    await firstLook(page);
    await capture("check-the-render", context, page, {
      4: () => page.getByRole("button", { name: "Compare with your own hair" }).click(),
      11: async () => { const slider = page.getByRole("slider", { name: "Compare your hair with the try-on" }); await slider.focus(); await slider.press("ArrowRight"); await slider.press("ArrowRight"); await slider.press("ArrowRight"); },
      18: async () => { const slider = page.getByRole("slider", { name: "Compare your hair with the try-on" }); await slider.press("ArrowLeft"); await slider.press("ArrowLeft"); await slider.press("ArrowLeft"); await slider.press("ArrowLeft"); await slider.press("ArrowLeft"); },
      25: () => page.getByRole("button", { name: "Stop comparing" }).click(),
    });
  }

  if (!only || only === "choose-together") {
    const { context, page } = await newPage();
    await sample(page);
    await firstLook(page);
    await page.getByRole("button", { name: "Save this look" }).click();
    await page.locator("ul.snap-x li button").nth(1).click();
    await page.getByRole("button", { name: "Save this look" }).click();
    await page.getByRole("link", { name: "Saved" }).click();
    await page.locator('button[aria-label^="Select"]').first().waitFor();
    await page.waitForTimeout(1000);
    let shareUrl;
    await capture("choose-together", context, page, {
      3: () => page.locator('button[aria-label^="Select"]').first().click(),
      6: () => page.locator('button[aria-label^="Select"]').first().click(),
      9: () => page.getByRole("button", { name: "Compare" }).click(),
      16: () => page.getByRole("dialog", { name: "Side by side" }).getByRole("button", { name: "Close" }).click(),
      18: () => page.getByRole("button", { name: "Ask family" }).click(),
      21: () => page.getByPlaceholder("Sara").fill("Sara"),
      23: () => page.getByRole("button", { name: "Create a private link" }).click(),
      28: async () => {
        shareUrl = await page.getByRole("dialog", { name: "Your link is ready" }).locator("span[title]").first().getAttribute("title");
        await page.goto(shareUrl);
      },
      32: () => page.locator('button[aria-label^="Love"]').first().click(),
      35: () => page.getByPlaceholder("Mum").fill("Mum"),
      37: async () => {
        await page.getByRole("button", { name: /^Send to/ }).click();
        await page.evaluate(() => window.scrollBy(0, -40));
      },
    }, 10, 0.9);
  }

  if (!only || only === "explore-without-camera") {
    const { context, page } = await newPage();
    await page.goto(origin);
    await capture("explore-without-camera", context, page, {
      4: () => page.getByRole("main").getByRole("button", { name: "Open your studio" }).first().click(),
      13: () => page.getByRole("button", { name: "Look around with a sample face" }).click(),
      21: () => page.getByRole("link", { name: "Try a look" }).click(),
      27: () => page.locator("ul.snap-x li button").first().click(),
    }, 9);
  }
}

try {
  await main();
} finally {
  await browser.close();
  if (resolve(scratch).startsWith(resolve(tmpdir()) + "\\")) await rm(scratch, { recursive: true, force: true });
}
