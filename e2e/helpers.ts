import type { Page, Locator } from "@playwright/test";

export function getByTestId(page: Page, testId: string): Locator {
  return page.locator(`[data-test-id="${testId}"]`);
}

export async function waitForGrid(page: Page) {
  await page.waitForFunction(
    () => {
      // @ts-expect-error exposed for testing
      return window.__cy && window.__cy.nodes().length > 0;
    },
    { timeout: 15000 },
  );
}

export async function getModifiableNodeId(page: Page, nodeIndex: number): Promise<string | null> {
  return page.evaluate((idx) => {
    // @ts-expect-error exposed for testing
    return window.__getModifiableNodeId(idx);
  }, nodeIndex);
}

export async function clickNode(page: Page, nodeId: string, type?: string): Promise<boolean> {
  return page.evaluate(
    ({ id, t }) => {
      // @ts-expect-error exposed for testing
      return window.__clickNode(id, t);
    },
    { id: nodeId, t: type },
  );
}

export async function getNodeType(page: Page, nodeId: string): Promise<string> {
  return page.evaluate((id) => {
    // @ts-expect-error exposed for testing
    const cy = window.__cy;
    const node = cy.getElementById(id);
    return node.data("type") as string;
  }, nodeId);
}

export async function clickSphereType(page: Page, type: string) {
  await getByTestId(page, `sphere-type-${type}`).click();
}

export async function resetGrid(page: Page) {
  await getByTestId(page, "grid-controls-trigger").click();
  await getByTestId(page, "reset-to-default-item").click();
  await getByTestId(page, "confirm-reset").click();
}

export async function clearGrid(page: Page) {
  await getByTestId(page, "grid-controls-trigger").click();
  await getByTestId(page, "clear-grid-item").click();
  await getByTestId(page, "confirm-clear").click();
}

export async function getAllNodeTypes(page: Page) {
  return page.evaluate(() => {
    // @ts-expect-error exposed for testing
    const cy = window.__cy;
    const types: Record<string, number> = {};
    cy.nodes().forEach((n: { data: (key: string) => string }) => {
      const type = n.data("type") as string;
      types[type] = (types[type] || 0) + 1;
    });
    return types;
  });
}
