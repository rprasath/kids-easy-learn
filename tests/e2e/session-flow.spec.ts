import { expect, test } from "@playwright/test";

test("user can pick skills and launch a flashcard session", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /pick the geography skills we want, then jump straight into cards or quiz mode/i,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: /continents/i }).click();
  await page.getByRole("link", { name: /start flashcards/i }).click();

  await expect(page).toHaveURL(/\/learn\?skills=states,continents|\/learn\?skills=continents,states/);
  await expect(page.getByText(/1 \/ /i)).toBeVisible();
  await expect(page.getByRole("heading", { name: /who am i\?/i })).toBeVisible();
  await expect(page.getByText(/clue card challenge/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /flip card/i })).toBeVisible();
  await expect(page.getByText(/correct so far/i)).toHaveCount(0);
  await expect(page.getByText(/cards explored/i)).toHaveCount(0);
});

test("flashcards show summary only after exiting", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /start flashcards/i }).click();
  await page.getByRole("button", { name: /exit flashcards/i }).click();

  await expect(page).toHaveURL(/\/results\?mode=flashcards/);
  await expect(page.getByText(/flashcard summary/i)).toBeVisible();
  await expect(page.getByText(/cards viewed/i)).toBeVisible();
});
