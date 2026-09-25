import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/testing.html");
});

test("loads the candidate registry and initial report", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "Candidate data, under a microscope." })).toBeVisible();
  await expect(page.locator("#candidate-table-body tr")).toHaveCount(3);
  await expect(page.locator("#result-count")).toHaveText("3");
  await expect(page.locator("#average-score")).toHaveText("64.0");
  await expect(page.locator("#highest-score")).toHaveText("100");
});

test("filters and sorts the visible candidates", async ({ page }) => {
  await page.locator("#seniority-filter").selectOption("Senior");
  await expect(page.locator("#candidate-table-body tr")).toHaveCount(1);
  await page.locator("#sort-select").selectOption("score-desc");
  await expect(page.locator("#candidate-table-body tr").first()).toContainText("Carolina Silva");
});

test("runs linear and binary searches with clear results", async ({ page }) => {
  await page.locator("#search-id").fill("C-2024-0451");
  await page.getByRole("button", { name: "Search candidate" }).click();
  await expect(page.locator("#candidate-table-body tr")).toHaveCount(1);
  await expect(page.locator("#result-message")).toContainText("María González (C-2024-0451) found");

  await page.getByRole("button", { name: "Binary" }).click();
  await page.locator("#search-id").fill("6500");
  await page.getByRole("button", { name: "Search candidate" }).click();
  await expect(page.locator("#result-message")).toContainText("Carolina Silva");
  await page.locator("#search-id").fill("9999");
  await page.getByRole("button", { name: "Search candidate" }).click();
  await expect(page.locator("#empty-state")).toBeVisible();
  await expect(page.locator("#result-message")).toContainText("9999 was not found");
});

test("generates a report for the current view and resets", async ({ page }) => {
  await page.locator("#seniority-filter").selectOption("Senior");
  await page.getByRole("button", { name: "Generate report" }).click();
  await expect(page.locator("#hired-count")).toHaveText("0");
  await expect(page.locator("#seniority-report")).toContainText("Senior");

  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.locator("#result-count")).toHaveText("3");
  await expect(page.locator("#result-message")).toContainText("full candidate dataset");
});