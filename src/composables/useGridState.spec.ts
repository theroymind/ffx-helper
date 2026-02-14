import { describe, it, expect, vi, beforeEach } from "vitest";
import { ref, nextTick, type Ref } from "vue";
import { useGridState } from "./useGridState";
import { useGridStorage } from "./useGridStorage";
import { SphereType } from "@/domain/grid/SphereType";
import { GridType } from "@/domain/grid/GridType";
import { generateSphereGrid } from "@/utils/gridGenerator";
import type { SphereNode } from "@/domain/grid/SphereNode";

vi.mock("@/composables/useAnalytics", () => ({
  useAnalytics: () => ({
    trackSphereModification: vi.fn(),
    trackGridReset: vi.fn(),
  }),
}));

function findModifiableNode(nodes: SphereNode[]): SphereNode {
  const node = nodes.find((n) => !n.abilityId && !n.locked);
  if (!node) throw new Error("No modifiable node found");
  return node;
}

describe("useGridState", () => {
  let gridType: Ref<GridType>;
  let storage: ReturnType<typeof useGridStorage>;
  let defaultGrid: ReturnType<typeof generateSphereGrid>;

  beforeEach(() => {
    gridType = ref<GridType>(GridType.Standard);
    storage = useGridStorage(gridType);
    defaultGrid = generateSphereGrid(GridType.Standard);
  });

  describe("shared view", () => {
    it("displays shared nodes when in shared view", () => {
      const modifiable = findModifiableNode(defaultGrid.nodes);
      const sharedVersion: SphereNode[] = defaultGrid.nodes.map((n) =>
        n.id === modifiable.id ? { ...n, type: SphereType.Hp, value: 300 } : n,
      );

      const isSharedView = ref(true);
      const sharedNodes = ref<SphereNode[] | null>(sharedVersion);

      const state = useGridState(gridType, storage, isSharedView, sharedNodes);

      const node = state.sphereData.value.nodes.find((n) => n.id === modifiable.id);
      expect(node!.type).toBe(SphereType.Hp);
    });

    it("does not persist node changes to storage in shared view", () => {
      const modifiable = findModifiableNode(defaultGrid.nodes);
      const isSharedView = ref(true);
      const sharedNodes = ref<SphereNode[] | null>([...defaultGrid.nodes]);

      const state = useGridState(gridType, storage, isSharedView, sharedNodes);

      state.updateNode(modifiable.id, SphereType.Hp, 300);

      expect(storage.deltas.value[modifiable.id]).toBeUndefined();
    });

    it("does not persist bulk node changes to storage in shared view", () => {
      const modifiableNodes = defaultGrid.nodes.filter((n) => !n.abilityId && !n.locked).slice(0, 2);
      const isSharedView = ref(true);
      const sharedNodes = ref<SphereNode[] | null>([...defaultGrid.nodes]);

      const state = useGridState(gridType, storage, isSharedView, sharedNodes);

      state.updateNodes(
        modifiableNodes.map((n) => n.id),
        SphereType.Hp,
        300,
      );

      expect(Object.keys(storage.deltas.value)).toHaveLength(0);
    });

    it("restores local grid when exiting shared view", async () => {
      const modifiable = findModifiableNode(defaultGrid.nodes);
      storage.saveNode(modifiable.id, SphereType.Strength, 4);

      const sharedVersion: SphereNode[] = defaultGrid.nodes.map((n) =>
        n.id === modifiable.id ? { ...n, type: SphereType.Hp, value: 300 } : n,
      );

      const isSharedView = ref(true);
      const sharedNodes = ref<SphereNode[] | null>(sharedVersion);

      const state = useGridState(gridType, storage, isSharedView, sharedNodes);

      const sharedNode = state.sphereData.value.nodes.find((n) => n.id === modifiable.id);
      expect(sharedNode!.type).toBe(SphereType.Hp);

      isSharedView.value = false;
      await nextTick();

      const restoredNode = state.sphereData.value.nodes.find((n) => n.id === modifiable.id);
      expect(restoredNode!.type).toBe(SphereType.Strength);
    });

    it("preserves local storage deltas while viewing shared grid", () => {
      const modifiable = findModifiableNode(defaultGrid.nodes);
      storage.saveNode(modifiable.id, SphereType.Strength, 4);

      const isSharedView = ref(true);
      const sharedNodes = ref<SphereNode[] | null>([...defaultGrid.nodes]);

      useGridState(gridType, storage, isSharedView, sharedNodes);

      expect(storage.deltas.value[modifiable.id]).toEqual({
        type: SphereType.Strength,
        value: 4,
      });
    });

    it("does not persist clearGrid changes in shared view", () => {
      const modifiable = findModifiableNode(defaultGrid.nodes);
      storage.saveNode(modifiable.id, SphereType.Strength, 4);

      const isSharedView = ref(true);
      const sharedNodes = ref<SphereNode[] | null>([...defaultGrid.nodes]);

      const state = useGridState(gridType, storage, isSharedView, sharedNodes);

      state.clearGrid();

      expect(storage.deltas.value[modifiable.id]).toEqual({
        type: SphereType.Strength,
        value: 4,
      });
    });
  });

  describe("local view", () => {
    it("applies storage deltas to default nodes", () => {
      const modifiable = findModifiableNode(defaultGrid.nodes);
      storage.saveNode(modifiable.id, SphereType.Hp, 300);

      const isSharedView = ref(false);
      const state = useGridState(gridType, storage, isSharedView);

      const node = state.sphereData.value.nodes.find((n) => n.id === modifiable.id);
      expect(node!.type).toBe(SphereType.Hp);
      expect(node!.value).toBe(300);
    });

    it("persists node changes to storage", () => {
      const isSharedView = ref(false);
      const state = useGridState(gridType, storage, isSharedView);

      const modifiable = findModifiableNode(state.sphereData.value.nodes);

      state.updateNode(modifiable.id, SphereType.Hp, 300);

      expect(storage.deltas.value[modifiable.id]).toEqual({
        type: SphereType.Hp,
        value: 300,
      });
    });
  });
});
