import { test, expect } from "@playwright/test";
import { getByTestId, seedE2eLocalStorage } from "./helpers";

test.use({
  viewport: { width: 393, height: 851 },
  isMobile: true,
});

test.beforeEach(async ({ page }) => {
  await seedE2eLocalStorage(page);
});

test("loads and displays the sphere grid on mobile", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Sphere Grid/);
  await expect(getByTestId(page, "sphere-grid")).toBeVisible();
});

test("canvas is visible and takes up most of the viewport", async ({ page }) => {
  await page.goto("/");

  const canvas = getByTestId(page, "sphere-canvas");
  await expect(canvas).toBeVisible();

  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeGreaterThan(300);
});

test("sphere selector toolbar is visible", async ({ page }) => {
  await page.goto("/");

  await expect(getByTestId(page, "sphere-selector")).toBeVisible();
});

test("can open stats details dialog on mobile", async ({ page }) => {
  await page.goto("/");

  const toolbarRow = getByTestId(page, "toolbar-row");
  await toolbarRow.evaluate((el) => (el.scrollLeft = el.scrollWidth));

  await getByTestId(page, "mobile-stats-button").click();

  await expect(getByTestId(page, "stats-details-dialog")).toBeVisible();
});

test("page does not scroll horizontally", async ({ page }) => {
  await page.goto("/");

  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });

  expect(overflow).toBe(false);
});
