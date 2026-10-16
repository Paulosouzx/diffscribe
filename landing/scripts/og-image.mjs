import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const url = process.argv[2] ?? "http://127.0.0.1:4173/";
const out = fileURLToPath(new URL("../public/og-image.png", import.meta.url));
const executablePath = process.env.CHROMIUM_PATH || undefined;

const browser = await chromium.launch({ executablePath });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForFunction(() => document.body.classList.contains("is-ready"));
await page.waitForTimeout(4000);
await page.addStyleTag({
	content: `
		.hero { min-height: 630px; height: 630px; }
		.nav-pill, .side-nav, .hero__actions, .about-card, .hero__label { display: none !important; }
		.hero__heading { top: 30% !important; font-size: 76px !important; width: 900px !important; }
		.hero__desc { max-width: 560px !important; font-size: 20px !important; }
		.btn--header { visibility: hidden; }
		.logo__icon { width: 160px; height: 34px; }
	`,
});
await page.waitForTimeout(300);
await page.screenshot({ path: out, clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();
console.log(`wrote ${out}`);
