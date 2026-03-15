import { expect, test } from "@playwright/test";

test("user can launch flashcards with expandable clues and a timer bar", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /what do you want to play/i,
    }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /select all/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /reset/i })).toHaveCount(0);
  await expect(page.getByText(/choose the time, then start learning/i)).toHaveCount(0);
  await page.getByRole("button", { name: /continents/i }).click();
  await page.getByLabel(/timer/i).selectOption("30");
  await page.getByRole("link", { name: /start flashcards/i }).click();

  await expect(page).toHaveURL(/\/learn\/\?/);
  await expect(page).toHaveURL(/seconds=30/);
  await expect(page).toHaveURL(/skills=[^&]*(,|%2C)/);
  await expect(page.getByText(/1 \/ /i)).toBeVisible();
  await expect(page.getByRole("heading", { name: /who am i\?/i })).toBeVisible();
  await expect(page.getByText(/clue card challenge/i)).toBeVisible();
  await expect(page.getByText(/clue 1/i)).toBeVisible();
  await expect(page.getByText(/clue 3/i)).toBeVisible();
  await expect(page.getByText(/clue 4/i)).toHaveCount(0);
  await page.getByRole("button", { name: /show .* more clues/i }).click();
  await expect(page.getByText(/clue 4/i)).toBeVisible();
  await page.getByRole("button", { name: /auto mode/i }).click();
  await expect(page.getByRole("progressbar", { name: /flashcard timer/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /flip card/i })).toBeVisible();
  await expect(page.getByText(/correct so far/i)).toHaveCount(0);
  await expect(page.getByText(/cards explored/i)).toHaveCount(0);
});

test("flashcards show summary only after exiting", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /start flashcards/i }).click();
  await page.getByRole("button", { name: /exit flashcards/i }).click();

  await expect(page).toHaveURL(/\/results\/\?mode=flashcards/);
  await expect(page.getByText(/flashcard summary/i)).toBeVisible();
  await expect(page.getByText(/cards viewed/i)).toBeVisible();
});

test("quiz shows a timer progress bar in auto mode", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel(/timer/i).selectOption("45");
  await page.getByRole("link", { name: /start quiz/i }).click();

  await expect(page).toHaveURL(/\/quiz\/\?/);
  await expect(page).toHaveURL(/seconds=45/);
  await page.getByRole("button", { name: /auto mode/i }).click();
  await expect(page.getByRole("progressbar", { name: /quiz timer/i })).toBeVisible();
});
