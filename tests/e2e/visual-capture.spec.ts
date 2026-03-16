import { mkdirSync } from "node:fs";
import path from "node:path";

import { expect, test } from "@playwright/test";

const outputDir = path.join(process.cwd(), "artifacts", "visual");

test("capture visual screenshots for setup, learn, and quiz flows", async ({ page }) => {
  mkdirSync(outputDir, { recursive: true });

  await page.goto("/");
  await page.screenshot({ path: path.join(outputDir, "home.png"), fullPage: true });

  await page.getByRole("button", { name: /choose flashcards/i }).click();
  await page.getByRole("button", { name: /select continents/i }).click();
  await page.getByRole("button", { name: /start flashcards/i }).click();
  await expect(page).toHaveURL(/\/learn\/\?/);
  await expect(page.getByRole("heading", { name: /who am i\?/i })).toBeVisible();
  await page.screenshot({ path: path.join(outputDir, "learn-front.png"), fullPage: true });

  await page.getByRole("button", { name: /flip card/i }).evaluate((element) => {
    (element as HTMLButtonElement).click();
  });
  await expect(page.getByText(/10 things to remember/i)).toBeVisible();
  await page.screenshot({ path: path.join(outputDir, "learn-back.png") });

  await page.getByRole("button", { name: /exit flashcards/i }).click();
  await expect(page).toHaveURL(/\/results\/\?mode=flashcards/);
  await expect(page.getByText(/flashcard summary/i)).toBeVisible();
  await page.screenshot({ path: path.join(outputDir, "flashcard-summary.png"), fullPage: true });

  await page.goto("/");
  await page.getByRole("button", { name: /choose quiz/i }).click();
  await page.getByRole("button", { name: /select continents/i }).click();
  await page.getByRole("button", { name: /start quiz/i }).click();
  await expect(page).toHaveURL(/\/quiz\/\?/);
  await expect(page.getByRole("heading", { name: /question 1 of/i })).toBeVisible();
  await page.screenshot({ path: path.join(outputDir, "quiz.png"), fullPage: true });
});
