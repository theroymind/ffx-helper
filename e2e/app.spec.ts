import { test, expect } from "@playwright/test";
import {
  getByTestId,
  seedE2eLocalStorage,
  waitForGrid,
  getModifiableNodeId,
  clickNode,
  getNodeType,
  clickSphereType,
  resetGrid,
  clearGrid,
  getAllNodeTypes,
} from "./helpers";

const SPHERE_TYPES = [
  "hp",
  "mp",
  "strength",
  "defense",
  "magic",
  "magicDef",
  "agility",
  "accuracy",
  "evasion",
  "luck",
  "empty",
] as const;

test.beforeEach(async ({ page }) => {
  await seedE2eLocalStorage(page);
});

test("page loads with all UI elements visible", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/Sphere Grid/);
  await expect(getByTestId(page, "sphere-grid")).toBeVisible();

  const canvas = getByTestId(page, "sphere-canvas");
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThan(400);
  expect(box!.height).toBeGreaterThan(300);

  await expect(getByTestId(page, "sphere-selector")).toBeVisible();
  for (const type of SPHERE_TYPES) {
    await expect(getByTestId(page, `sphere-type-${type}`)).toBeVisible();
  }

  await waitForGrid(page);
  const nodeCount = await page.evaluate(() => {
    // @ts-expect-error exposed for testing
    return window.__cy.nodes().length;
  });
  expect(nodeCount).toBeGreaterThan(100);

  await expect(page.locator('[data-tour="stats-bar"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "FFX Planner" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Sphere Grid" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Monster Arena" })).toBeVisible();

  await page.getByRole("button", { name: "Details" }).click();
  const dialog = getByTestId(page, "stats-details-dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("HP")).toBeVisible();
  await expect(dialog.getByText("MP")).toBeVisible();
});

test("node editing: select types, click nodes, and paint multiple", async ({ page }) => {
  await page.goto("/");
  await waitForGrid(page);

  for (const type of SPHERE_TYPES) {
    await clickSphereType(page, type);
    await expect(getByTestId(page, `sphere-type-${type}`)).toHaveClass(/ring-2/);
  }

  await clickSphereType(page, "hp");
  await clickSphereType(page, "strength");
  await expect(getByTestId(page, "sphere-type-strength")).toHaveClass(/ring-2/);
  await expect(getByTestId(page, "sphere-type-hp")).not.toHaveClass(/ring-2/);

  const nodeId = await getModifiableNodeId(page, 0);
  expect(nodeId).not.toBeNull();

  for (const type of SPHERE_TYPES) {
    await clickNode(page, nodeId!, type);
    expect(await getNodeType(page, nodeId!)).toBe(type);
  }

  for (const type of ["strength", "magic", "hp", "empty"] as const) {
    await clickNode(page, nodeId!, type);
    expect(await getNodeType(page, nodeId!)).toBe(type);
  }

  const nodeId0 = await getModifiableNodeId(page, 0);
  const nodeId1 = await getModifiableNodeId(page, 1);
  expect(nodeId0).not.toBeNull();
  expect(nodeId1).not.toBeNull();

  await clickNode(page, nodeId0!, "defense");
  await clickNode(page, nodeId1!, "defense");
  expect(await getNodeType(page, nodeId0!)).toBe("defense");
  expect(await getNodeType(page, nodeId1!)).toBe("defense");
});

test("grid controls: clear, reset, and cancel dialogs", async ({ page }) => {
  await page.goto("/");
  await waitForGrid(page);

  const typesBefore = await getAllNodeTypes(page);

  await getByTestId(page, "grid-controls-trigger").click();
  await getByTestId(page, "clear-grid-item").click();
  await page.getByRole("button", { name: "Cancel" }).click();
  await page.waitForTimeout(200);
  expect(await getAllNodeTypes(page)).toEqual(typesBefore);

  await clearGrid(page);
  await page.waitForTimeout(500);
  const typesAfterClear = await getAllNodeTypes(page);
  const hasOnlyEmptyAndLocked = Object.keys(typesAfterClear).every((t) => t === "empty" || t === "locked");
  expect(hasOnlyEmptyAndLocked).toBe(true);

  const nodeId = await getModifiableNodeId(page, 0);
  expect(nodeId).not.toBeNull();

  await clickNode(page, nodeId!, "luck");
  expect(await getNodeType(page, nodeId!)).toBe("luck");

  await getByTestId(page, "grid-controls-trigger").click();
  await getByTestId(page, "reset-to-default-item").click();
  await page.getByRole("button", { name: "Cancel" }).click();
  await page.waitForTimeout(200);
  expect(await getNodeType(page, nodeId!)).toBe("luck");

  await resetGrid(page);
  await page.waitForTimeout(500);
  const restoredType = await getNodeType(page, nodeId!);
  expect(restoredType).not.toBe("luck");
});

test("persistence: changes survive reload and reset clears storage", async ({ page }) => {
  await page.goto("/");
  await waitForGrid(page);

  const nodeId = await getModifiableNodeId(page, 0);
  expect(nodeId).not.toBeNull();

  await clickNode(page, nodeId!, "agility");
  expect(await getNodeType(page, nodeId!)).toBe("agility");

  await expect(async () => {
    const stored = await page.evaluate((id) => {
      const raw = localStorage.getItem("ffx-sphere-grid-deltas-standard");
      if (!raw) return null;
      const deltas = JSON.parse(raw);
      return deltas[id]?.type ?? null;
    }, nodeId!);
    expect(stored).toBe("agility");
  }).toPass({ timeout: 2000 });

  await page.reload();
  await waitForGrid(page);
  expect(await getNodeType(page, nodeId!)).toBe("agility");

  await clickNode(page, nodeId!, "evasion");

  await expect(async () => {
    const stored = await page.evaluate((id) => {
      const raw = localStorage.getItem("ffx-sphere-grid-deltas-standard");
      if (!raw) return null;
      const deltas = JSON.parse(raw);
      return deltas[id]?.type ?? null;
    }, nodeId!);
    expect(stored).toBe("evasion");
  }).toPass({ timeout: 2000 });

  await resetGrid(page);
  await page.waitForTimeout(500);

  await page.reload();
  await waitForGrid(page);
  expect(await getNodeType(page, nodeId!)).not.toBe("evasion");
});
