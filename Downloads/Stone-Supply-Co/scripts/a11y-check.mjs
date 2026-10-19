import axe from "axe-core";
import { chromium } from "playwright-core";

const executablePath =
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const baseUrl = process.env.A11Y_CHECK_URL ?? "http://localhost:3000";
const checks = [
  { path: "/", width: 390, height: 844 },
  { path: "/", width: 1440, height: 1000 },
  { path: "/privacy", width: 1440, height: 1000 },
  { path: "/accessibility", width: 1440, height: 1000 },
];

const browser = await chromium.launch({ executablePath, headless: true });
const reports = [];

for (const check of checks) {
  const page = await browser.newPage({
    viewport: { width: check.width, height: check.height },
    deviceScaleFactor: 1,
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(`${baseUrl}${check.path}`, { waitUntil: "networkidle" });
  await page.addScriptTag({ content: axe.source });

  const result = await page.evaluate(async () => {
    return window.axe.run(document, {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
      },
    });
  });

  reports.push({
    route: check.path,
    viewport: `${check.width}x${check.height}`,
    violations: result.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.map((node) => ({
        target: node.target,
        summary: node.failureSummary,
      })),
    })),
  });

  await page.close();
}

await browser.close();
console.log(JSON.stringify(reports, null, 2));

if (reports.some((report) => report.violations.length > 0)) {
  process.exitCode = 1;
}
