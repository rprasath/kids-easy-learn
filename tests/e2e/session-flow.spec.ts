import { expect, test } from "@playwright/test";

test("user can launch flashcards with expandable clues and a timer bar", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /pick a mode, choose a skill, and begin/i,
    }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /choose learn/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /choose quiz/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /choose flashcards/i })).toBeVisible();

  await page.getByRole("button", { name: /choose flashcards/i }).click();
  await expect(page.getByRole("heading", { name: /choose one skill/i })).toBeVisible();
  await page.getByRole("button", { name: /select continents/i }).click();
  await expect(page.getByRole("heading", { name: /set your round and start/i })).toBeVisible();
  await expect(page.getByLabel(/timer/i)).toHaveValue("60");
  await expect(page.getByRole("checkbox")).toBeChecked();
  await page.getByLabel(/timer/i).selectOption("30");
  await page.getByRole("button", { name: /start flashcards/i }).click();

  await expect(page).toHaveURL(/\/learn\/\?/);
  await expect(page).toHaveURL(/seconds=30/);
  await expect(page).toHaveURL(/skills=continents/);
  await expect(page).toHaveURL(/auto=1/);
  await expect
    .poll(() => page.evaluate(() => document.fullscreenElement !== null))
    .toBe(true);
  await expect(page.getByRole("button", { name: /light/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /dark/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /exit full screen/i })).toBeVisible();
  await expect(page.getByText(/1 \/ /i)).toBeVisible();
  await expect(page.getByRole("heading", { name: /who am i\?/i })).toBeVisible();
  await expect(page.getByText(/clue card challenge/i)).toBeVisible();
  await expect(page.getByText(/clue 1/i)).toBeVisible();
  await expect(page.getByText(/clue 3/i)).toBeVisible();
  await expect(page.getByText(/clue 4/i)).toHaveCount(0);
  await page.getByRole("button", { name: /show .* more clues/i }).click();
  await expect(page.getByText(/clue 4/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /auto on/i })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: /flashcard timer/i })).toBeVisible();
  await page.keyboard.press("ArrowDown");
  await expect(page.getByText(/short description/i)).toBeVisible();
  await page.keyboard.press("ArrowUp");
  await expect(page.getByRole("heading", { name: /who am i\?/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /flip card/i })).toBeVisible();
  await expect(page.getByText(/correct so far/i)).toHaveCount(0);
  await expect(page.getByText(/cards explored/i)).toHaveCount(0);
});

test("flashcards show summary only after exiting", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /choose flashcards/i }).click();
  await page.getByRole("button", { name: /select u\.s\. states/i }).click();
  await page.getByRole("button", { name: /start flashcards/i }).click();
  await page.getByRole("button", { name: /exit flashcards/i }).click();

  await expect(page).toHaveURL(/\/results\/\?mode=flashcards/);
  await expect(page.getByText(/flashcard summary/i)).toBeVisible();
  await expect(page.getByText(/cards viewed/i)).toBeVisible();
});

test("quiz shows a timer progress bar in auto mode and home works", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /choose quiz/i }).click();
  await page.getByRole("button", { name: /select u\.s\. states/i }).click();
  await expect(page.getByLabel(/timer/i)).toHaveValue("60");
  await page.getByLabel(/timer/i).selectOption("120");
  await page.getByRole("button", { name: /start quiz/i }).click();

  await expect(page).toHaveURL(/\/quiz\/\?/);
  await expect(page).toHaveURL(/seconds=120/);
  await expect
    .poll(() => page.evaluate(() => document.fullscreenElement !== null))
    .toBe(true);
  await expect(page.getByRole("button", { name: /exit full screen/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /auto on/i })).toBeVisible();
  await expect(page.getByRole("progressbar", { name: /quiz timer/i })).toBeVisible();
  await page.getByRole("button", { name: /^home$/i }).click();
  await expect(page).toHaveURL("/");
});

test("visual map learn opens from the dashboard and supports map plus search navigation", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: /choose learn/i }).click();
  await page.getByRole("button", { name: /select countries/i }).click();
  await page.getByRole("button", { name: /start learn/i }).click();

  await expect(page).toHaveURL(/\/map-learn/);
  await expect(page.getByRole("img", { name: /interactive world countries map/i })).toBeVisible();
  await expect(page.getByPlaceholder(/search for japan, nairobi, europe, br/i)).toBeVisible();

  await page.locator('[data-feature-id="004"]').click({ force: true });
  const detailsDialog = page.getByRole("dialog", { name: /country details/i });
  await expect(detailsDialog).toBeVisible();
  await expect(detailsDialog.getByText(/explore afghanistan/i)).toBeVisible();
  await detailsDialog.getByRole("button", { name: /close/i }).click();
  await expect(detailsDialog).toHaveCount(0);

  await page.getByPlaceholder(/search for japan, nairobi, europe, br/i).fill("Kenya");
  await page
    .locator("section")
    .filter({ hasText: /find a country fast/i })
    .getByRole("button", { name: /kenya/i })
    .click();
  await expect(detailsDialog).toBeVisible();
  await expect(detailsDialog.getByText(/explore kenya/i)).toBeVisible();
  await detailsDialog.getByRole("button", { name: /close/i }).click();
  await page.getByRole("button", { name: /^home$/i }).click();
  await expect(page).toHaveURL("/");
});
