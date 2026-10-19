import { chromium } from "playwright-core";

const executablePath =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl = process.env.VISUAL_CHECK_URL ?? "http://localhost:3000";
const viewports = [
  [375, 812],
  [390, 844],
  [430, 932],
  [768, 1024],
  [1024, 900],
  [1440, 1000],
];

const browser = await chromium.launch({ executablePath, headless: true });
const results = [];

for (const [width, height] of viewports) {
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400) {
      errors.push(`${response.status()} ${response.url()}`);
    }
  });

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate(async () => {
    const pause = (milliseconds) =>
      new Promise((resolve) => setTimeout(resolve, milliseconds));
    for (let y = 0; y < document.body.scrollHeight; y += window.innerHeight) {
      window.scrollTo(0, y);
      await pause(80);
    }
    window.scrollTo(0, 0);
    await pause(500);
  });

  const metrics = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyHeight: document.body.scrollHeight,
    brokenImages: Array.from(document.images)
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => image.currentSrc || image.src),
    h1Count: document.querySelectorAll("h1").length,
    mainCount: document.querySelectorAll("main").length,
    unlabeledButtons: Array.from(document.querySelectorAll("button"))
      .filter(
        (button) =>
          !button.textContent?.trim() &&
          !button.getAttribute("aria-label") &&
          !button.getAttribute("aria-labelledby"),
      )
      .length,
  }));

  await page.screenshot({ path: `/tmp/stone-${width}-top.png` });

  if (width === 390 || width === 1440) {
    await page.screenshot({
      path: `/tmp/stone-${width}.png`,
      fullPage: true,
    });
  }

  const interactions = {};
  if (width === 390) {
    await page.getByRole("button", { name: "Open menu" }).click();
    await page.waitForTimeout(50);
    interactions.menuOpen = await page.evaluate(() => ({
      visible: getComputedStyle(document.querySelector("#mobile-menu")).opacity === "1",
      focusText: document.activeElement?.textContent?.trim() ?? "",
      bodyLocked: document.body.classList.contains("menu-is-open"),
    }));
    await page.screenshot({ path: "/tmp/stone-menu-390.png" });
    await page.keyboard.press("Escape");
    interactions.menuClosed = await page.evaluate(() => ({
      hidden: document.querySelector("#mobile-menu")?.getAttribute("aria-hidden") === "true",
      focusLabel: document.activeElement?.getAttribute("aria-label") ?? "",
      bodyUnlocked: !document.body.classList.contains("menu-is-open"),
    }));

    const mapButton = page.getByRole("button", {
      name: "Load interactive Google Map",
    });
    await mapButton.scrollIntoViewIfNeeded();
    await mapButton.click();
    interactions.mapLoaded = (await page.locator(".map-frame iframe").count()) === 1;
  }

  results.push({
    width,
    height,
    ...metrics,
    interactions,
    errors: [...new Set(errors)],
  });
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));
