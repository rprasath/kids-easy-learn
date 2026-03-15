import { mkdir } from "node:fs/promises";

import { chromium } from "@playwright/test";

const outputDir = new URL("../artifacts/visual/", import.meta.url);
const baseUrl = process.env.BASE_URL ?? "http://127.0.0.1:3000";

async function run() {
  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });

  await page.goto(`${baseUrl}/`);
  await page.screenshot({ path: new URL("home.png", outputDir).pathname, fullPage: true });

  await page.getByRole("button", { name: /continents/i }).click();
  await page.getByRole("button", { name: /countries/i }).click();
  await page.getByRole("link", { name: /start flashcards/i }).click();
  await page.screenshot({ path: new URL("learn-front.png", outputDir).pathname, fullPage: true });

  await page.getByRole("button", { name: /flip card/i }).click();
  await page.screenshot({ path: new URL("learn-back.png", outputDir).pathname, fullPage: true });

  await page.getByRole("link", { name: /start quiz/i }).click();
  await page.screenshot({ path: new URL("quiz.png", outputDir).pathname, fullPage: true });

  await browser.close();
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
