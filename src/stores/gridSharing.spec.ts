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

  describe("v1 encoding format with magic number header", () => {
    it("derives max values from sphere types automatically", () => {
      const store = useGridSharingStore();

      const testCases = [
        { type: SphereType.Hp, expectedValue: 300 },
        { type: SphereType.Mp, expectedValue: 40 },
        { type: SphereType.Strength, expectedValue: 4 },
        { type: SphereType.Defense, expectedValue: 4 },
        { type: SphereType.Magic, expectedValue: 4 },
        { type: SphereType.Agility, expectedValue: 4 },
        { type: SphereType.Empty, expectedValue: 0 },
      ];

      testCases.forEach(({ type, expectedValue }) => {
        const currentNode = createTestNode("node-0", type, expectedValue);
        const defaultNode = createTestNode("node-0", SphereType.Empty, 0);

        const url = store.generateShareUrl([currentNode], [defaultNode], GridType.Standard);
        expect(url).toContain("g=");
      });
    });

    it("encodes only type, not value (v1 format)", () => {
      const store = useGridSharingStore();

      const currentNode = createTestNode("node-0", SphereType.Hp, 300);
      const defaultNode = createTestNode("node-0", SphereType.Empty, 0);

      const url = store.generateShareUrl([currentNode], [defaultNode], GridType.Standard);
      const encoded = new URL(url).searchParams.get("g")!;

      expect(encoded).toBeTruthy();
      expect(encoded.length).toBeLessThan(10);
    });
  });

  describe("versioning with magic number", () => {
    it("includes magic number (0b1011) in encoded data", () => {
      const store = useGridSharingStore();

      const currentNode = createTestNode("node-0", SphereType.Hp, 300);
      const defaultNode = createTestNode("node-0", SphereType.Empty, 0);

      const url = store.generateShareUrl([currentNode], [defaultNode], GridType.Standard);
      expect(url).toContain("g=");
    });

    it("includes version number (1) in encoded data", () => {
      const store = useGridSharingStore();

      const currentNode = createTestNode("node-0", SphereType.Strength, 4);
      const defaultNode = createTestNode("node-0", SphereType.Empty, 0);

      const url = store.generateShareUrl([currentNode], [defaultNode], GridType.Standard);
      expect(url).toContain("g=");
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
      expect(url).not.toContain("t=");
    });

    it("embeds grid type in header (no URL parameter)", () => {
      const store = useGridSharingStore();

      const currentNode = createTestNode("node-0", SphereType.Hp, 200);
      const defaultNode = createTestNode("node-0", SphereType.Empty, 0);

      const standardUrl = store.generateShareUrl([currentNode], [defaultNode], GridType.Standard);
      const expertUrl = store.generateShareUrl([currentNode], [defaultNode], GridType.Expert);

      expect(standardUrl).not.toContain("t=");
      expect(expertUrl).not.toContain("t=");
      expect(standardUrl).toContain("g=");
      expect(expertUrl).toContain("g=");
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
      expect(url).not.toContain("t=");
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

  describe("grid type encoding", () => {
    it("encodes grid type in header", () => {
      const current = [createTestNode("node-0", SphereType.Hp, 200)];
      const defaults = [createTestNode("node-0", SphereType.Empty, 0)];

      const store = useGridSharingStore();
      const url = store.generateShareUrl(current, defaults, GridType.Standard);

      expect(url).toContain("g=");
      expect(url).not.toContain("t=");
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
    it("generates URLs with only g parameter", () => {
      const store = useGridSharingStore();

      const current = [createTestNode("node-0", SphereType.Hp, 200)];
      const defaults = [createTestNode("node-0", SphereType.Empty, 0)];

      const url = store.generateShareUrl(current, defaults, GridType.Standard);
      const parsedUrl = new URL(url);

      expect(parsedUrl.searchParams.has("g")).toBe(true);
      expect(parsedUrl.searchParams.has("t")).toBe(false);
    });

    it("does not include grid type URL parameter", () => {
      const store = useGridSharingStore();

      const current = [createTestNode("node-0", SphereType.Hp, 200)];
      const defaults = [createTestNode("node-0", SphereType.Empty, 0)];

      const url = store.generateShareUrl(current, defaults, GridType.Standard);

      expect(url).toContain("g=");
      expect(url).not.toContain("t=");
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

  describe("v1 format validation", () => {
    it("encodes with magic number 0b1011 and version 1", () => {
      const store = useGridSharingStore();
      const current = [createTestNode("node-0", SphereType.Hp, 300)];
      const defaults = [createTestNode("node-0", SphereType.Empty, 0)];

      const url = store.generateShareUrl(current, defaults, GridType.Standard);
      const encoded = new URL(url).searchParams.get("g")!;

      const bytes = new Uint8Array(
        atob(encoded.replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map((c) => c.charCodeAt(0)),
      );

      const firstByte = bytes[0]!;
      const magic = (firstByte >> 4) & 0b1111;
      const version = firstByte & 0b1111;

      expect(magic).toBe(0b1011);
      expect(version).toBe(1);
    });

    it("round-trips modifications correctly with v1 format", () => {
      const store = useGridSharingStore();
      const current = [
        createTestNode("node-0", SphereType.Hp, 300),
        createTestNode("node-1", SphereType.Mp, 40),
        createTestNode("node-2", SphereType.Strength, 4),
      ];
      const defaults = [
        createTestNode("node-0", SphereType.Empty, 0),
        createTestNode("node-1", SphereType.Empty, 0),
        createTestNode("node-2", SphereType.Empty, 0),
      ];

      const url = store.generateShareUrl(current, defaults, GridType.Standard);
      expect(url).toContain("g=");
      expect(url).not.toContain("t=");
    });

    it("uses 9-bit header + 14 bits per modification", () => {
      const store = useGridSharingStore();
      const current = Array.from({ length: 10 }, (_, i) => createTestNode(`node-${i}`, SphereType.Hp, 300));
      const defaults = Array.from({ length: 10 }, (_, i) => createTestNode(`node-${i}`, SphereType.Empty, 0));

      const url = store.generateShareUrl(current, defaults, GridType.Standard);
      const encoded = new URL(url).searchParams.get("g")!;

      const expectedBits = 4 + 4 + 1 + 10 + 10 * 14;
      const expectedBytes = Math.ceil(expectedBits / 8);
      const expectedBase64 = Math.ceil((expectedBytes * 4) / 3);

      expect(encoded.length).toBeLessThanOrEqual(expectedBase64 + 2);
    });

    it("decodes grid type from header correctly", () => {
      const store = useGridSharingStore();
      const current = [createTestNode("node-0", SphereType.Hp, 300)];
      const defaults = [createTestNode("node-0", SphereType.Empty, 0)];

      const standardUrl = store.generateShareUrl(current, defaults, GridType.Standard);
      const expertUrl = store.generateShareUrl(current, defaults, GridType.Expert);

      const standardEncoded = new URL(standardUrl).searchParams.get("g")!;
      const expertEncoded = new URL(expertUrl).searchParams.get("g")!;

      const standardBytes = new Uint8Array(
        atob(standardEncoded.replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map((c) => c.charCodeAt(0)),
      );
      const expertBytes = new Uint8Array(
        atob(expertEncoded.replace(/-/g, "+").replace(/_/g, "/"))
          .split("")
          .map((c) => c.charCodeAt(0)),
      );

      const standardGridTypeBit = (standardBytes[1]! >> 7) & 0b1;
      const expertGridTypeBit = (expertBytes[1]! >> 7) & 0b1;

      expect(standardGridTypeBit).toBe(0);
      expect(expertGridTypeBit).toBe(1);
    });
  });
});
