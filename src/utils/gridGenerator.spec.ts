import { describe, it, expect } from "vitest";
import { generateSphereGrid, getAbilityName } from "./gridGenerator";
import { GridType } from "@/domain/grid/GridType";
import { SphereType } from "@/domain/grid/SphereType";

describe("gridGenerator", () => {
  describe("generateSphereGrid", () => {
    it("generates standard grid with correct number of nodes", () => {
      const grid = generateSphereGrid(GridType.Standard);
      expect(grid.nodes.length).toBe(860);
    });

    it("generates expert grid with correct number of nodes", () => {
      const grid = generateSphereGrid(GridType.Expert);
      expect(grid.nodes.length).toBe(803);
    });

    it("generates nodes with required properties", () => {
      const grid = generateSphereGrid(GridType.Standard);
      const node = grid.nodes[0]!;

      expect(node).toHaveProperty("id");
      expect(node).toHaveProperty("type");
      expect(node).toHaveProperty("value");
      expect(node).toHaveProperty("locked");
      expect(node.id).toMatch(/^node-\d+$/);
    });

    it("generates edges connecting nodes", () => {
      const grid = generateSphereGrid(GridType.Standard);
      const edge = grid.edges[0]!;

      expect(grid.edges.length).toBeGreaterThan(0);
      expect(edge).toHaveProperty("source");
      expect(edge).toHaveProperty("target");
    });

    it("generates positions for all nodes", () => {
      const grid = generateSphereGrid(GridType.Standard);

      expect(Object.keys(grid.positions).length).toBe(grid.nodes.length);
      grid.nodes.forEach((node) => {
        expect(grid.positions[node.id]).toBeDefined();
        expect(grid.positions[node.id]).toHaveProperty("x");
        expect(grid.positions[node.id]).toHaveProperty("y");
      });
    });

    it("identifies ability nodes correctly", () => {
      const grid = generateSphereGrid(GridType.Standard);
      const abilityNodes = grid.nodes.filter((n) => n.abilityId !== undefined && n.abilityId !== null);

      expect(abilityNodes.length).toBeGreaterThan(0);
      abilityNodes.forEach((node) => {
        expect(node.locked).toBe(true);
        expect(node.abilityName).toBeDefined();
      });
    });

    it("identifies locked nodes correctly", () => {
      const grid = generateSphereGrid(GridType.Standard);
      const lockedNodes = grid.nodes.filter((n) => n.type === SphereType.Locked);

      expect(lockedNodes.length).toBeGreaterThan(0);
      lockedNodes.forEach((node) => {
        expect(node.locked).toBe(true);
      });
    });

    it("generates deduped edges", () => {
      const grid = generateSphereGrid(GridType.Standard);
      const edgeSet = new Set<string>();

      grid.edges.forEach((edge) => {
        const key1 = `${edge.source}-${edge.target}`;
        const key2 = `${edge.target}-${edge.source}`;

        expect(edgeSet.has(key1)).toBe(false);
        expect(edgeSet.has(key2)).toBe(false);

        edgeSet.add(key1);
      });
    });

    it("defaults to standard grid when no type specified", () => {
      const grid = generateSphereGrid();
      expect(grid.nodes.length).toBe(860);
    });
  });

  describe("getAbilityName", () => {
    it("returns ability name for valid ability id", () => {
      const name = getAbilityName(1);
      expect(typeof name).toBe("string");
      expect(name.length).toBeGreaterThan(0);
    });

    it("returns fallback for unknown ability id", () => {
      const name = getAbilityName(99999);
      expect(name).toBe("Ability 99999");
    });
  });
});
