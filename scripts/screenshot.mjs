import { chromium } from "playwright";

const url = process.env.SHOT_URL || "http://localhost:5173/";
const output = process.env.SHOT_OUT || "docs/screenshot.png";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(1000);
await page.screenshot({ path: output, fullPage: true });
await browser.close();

console.log(`Saved screenshot to ${output}`);
