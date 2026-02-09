import { describe, it, expect } from "vitest";
import { ref } from "vue";
import { useGridStorage } from "./useGridStorage";
import { GridType } from "@/domain/grid/GridType";
import { SphereType } from "@/domain/grid/SphereType";

describe("useGridStorage", () => {
  describe("saveNode", () => {
    it("saves a single node delta", () => {
      const gridType = ref(GridType.Standard);
      const storage = useGridStorage(gridType);

      storage.saveNode("node-1", SphereType.Hp, 300);

      expect(storage.deltas.value["node-1"]).toEqual({
        type: SphereType.Hp,
        value: 300,
      });
    });

    it("updates existing node delta", () => {
      const gridType = ref(GridType.Standard);
      const storage = useGridStorage(gridType);

      storage.saveNode("node-1", SphereType.Hp, 300);
      storage.saveNode("node-1", SphereType.Strength, 4);

      expect(storage.deltas.value["node-1"]).toEqual({
        type: SphereType.Strength,
        value: 4,
      });
    });

    it("saves to correct storage based on grid type", () => {
      const gridType = ref(GridType.Standard);
      const storage = useGridStorage(gridType);

      storage.saveNode("node-1", SphereType.Hp, 300);

      gridType.value = GridType.Expert;
      storage.saveNode("node-2", SphereType.Mp, 40);

      gridType.value = GridType.Standard;
      expect(storage.deltas.value["node-1"]).toBeDefined();
      expect(storage.deltas.value["node-2"]).toBeUndefined();

      gridType.value = GridType.Expert;
      expect(storage.deltas.value["node-1"]).toBeUndefined();
      expect(storage.deltas.value["node-2"]).toBeDefined();
    });
  });

  describe("saveNodes", () => {
    it("saves multiple node deltas at once", () => {
      const gridType = ref(GridType.Standard);
      const storage = useGridStorage(gridType);

      storage.saveNodes([
        { nodeId: "node-1", type: SphereType.Hp, value: 300 },
        { nodeId: "node-2", type: SphereType.Mp, value: 40 },
        { nodeId: "node-3", type: SphereType.Strength, value: 4 },
      ]);

      expect(Object.keys(storage.deltas.value).length).toBe(3);
      expect(storage.deltas.value["node-1"]?.type).toBe(SphereType.Hp);
      expect(storage.deltas.value["node-2"]?.type).toBe(SphereType.Mp);
      expect(storage.deltas.value["node-3"]?.type).toBe(SphereType.Strength);
    });
  });

  describe("removeNode", () => {
    it("removes a node delta", () => {
      const gridType = ref(GridType.Standard);
      const storage = useGridStorage(gridType);

      storage.saveNode("node-1", SphereType.Hp, 300);
      storage.saveNode("node-2", SphereType.Mp, 40);

      storage.removeNode("node-1");

      expect(storage.deltas.value["node-1"]).toBeUndefined();
      expect(storage.deltas.value["node-2"]).toBeDefined();
    });
  });

  describe("clearDeltas", () => {
    it("clears all deltas for current grid type", () => {
      const gridType = ref(GridType.Standard);
      const storage = useGridStorage(gridType);

      storage.saveNode("node-1", SphereType.Hp, 300);
      storage.saveNode("node-2", SphereType.Mp, 40);

      storage.clearDeltas();

      expect(Object.keys(storage.deltas.value).length).toBe(0);
    });

    it("only clears deltas for current grid type", () => {
      const gridType = ref(GridType.Standard);
      const storage = useGridStorage(gridType);

      storage.saveNode("node-1", SphereType.Hp, 300);

      gridType.value = GridType.Expert;
      storage.saveNode("node-2", SphereType.Mp, 40);

      storage.clearDeltas();

      expect(Object.keys(storage.deltas.value).length).toBe(0);

      gridType.value = GridType.Standard;
      expect(storage.deltas.value["node-1"]).toBeDefined();
    });
  });

  describe("hasDeltas", () => {
    it("returns false when no deltas", () => {
      const gridType = ref(GridType.Standard);
      const storage = useGridStorage(gridType);

      expect(storage.hasDeltas.value).toBe(false);
    });

    it("returns true when deltas exist", () => {
      const gridType = ref(GridType.Standard);
      const storage = useGridStorage(gridType);

      storage.saveNode("node-1", SphereType.Hp, 300);

      expect(storage.hasDeltas.value).toBe(true);
    });
  });
});
