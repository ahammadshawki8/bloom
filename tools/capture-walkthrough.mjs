/**
 * Records Bloom's product walkthrough from the live site in a phone-sized
 * browser, for the demo video (video/). Each scene becomes a crisp MP4 plus a
 * JSON file of step markers, so the edit can cut on exact moments.
 *
 *   node tools/capture-walkthrough.mjs [scene]
 *   DEVICE=desktop node tools/capture-walkthrough.mjs [scene]   (1440 x 810 at 4/3 = 1920 x 1080)
 *
 * The camera scene feeds video-assets/capture/camera.y4m to Chromium as the
 * phone camera, so Bloom's real camera guide and MediaPipe framing run on it.
 * Every analysis and try-on is a live call to the production API.
 */
import { chromium, devices } from "playwright";
import { mkdir, writeFile, rm, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const ORIGIN = process.env.BLOOM_URL ?? "https://bloom-nourinrichi2026-9069.vercel.app";
const DESKTOP = process.env.DEVICE === "desktop";
const OUT = resolve(DESKTOP ? "video/public/walkthrough-desktop" : "video/public/walkthrough");
const WORK = resolve("video-assets/capture");
const STATE = join(WORK, DESKTOP ? "state-desktop.json" : "state.json");
const PHONE = DESKTOP
  ? { viewport: { width: 1440, height: 810 }, deviceScaleFactor: 4 / 3 }
  : { ...devices["iPhone 14 Pro"], viewport: { width: 393, height: 852 }, deviceScaleFactor: 3 };
const SIZE = DESKTOP ? { w: 1920, h: 1080 } : { w: 1179, h: 2556 };
/** The natural pause after each stage, so viewers can take it in. */
const BEAT = 2200;
const only = process.argv[2];

const browser = await chromium.launch({
  headless: true,
  args: [
    // without this the screencast arrives at CSS pixels; with it, at full device pixels
    `--force-device-scale-factor=${DESKTOP ? 4 / 3 : 3}`,
    "--use-fake-ui-for-media-stream",
    "--use-fake-device-for-media-stream",
    `--use-file-for-fake-video-capture=${join(WORK, "camera.y4m")}`,
  ],
});

async function phone({ fresh = false } = {}) {
  const context = await browser.newContext({
    ...PHONE,
    permissions: ["camera"],
    storageState: !fresh && existsSync(STATE) ? STATE : undefined,
  });
  // The rules forbid third-party trademarks in the video: blur retailer names
  // wherever they appear, as the page renders.
  await context.addInitScript((names) => {
    const re = new RegExp(names.join("|"), "g"); // plain names, nothing to escape
    const blur = (root) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const hits = [];
      while (walker.nextNode()) if (re.test(walker.currentNode.nodeValue) && !walker.currentNode.parentElement?.dataset.blurred) hits.push(walker.currentNode);
      for (const node of hits) {
        re.lastIndex = 0;
        const span = document.createElement("span");
        span.dataset.blurred = "1";
        span.style.filter = "blur(5px)";
        span.textContent = node.nodeValue;
        node.replaceWith(span);
      }
    };
    new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => n.nodeType === 1 ? blur(n) : n.parentElement && blur(n.parentElement)))).observe(document, { childList: true, subtree: true, characterData: true });
    document.addEventListener("DOMContentLoaded", () => blur(document.body));
  }, ["Godiva's Secret Wigs", "Suburban Turban", "EBeauty"]);
  const page = await context.newPage();
  return { context, page };
}

/** Records the page with CDP screencast frames (full device pixels). */
async function record(page, name, steps) {
  const cdp = await page.context().newCDPSession(page);
  const frames = [];
  const marks = [];
  let t0 = null;
  cdp.on("Page.screencastFrame", async ({ data, metadata, sessionId }) => {
    t0 ??= metadata.timestamp;
    frames.push({ data, t: metadata.timestamp - t0 });
    await cdp.send("Page.screencastFrameAck", { sessionId }).catch(() => {});
  });
  await cdp.send("Page.startScreencast", { format: "jpeg", quality: 90, maxWidth: SIZE.w, maxHeight: SIZE.h });
  const started = Date.now() / 1000;
  const mark = (label) => marks.push({ label, t: Date.now() / 1000 - started });
  // keep frames flowing: a near-invisible 1px dot that repaints every frame
  await page.evaluate(() => {
    if (document.getElementById("__tick")) return;
    const d = document.createElement("div");
    d.id = "__tick";
    Object.assign(d.style, { position: "fixed", left: "0", top: "0", width: "1px", height: "1px", opacity: "0.02", zIndex: "2147483647", pointerEvents: "none" });
    document.documentElement.append(d);
    let on = false;
    const loop = () => { d.style.background = (on = !on) ? "#fff" : "#000"; requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }).catch(() => {});
  const tick = setInterval(() => {}, 1000);
  try {
    await steps(mark);
  } finally {
    clearInterval(tick);
    await page.waitForTimeout(400);
    await cdp.send("Page.stopScreencast").catch(() => {});
  }
  await writeClip(name, frames, marks);
}

async function writeClip(name, frames, marks) {
  const dir = join(WORK, `frames-${name}`);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  let list = "";
  for (let i = 0; i < frames.length; i++) {
    const file = join(dir, `${String(i).padStart(5, "0")}.jpg`);
    await writeFile(file, Buffer.from(frames[i].data, "base64"));
    const next = frames[i + 1]?.t ?? frames[i].t + 0.5;
    list += `file '${file.replace(/\\/g, "/")}'\nduration ${Math.max(0.001, next - frames[i].t).toFixed(4)}\n`;
  }
  list += `file '${join(dir, `${String(frames.length - 1).padStart(5, "0")}.jpg`).replace(/\\/g, "/")}'\n`;
  await writeFile(join(dir, "list.txt"), list);
  await mkdir(OUT, { recursive: true });
  await writeFile(join(OUT, `${name}.json`), JSON.stringify({ duration: frames.at(-1)?.t ?? 0, marks }, null, 1));
  const r = spawnSync("ffmpeg", ["-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", join(dir, "list.txt"),
    "-vf", DESKTOP ? "fps=30,scale=1920:1080,format=yuv420p" : "fps=30,crop=1178:2556:0:0,format=yuv420p",
    "-c:v", "libx264", "-crf", "16", "-preset", "slow", join(OUT, `${name}.mp4`)], { encoding: "utf8" });
  if (r.status !== 0) throw new Error(r.stderr);
  await writeFile(join(OUT, `${name}.json`), JSON.stringify({ duration: frames.at(-1)?.t ?? 0, marks }, null, 1));
  process.stdout.write(`${name}: ${frames.length} frames, ${(frames.at(-1)?.t ?? 0).toFixed(1)} s, marks: ${marks.map((m) => `${m.label}@${m.t.toFixed(1)}`).join(", ")}\n`);
}

const wait = (page, ms) => page.waitForTimeout(ms);
const beat = (page, n = 1) => page.waitForTimeout(BEAT * n);
/** Types like a person, one character at a time, through fill() so React state keeps every character. */
async function type(locator, text, ms = 70) {
  await locator.click();
  for (let i = 1; i <= text.length; i++) {
    await locator.fill(text.slice(0, i));
    await locator.page().waitForTimeout(ms);
  }
}
const shot = (page, name) => page.screenshot({ path: join(WORK, `debug-${name}.png`) });

// ---------------------------------------------------------------- scenes

const SCENES = {
  /** 3.1: the camera guide, a photo, the live reading, the passport card. */
  async passport() {
    const { context, page } = await phone({ fresh: true });
    await page.goto(`${ORIGIN}/studio/passport/new`, { waitUntil: "networkidle" });
    await record(page, "passport", async (mark) => {
      mark("intro");
      await beat(page);
      await page.getByRole("button", { name: "Begin" }).click();
      mark("camera");
      // MediaPipe finds the face, the frame turns green, and the guide takes the photo itself
      await page.getByRole("status").filter({ hasText: "Perfect" }).waitFor({ timeout: 30000 });
      mark("framed");
      await shot(page, "camera");
      await page.getByRole("button", { name: "Skip the side photos" }).waitFor({ timeout: 15000 });
      mark("captured");
      await wait(page, 1500);
      mark("skip-sides");
      await page.getByRole("button", { name: "Skip the side photos" }).click();
      await wait(page, 900);
      await page.getByRole("button", { name: "Skip and finish" }).click();
      mark("reading");
      await page.getByRole("heading", { name: "Here's your hair, kept." }).waitFor({ timeout: 120000 });
      mark("reveal");
      await beat(page, 1.5);
      await shot(page, "reveal");
      await page.mouse.wheel(0, 450);
      await beat(page);
      await page.mouse.wheel(0, 450);
      await beat(page);
      mark("save");
      await page.getByRole("button", { name: "Save and see my matches" }).click();
      await page.waitForURL(/studio\/try/);
      await beat(page);
      mark("end");
    });
    await context.storageState({ path: STATE, indexedDB: true });
    await context.close();
  },

  /** 3.2: matched wigs, a live render on her photo, compare, the fit card, something new. */
  async tryon() {
    const { context, page } = await phone();
    await page.goto(`${ORIGIN}/studio/try`, { waitUntil: "networkidle" });
    const rail = page.locator("ul.snap-x li button");
    await rail.first().waitFor();
    await record(page, "tryon", async (mark) => {
      mark("rail");
      await beat(page);
      await rail.first().click();
      mark("rendering");
      await rendered(page);
      mark("rendered");
      await beat(page);
      await page.getByRole("button", { name: "Compare with your own hair" }).click();
      mark("compare");
      const slider = page.getByRole("slider", { name: "Compare your hair with the try-on" });
      if (await slider.isVisible().catch(() => false)) {
        await slider.focus();
        for (let i = 0; i < 6; i++) await slider.press("ArrowRight"), await wait(page, 120);
        await wait(page, 700);
        for (let i = 0; i < 10; i++) await slider.press("ArrowLeft"), await wait(page, 120);
        await wait(page, 900);
      } else {
        await wait(page, 2600);
      }
      await page.getByRole("button", { name: "Stop comparing" }).click();
      await beat(page, 0.6);
      mark("fit");
      await page.getByRole("region", { name: "How this look fits you" }).scrollIntoViewIfNeeded();
      await beat(page, 1.5);
      await shot(page, "fit");
      mark("save");
      await page.mouse.wheel(0, -2000);
      await wait(page, 900);
      await page.getByRole("button", { name: "Save this look" }).click();
      await wait(page, 1500);
      mark("something-new");
      await page.getByRole("radio", { name: "Something new" }).click();
      await wait(page, 1500);
      await rail.nth(1).click();
      await rendered(page);
      await page.mouse.wheel(0, -3000);
      mark("rendered-new");
      await beat(page, 1.3);
      await page.getByRole("button", { name: "Save this look" }).click();
      await wait(page, 1800);
      mark("end");
    });
    await context.storageState({ path: STATE, indexedDB: true });
    await context.close();
  },
};

Object.assign(SCENES, {
  /** 3.2b: something new. Already rendered once, so it comes back from the cache. */
  async tryonNew() {
    const { context, page } = await phone();
    await page.goto(`${ORIGIN}/studio/try`, { waitUntil: "networkidle" });
    const rail = page.locator("ul.snap-x li button");
    await rail.first().waitFor();
    await record(page, "tryon-new", async (mark) => {
      mark("start");
      await wait(page, 1000);
      await page.getByRole("radio", { name: "Something new" }).click();
      await wait(page, 1600);
      mark("tap");
      await rail.nth(1).click();
      await rendered(page);
      await page.mouse.wheel(0, -3000);
      mark("shown");
      await wait(page, 3500);
      mark("end");
    });
    await context.close();
  },

  /** 3.3: a soft wrap, then brows and lashes layered on top of her wig. */
  async layers() {
    const { context, page } = await phone();
    await page.goto(`${ORIGIN}/studio/try`, { waitUntil: "networkidle" });
    const rail = page.locator("ul.snap-x li button");
    await rail.first().waitFor();
    await record(page, "layers", async (mark) => {
      mark("start");
      await wait(page, 800);
      await page.getByRole("tab", { name: "Wraps" }).click();
      await wait(page, 1200);
      mark("wrap-tap");
      await rail.first().click();
      await rendered(page);
      await page.mouse.wheel(0, -3000);
      mark("wrap-shown");
      await beat(page, 1.2);
      await page.getByRole("button", { name: "Save this look" }).click();
      await wait(page, 1200);
      mark("wig");
      await page.getByRole("tab", { name: "Wigs" }).click();
      await wait(page, 900);
      await rail.first().click();
      await rendered(page);
      await wait(page, 1200);
      mark("brows-tab");
      await page.getByRole("tab", { name: "Brows & lashes" }).click();
      await wait(page, 1800);
      await shot(page, "brows-tab");
      mark("brow-tap");
      await page.locator("section, div").getByRole("button").filter({ hasText: /arch|straight|curved/i }).first().click();
      await rendered(page);
      mark("brow-shown");
      await beat(page, 0.8);
      mark("lash-tap");
      await page.getByRole("button").filter({ hasText: /natural|wispy|full/i }).first().click();
      await rendered(page);
      await page.mouse.wheel(0, -3000);
      mark("layered");
      await beat(page, 1.6);
      await shot(page, "layered");
      await page.getByRole("button", { name: "Save this look" }).click();
      await wait(page, 1500);
      mark("end");
    });
    await context.storageState({ path: STATE, indexedDB: true });
    await context.close();
  },
});

Object.assign(SCENES, {
  /** 3.4: the guide reads her passport, searches, checks fit, and shortlists. */
  async guide() {
    const { context, page } = await phone();
    await page.goto(`${ORIGIN}/studio/try`, { waitUntil: "networkidle" });
    await record(page, "guide", async (mark) => {
      mark("start");
      await wait(page, 1000);
      await page.getByRole("button", { name: "Ask the guide" }).click();
      await wait(page, 1200);
      mark("type");
      await type(page.locator("#guide-prompt"), "I like long blonde hair");
      await wait(page, 500);
      await page.getByRole("button", { name: "Ask", exact: true }).click();
      mark("thinking");
      await page.getByRole("link", { name: /Try it on|Open in the mirror/ }).first().waitFor({ timeout: 120000 });
      mark("picks");
      await beat(page);
      await page.getByRole("link", { name: /Try it on|Open in the mirror/ }).first().scrollIntoViewIfNeeded();
      await beat(page, 1.5);
      await shot(page, "guide");
      mark("end");
    });
    await context.close();
  },

  /** 3.5: compare saved looks, send a private link, and the family votes. */
  async together() {
    const { context, page } = await phone();
    await page.goto(`${ORIGIN}/studio/saved`, { waitUntil: "networkidle" });
    const select = page.locator('button[aria-label^="Select"]');
    await select.first().waitFor();
    let url;
    await record(page, "together", async (mark) => {
      mark("start");
      await wait(page, 1500);
      await select.nth(0).click();
      await wait(page, 500);
      await select.nth(1).click();
      await wait(page, 900);
      mark("compare");
      await page.getByRole("button", { name: "Compare" }).click();
      await beat(page, 1.8);
      await page.getByRole("dialog").getByRole("button", { name: "Close" }).click();
      await wait(page, 700);
      mark("ask");
      await page.getByRole("button", { name: "Ask family" }).click();
      await wait(page, 900);
      await type(page.getByPlaceholder("Sara"), "Sara", 90);
      await wait(page, 400);
      await page.getByRole("button", { name: "Create a private link" }).click();
      await page.getByRole("dialog", { name: "Your link is ready" }).waitFor();
      mark("link");
      url = await page.getByRole("dialog", { name: "Your link is ready" }).locator("span[title]").first().getAttribute("title");
      await beat(page, 1.2);
      mark("end");
    });
    await context.close();

    // her sister's phone: a separate browser, no passport, just the link
    const fam = await phone({ fresh: true });
    await fam.page.goto(url, { waitUntil: "networkidle" });
    await record(fam.page, "family", async (mark) => {
      mark("start");
      await beat(fam.page);
      mark("love");
      await fam.page.locator('button[aria-label^="Love"]').first().click();
      await wait(fam.page, 1200);
      await type(fam.page.getByPlaceholder("Mum"), "Mum", 90);
      await wait(fam.page, 500);
      await type(fam.page.getByPlaceholder("The first one is so you."), "The first one is so you.", 45);
      await wait(fam.page, 600);
      mark("send");
      await fam.page.getByRole("button", { name: /^Send to/ }).click();
      await beat(fam.page, 1.5);
      mark("end");
    });
    await fam.context.close();

    // back on her phone: the vote has arrived
    const back = await phone();
    await back.page.goto(`${ORIGIN}/studio/saved`, { waitUntil: "networkidle" });
    await record(back.page, "votes", async (mark) => {
      mark("start");
      await wait(back.page, 3500);
      await shot(back.page, "votes");
      mark("end");
    });
    await back.context.close();
  },

  /** 3.6: "This is the one", the decision page, the store, and insurance. */
  async decision() {
    const { context, page } = await phone();
    await page.goto(`${ORIGIN}/studio/saved`, { waitUntil: "networkidle" });
    await page.getByRole("link", { name: /This is the one/ }).first().waitFor();
    await record(page, "decision", async (mark) => {
      mark("start");
      await wait(page, 1500);
      await page.getByRole("link", { name: /This is the one/ }).first().click();
      await page.waitForURL(/studio\/pack/);
      mark("chosen");
      await beat(page, 1.5);
      mark("store");
      await page.getByRole("link", { name: /View at/ }).first().scrollIntoViewIfNeeded();
      await beat(page);
      mark("insurance");
      await page.getByText("Insurance may cover it").scrollIntoViewIfNeeded();
      await beat(page, 1.5);
      await page.mouse.wheel(0, 700);
      await wait(page, 2500);
      await shot(page, "decision");
      mark("end");
    });
    await context.close();
  },
});

/** Waits for a live try-on: the mirror's loading veil appears, then clears. */
async function rendered(page) {
  const veil = page.getByRole("status").filter({ hasText: /Trying on|Adding|Drawing/ });
  await veil.first().waitFor({ timeout: 8000 }).catch(() => {});
  await veil.first().waitFor({ state: "detached", timeout: 120000 }).catch(() => {});
  await page.waitForTimeout(600);
}

for (const [name, run] of Object.entries(SCENES)) {
  if (only && only !== name) continue;
  await run();
}
await browser.close();
