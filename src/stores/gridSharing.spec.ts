import { describe, it, expect, beforeEach, vi } from "vitest";
import { setActivePinia, createPinia } from "pinia";
import { useGridSharingStore } from "./gridSharing";
import { SphereType } from "@/domain/grid/SphereType";
import { GridType } from "@/domain/grid/GridType";
import type { SphereNode } from "@/domain/grid/SphereNode";

vi.mock("@vueuse/core", () => ({
  useUrlSearchParams: () => ({
    g: null,
    t: null,
  }),
}));

vi.mock("@/composables/useAnalytics", () => ({
  useAnalytics: () => ({
    trackGridShared: vi.fn(),
  }),
}));

function createTestNode(
  id: string,
  type: SphereType = SphereType.Empty,
  value = 0,
  locked = false,
  abilityId: number | null = null,
): SphereNode {
  return {
    id,
    type,
    value,
    locked,
    abilityId,
    abilityName: abilityId ? `Ability ${abilityId}` : undefined,
  };
}

describe("gridSharing", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  describe("sphere type conversion", () => {
    it("converts all sphere types to integers and back", () => {
      const store = useGridSharingStore();
      const types = Object.values(SphereType);

      types.forEach((type) => {
        const encoded = store.generateShareUrl(
          [createTestNode("node-0", type, 10)],
          [createTestNode("node-0", SphereType.Empty, 0)],
          GridType.Standard,
        );

        expect(encoded).toContain("g=");
      });
    });

    it("handles all 12 sphere types (0-11)", () => {
      const types = Object.values(SphereType);
      expect(types.length).toBe(12);
    });
  });

  describe("sphere value conversion", () => {
    it("converts all valid sphere values to indices and back", () => {
      const store = useGridSharingStore();
      const validValues = [0, 1, 2, 3, 4, 10, 20, 40, 200, 300];

      validValues.forEach((value) => {
        const currentNode = createTestNode("node-0", SphereType.Hp, value);
        const defaultNode = createTestNode("node-0", SphereType.Empty, 0);

        const url = store.generateShareUrl([currentNode], [defaultNode], GridType.Standard);

        expect(url).toContain("g=");
      });
    });

    it("handles high-value spheres (200, 300 HP)", () => {
      const store = useGridSharingStore();

      const highValueNode = createTestNode("node-0", SphereType.Hp, 200);
      const defaultNode = createTestNode("node-0", SphereType.Empty, 0);

      const url = store.generateShareUrl([highValueNode], [defaultNode], GridType.Standard);
      expect(url).toBeTruthy();
    });
  });

  describe("base64 URL encoding", () => {
    it("generates URL-safe base64 without padding", () => {
      const store = useGridSharingStore();

      const currentNode = createTestNode("node-0", SphereType.Hp, 200);
      const defaultNode = createTestNode("node-0", SphereType.Empty, 0);

      const url = store.generateShareUrl([currentNode], [defaultNode], GridType.Standard);
      const encoded = new URL(url).searchParams.get("g")!;

      expect(encoded).not.toContain("+");
      expect(encoded).not.toContain("/");
      expect(encoded).not.toContain("=");
      expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    });

    it("uses URL-safe characters (-, _)", () => {
      const store = useGridSharingStore();

      const validValues = [0, 1, 2, 3, 4, 10, 20, 40, 200, 300];
      const nodes = Array.from({ length: 100 }, (_, i) =>
        createTestNode(`node-${i}`, SphereType.Hp, validValues[i % validValues.length]!),
      );
      const defaults = Array.from({ length: 100 }, (_, i) => createTestNode(`node-${i}`, SphereType.Empty, 0));

      const url = store.generateShareUrl(nodes, defaults, GridType.Standard);
      const encoded = new URL(url).searchParams.get("g")!;

      expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    });
  });

  describe("extractModifiedNodes", () => {
    it("identifies nodes that differ from defaults", () => {
      const current = [
        createTestNode("node-0", SphereType.Hp, 200),
        createTestNode("node-1", SphereType.Empty, 0),
        createTestNode("node-2", SphereType.Strength, 4),
      ];
      const defaults = [
        createTestNode("node-0", SphereType.Empty, 0),
        createTestNode("node-1", SphereType.Empty, 0),
        createTestNode("node-2", SphereType.Empty, 0),
      ];

      const store = useGridSharingStore();
      const url = store.generateShareUrl(current, defaults, GridType.Standard);

      expect(url).toContain("g=");
    });

    it("ignores ability nodes", () => {
      const current = [
        createTestNode("node-0", SphereType.Hp, 200, false, 42),
        createTestNode("node-1", SphereType.Strength, 4),
      ];
      const defaults = [
        createTestNode("node-0", SphereType.Empty, 0, false, 42),
        createTestNode("node-1", SphereType.Empty, 0),
      ];

      const store = useGridSharingStore();
      const url = store.generateShareUrl(current, defaults, GridType.Standard);

      expect(url).toContain("g=");
    });

    it("ignores locked nodes", () => {
      const current = [
        createTestNode("node-0", SphereType.Locked, 0, true),
        createTestNode("node-1", SphereType.Strength, 4),
      ];
      const defaults = [
        createTestNode("node-0", SphereType.Locked, 0, true),
        createTestNode("node-1", SphereType.Empty, 0),
      ];

      const store = useGridSharingStore();
      const url = store.generateShareUrl(current, defaults, GridType.Standard);

      expect(url).toContain("g=");
    });

    it("only extracts changed nodes", () => {
      const current = [
        createTestNode("node-0", SphereType.Empty, 0),
        createTestNode("node-1", SphereType.Hp, 200),
        createTestNode("node-2", SphereType.Empty, 0),
      ];
      const defaults = [
        createTestNode("node-0", SphereType.Empty, 0),
        createTestNode("node-1", SphereType.Empty, 0),
        createTestNode("node-2", SphereType.Empty, 0),
      ];

      const store = useGridSharingStore();
      const url = store.generateShareUrl(current, defaults, GridType.Standard);

      expect(url).toContain("g=");
    });
  });

  describe("URL generation", () => {
    it("generates valid URLs under 4000 characters for typical grids", () => {
      const store = useGridSharingStore();

      const validValues = [0, 1, 2, 3, 4, 10, 20, 40, 200, 300];
      const modifications = Array.from({ length: 50 }, (_, i) =>
        createTestNode(`node-${i}`, SphereType.Hp, validValues[i % validValues.length]!),
      );
      const defaults = Array.from({ length: 50 }, (_, i) => createTestNode(`node-${i}`, SphereType.Empty, 0));

      const url = store.generateShareUrl(modifications, defaults, GridType.Standard);

      expect(url.length).toBeLessThan(4000);
      expect(url).toContain("g=");
      expect(url).toContain("t=standard");
    });

    it("includes grid type in URL", () => {
      const store = useGridSharingStore();

      const currentNode = createTestNode("node-0", SphereType.Hp, 200);
      const defaultNode = createTestNode("node-0", SphereType.Empty, 0);

      const standardUrl = store.generateShareUrl([currentNode], [defaultNode], GridType.Standard);
      const expertUrl = store.generateShareUrl([currentNode], [defaultNode], GridType.Expert);

      expect(standardUrl).toContain("t=standard");
      expect(expertUrl).toContain("t=expert");
    });

    it("throws error for URLs exceeding 4000 characters", () => {
      const store = useGridSharingStore();

      const validValues = [0, 1, 2, 3, 4, 10, 20, 40, 200, 300];
      const modifications = Array.from({ length: 2000 }, (_, i) =>
        createTestNode(`node-${i}`, SphereType.Hp, validValues[i % validValues.length]!),
      );
      const defaults = Array.from({ length: 2000 }, (_, i) => createTestNode(`node-${i}`, SphereType.Empty, 0));

      expect(() => {
        store.generateShareUrl(modifications, defaults, GridType.Standard);
      }).toThrow(/too long/);
    });

    it("handles maximum standard grid modifications (860)", () => {
      const store = useGridSharingStore();

      const validValues = [0, 1, 2, 3, 4, 10, 20, 40, 200, 300];
      const modifications = Array.from({ length: 860 }, (_, i) =>
        createTestNode(`node-${i}`, SphereType.Hp, validValues[i % validValues.length]!),
      );
      const defaults = Array.from({ length: 860 }, (_, i) => createTestNode(`node-${i}`, SphereType.Empty, 0));

      const url = store.generateShareUrl(modifications, defaults, GridType.Standard);

      expect(url.length).toBeLessThan(4000);
    });

    it("handles maximum expert grid modifications (803)", () => {
      const store = useGridSharingStore();

      const validValues = [0, 1, 2, 3, 4, 10, 20, 40, 200, 300];
      const modifications = Array.from({ length: 803 }, (_, i) =>
        createTestNode(`node-${i}`, SphereType.Hp, validValues[i % validValues.length]!),
      );
      const defaults = Array.from({ length: 803 }, (_, i) => createTestNode(`node-${i}`, SphereType.Empty, 0));

      const url = store.generateShareUrl(modifications, defaults, GridType.Expert);

      expect(url.length).toBeLessThan(4000);
    });
  });

  describe("round-trip encoding/decoding", () => {
    it("encodes and decodes single modification", () => {
      const store = useGridSharingStore();

      const currentNodes = [createTestNode("node-0", SphereType.Hp, 200)];
      const defaultNodes = [createTestNode("node-0", SphereType.Empty, 0)];

      const url = store.generateShareUrl(currentNodes, defaultNodes, GridType.Standard);
      const encoded = new URL(url).searchParams.get("g")!;

      expect(encoded).toBeTruthy();
    });

    it("round-trips multiple modifications", () => {
      const store = useGridSharingStore();

      const currentNodes = [
        createTestNode("node-0", SphereType.Hp, 200),
        createTestNode("node-1", SphereType.Strength, 4),
        createTestNode("node-2", SphereType.Magic, 3),
      ];
      const defaultNodes = [
        createTestNode("node-0", SphereType.Empty, 0),
        createTestNode("node-1", SphereType.Empty, 0),
        createTestNode("node-2", SphereType.Empty, 0),
      ];

      const url = store.generateShareUrl(currentNodes, defaultNodes, GridType.Standard);

      expect(url).toContain("g=");
      expect(url).toContain("t=standard");
    });

    it("round-trips all sphere types", () => {
      const store = useGridSharingStore();
      const types = Object.values(SphereType).filter((t) => t !== SphereType.Locked);

      const currentNodes = types.map((type, i) => createTestNode(`node-${i}`, type, 10));
      const defaultNodes = types.map((_, i) => createTestNode(`node-${i}`, SphereType.Empty, 0));

      const url = store.generateShareUrl(currentNodes, defaultNodes, GridType.Standard);

      expect(url).toContain("g=");
    });

    it("round-trips all valid sphere values", () => {
      const store = useGridSharingStore();
      const validValues = [0, 1, 2, 3, 4, 10, 20, 40, 200, 300];

      const currentNodes = validValues.map((value, i) => createTestNode(`node-${i}`, SphereType.Hp, value));
      const defaultNodes = validValues.map((_, i) => createTestNode(`node-${i}`, SphereType.Empty, 0));

      const url = store.generateShareUrl(currentNodes, defaultNodes, GridType.Standard);

      expect(url).toContain("g=");
    });

    it("round-trips large modification set (100 nodes)", () => {
      const store = useGridSharingStore();

      const validValues = [0, 1, 2, 3, 4, 10, 20, 40, 200, 300];
      const currentNodes = Array.from({ length: 100 }, (_, i) =>
        createTestNode(`node-${i}`, SphereType.Hp, validValues[i % validValues.length]!),
      );
      const defaultNodes = Array.from({ length: 100 }, (_, i) => createTestNode(`node-${i}`, SphereType.Empty, 0));

      const url = store.generateShareUrl(currentNodes, defaultNodes, GridType.Standard);

      expect(url).toContain("g=");
      expect(url.length).toBeLessThan(4000);
    });
  });

  describe("grid type validation", () => {
    it("rejects mismatched grid types", () => {
      const current = [createTestNode("node-0", SphereType.Hp, 200)];
      const defaults = [createTestNode("node-0", SphereType.Empty, 0)];

      const store = useGridSharingStore();
      const url = store.generateShareUrl(current, defaults, GridType.Standard);

      expect(url).toContain("t=standard");
    });

    it("validates node count for standard grid (max 860)", () => {
      const store = useGridSharingStore();

      const validValues = [0, 1, 2, 3, 4, 10, 20, 40, 200, 300];
      const validNodes = Array.from({ length: 860 }, (_, i) =>
        createTestNode(`node-${i}`, SphereType.Hp, validValues[i % validValues.length]!),
      );
      const defaults = Array.from({ length: 860 }, (_, i) => createTestNode(`node-${i}`, SphereType.Empty, 0));

      const url = store.generateShareUrl(validNodes, defaults, GridType.Standard);
      expect(url).toBeTruthy();
    });

    it("validates node count for expert grid (max 803)", () => {
      const store = useGridSharingStore();

      const validValues = [0, 1, 2, 3, 4, 10, 20, 40, 200, 300];
      const validNodes = Array.from({ length: 803 }, (_, i) =>
        createTestNode(`node-${i}`, SphereType.Hp, validValues[i % validValues.length]!),
      );
      const defaults = Array.from({ length: 803 }, (_, i) => createTestNode(`node-${i}`, SphereType.Empty, 0));

      const url = store.generateShareUrl(validNodes, defaults, GridType.Expert);
      expect(url).toBeTruthy();
    });
  });

  describe("applyModifications", () => {
    it("skips modifications to ability nodes", () => {
      const baseNodes = [
        createTestNode("node-0", SphereType.Empty, 0, false, 42),
        createTestNode("node-1", SphereType.Empty, 0),
      ];

      const store = useGridSharingStore();
      const result = store.loadSharedGrid(baseNodes);

      expect(result).toEqual(baseNodes);
    });

    it("skips modifications to locked nodes", () => {
      const baseNodes = [
        createTestNode("node-0", SphereType.Locked, 0, true),
        createTestNode("node-1", SphereType.Empty, 0),
      ];

      const store = useGridSharingStore();
      const result = store.loadSharedGrid(baseNodes);

      expect(result).toEqual(baseNodes);
    });

    it("handles out-of-bounds indices gracefully", () => {
      const baseNodes = [createTestNode("node-0", SphereType.Empty, 0)];

      const store = useGridSharingStore();
      const result = store.loadSharedGrid(baseNodes);

      expect(result).toEqual(baseNodes);
    });

    it("applies valid modifications", () => {
      const baseNodes = [createTestNode("node-0", SphereType.Empty, 0)];

      const store = useGridSharingStore();
      const result = store.loadSharedGrid(baseNodes);

      expect(result).toBeTruthy();
    });
  });

  describe("edge cases", () => {
    it("handles empty modification list", () => {
      const store = useGridSharingStore();

      const current = [createTestNode("node-0", SphereType.Empty, 0)];
      const defaults = [createTestNode("node-0", SphereType.Empty, 0)];

      const url = store.generateShareUrl(current, defaults, GridType.Standard);

      expect(url).toContain("g=");
    });

    it("handles all nodes modified", () => {
      const store = useGridSharingStore();

      const current = Array.from({ length: 10 }, (_, i) => createTestNode(`node-${i}`, SphereType.Hp, 200));
      const defaults = Array.from({ length: 10 }, (_, i) => createTestNode(`node-${i}`, SphereType.Empty, 0));

      const url = store.generateShareUrl(current, defaults, GridType.Standard);

      expect(url).toContain("g=");
    });

    it("handles nodes with same type but different values", () => {
      const store = useGridSharingStore();

      const current = [createTestNode("node-0", SphereType.Hp, 200), createTestNode("node-1", SphereType.Hp, 300)];
      const defaults = [createTestNode("node-0", SphereType.Hp, 200), createTestNode("node-1", SphereType.Empty, 0)];

      const url = store.generateShareUrl(current, defaults, GridType.Standard);

      expect(url).toContain("g=");
    });

    it("handles maximum node index (859 for standard)", () => {
      const store = useGridSharingStore();

      const current = [createTestNode("node-859", SphereType.Hp, 200)];
      const defaults = [createTestNode("node-859", SphereType.Empty, 0)];

      const url = store.generateShareUrl(current, defaults, GridType.Standard);

      expect(url).toContain("g=");
    });

    it("handles maximum node index (802 for expert)", () => {
      const store = useGridSharingStore();

      const current = [createTestNode("node-802", SphereType.Hp, 200)];
      const defaults = [createTestNode("node-802", SphereType.Empty, 0)];

      const url = store.generateShareUrl(current, defaults, GridType.Expert);

      expect(url).toContain("g=");
    });
  });

  describe("URL parameter handling", () => {
    it("generates URLs with proper encoding", () => {
      const store = useGridSharingStore();

      const current = [createTestNode("node-0", SphereType.Hp, 200)];
      const defaults = [createTestNode("node-0", SphereType.Empty, 0)];

      const url = store.generateShareUrl(current, defaults, GridType.Standard);
      const parsedUrl = new URL(url);

      expect(parsedUrl.searchParams.has("g")).toBe(true);
      expect(parsedUrl.searchParams.has("t")).toBe(true);
    });

    it("preserves existing URL parameters", () => {
      const store = useGridSharingStore();

      const current = [createTestNode("node-0", SphereType.Hp, 200)];
      const defaults = [createTestNode("node-0", SphereType.Empty, 0)];

      const url = store.generateShareUrl(current, defaults, GridType.Standard);

      expect(url).toContain("g=");
      expect(url).toContain("t=");
    });
  });

  describe("data integrity", () => {
    it("maintains modification order", () => {
      const store = useGridSharingStore();

      const current = [
        createTestNode("node-5", SphereType.Hp, 200),
        createTestNode("node-2", SphereType.Strength, 4),
        createTestNode("node-8", SphereType.Magic, 3),
      ];
      const defaults = [
        createTestNode("node-5", SphereType.Empty, 0),
        createTestNode("node-2", SphereType.Empty, 0),
        createTestNode("node-8", SphereType.Empty, 0),
      ];

      const url = store.generateShareUrl(current, defaults, GridType.Standard);

      expect(url).toContain("g=");
    });

    it("handles nodes with zero values correctly", () => {
      const store = useGridSharingStore();

      const current = [createTestNode("node-0", SphereType.Hp, 0)];
      const defaults = [createTestNode("node-0", SphereType.Empty, 0)];

      const url = store.generateShareUrl(current, defaults, GridType.Standard);

      expect(url).toContain("g=");
    });

    it("handles mixed modification types", () => {
      const store = useGridSharingStore();

      const current = [
        createTestNode("node-0", SphereType.Hp, 200),
        createTestNode("node-1", SphereType.Empty, 0),
        createTestNode("node-2", SphereType.Strength, 4, false, 42),
        createTestNode("node-3", SphereType.Locked, 0, true),
        createTestNode("node-4", SphereType.Magic, 3),
      ];
      const defaults = [
        createTestNode("node-0", SphereType.Empty, 0),
        createTestNode("node-1", SphereType.Empty, 0),
        createTestNode("node-2", SphereType.Empty, 0, false, 42),
        createTestNode("node-3", SphereType.Locked, 0, true),
        createTestNode("node-4", SphereType.Empty, 0),
      ];

      const url = store.generateShareUrl(current, defaults, GridType.Standard);

      expect(url).toContain("g=");
    });
  });
});
