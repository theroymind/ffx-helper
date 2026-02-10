import { ref, computed, watch } from "vue";
import { defineStore } from "pinia";
import { useUrlSearchParams } from "@vueuse/core";
import { SphereType } from "@/domain/grid/SphereType";
import type { SphereNode } from "@/domain/grid/SphereNode";
import { GridType } from "@/domain/grid/GridType";
import type { ModifiedNode } from "@/domain/grid/ModifiedNode";
import { BitWriter } from "@/utils/BitWriter";
import { BitReader } from "@/utils/BitReader";
import { useAnalytics } from "@/composables/useAnalytics";
import { sphereTypeInfo } from "@/constants/sphere";

const MAX_NODES_STANDARD = 860;
const MAX_NODES_EXPERT = 803;
const MAX_URL_LENGTH = 4000;
const SPHERE_TYPES = Object.values(SphereType);

const MAGIC_NUMBER = 0b1011;
const ENCODING_VERSION = 1;

export const useGridSharingStore = defineStore("gridSharing", () => {
  const params = useUrlSearchParams("history");
  const isSharedView = ref(false);
  const sharedGridType = ref<GridType | null>(null);
  const sharedModifications = ref<ModifiedNode[]>([]);
  const { trackGridShared } = useAnalytics();

  function typeToInt(type: SphereType): number {
    const index = SPHERE_TYPES.indexOf(type);
    if (index === -1) {
      throw new Error(`Invalid sphere type: ${type}`);
    }
    return index;
  }

  function intToType(value: number): SphereType {
    if (value < 0 || value >= SPHERE_TYPES.length) {
      throw new Error(`Invalid sphere type index: ${value} (must be 0-${SPHERE_TYPES.length - 1})`);
    }
    const type = SPHERE_TYPES[value];
    if (!type) {
      throw new Error(`Invalid sphere type index: ${value}`);
    }
    return type;
  }

  function base64UrlEncode(bytes: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      const byte = bytes[i];
      if (byte === undefined) {
        throw new Error("Unexpected undefined byte");
      }
      binary += String.fromCharCode(byte);
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  }

  function base64UrlDecode(str: string): Uint8Array {
    try {
      str = str.replace(/-/g, "+").replace(/_/g, "/");
      while (str.length % 4) {
        str += "=";
      }
      const binary = atob(str);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    } catch (error) {
      throw new Error(`Invalid base64 encoding: ${error instanceof Error ? error.message : "unknown error"}`);
    }
  }

  function encodeModifiedNodes(modifications: ModifiedNode[], gridType: GridType): string {
    const writer = new BitWriter();

    writer.write(MAGIC_NUMBER, 4);
    writer.write(ENCODING_VERSION, 4);
    writer.write(gridType === GridType.Expert ? 1 : 0, 1);
    writer.write(modifications.length, 10);

    modifications.forEach((mod) => {
      writer.write(mod.index, 10);
      writer.write(typeToInt(mod.type), 4);
    });

    return base64UrlEncode(writer.toBytes());
  }

  function decodeV1(reader: BitReader): { modifications: ModifiedNode[]; gridType: GridType } {
    const gridTypeBit = reader.read(1);
    const gridType = gridTypeBit === 1 ? GridType.Expert : GridType.Standard;
    const maxNodes = gridType === GridType.Expert ? MAX_NODES_EXPERT : MAX_NODES_STANDARD;
    const count = reader.read(10);

    if (count > maxNodes) {
      throw new Error(`Invalid modification count: ${count} exceeds maximum ${maxNodes} for ${gridType} grid`);
    }

    const modifications: ModifiedNode[] = [];

    for (let i = 0; i < count; i++) {
      const index = reader.read(10);

      if (index >= maxNodes) {
        throw new Error(`Invalid node index: ${index} exceeds maximum ${maxNodes - 1} for ${gridType} grid`);
      }

      const type = intToType(reader.read(4));
      const value = sphereTypeInfo[type].statValue;

      modifications.push({
        index,
        type,
        value,
      });
    }

    return { modifications, gridType };
  }

  function decodeModifiedNodes(encoded: string): { modifications: ModifiedNode[]; gridType: GridType } {
    const bytes = base64UrlDecode(encoded);
    const reader = new BitReader(bytes);

    const magic = reader.read(4);

    if (magic !== MAGIC_NUMBER) {
      throw new Error(
        `Invalid data format: expected magic number ${MAGIC_NUMBER.toString(2)}, got ${magic.toString(2)}`,
      );
    }

    const version = reader.read(4);

    if (version === 1) {
      return decodeV1(reader);
    } else {
      throw new Error(`Unsupported encoding version: ${version}`);
    }
  }

  function extractModifiedNodes(nodes: SphereNode[], defaultNodes: SphereNode[]): ModifiedNode[] {
    if (nodes.length !== defaultNodes.length) {
      throw new Error(
        `Node count mismatch: current grid has ${nodes.length} nodes, default grid has ${defaultNodes.length} nodes`,
      );
    }

    const modifications: ModifiedNode[] = [];

    for (let index = 0; index < nodes.length; index++) {
      const node = nodes[index];
      const defaultNode = defaultNodes[index];

      if (!node || !defaultNode) continue;
      if (node.abilityId) continue;
      if (node.locked && node.type === "locked") continue;

      if (node.type !== defaultNode.type || node.value !== defaultNode.value) {
        modifications.push({
          index,
          type: node.type,
          value: node.value,
        });
      }
    }

    return modifications;
  }

  function applyModifications(baseNodes: SphereNode[], modifications: ModifiedNode[]): SphereNode[] {
    const nodes = [...baseNodes];
    let appliedCount = 0;
    let skippedCount = 0;

    modifications.forEach((mod) => {
      if (mod.index < 0 || mod.index >= nodes.length) {
        console.warn(`Skipping modification: index ${mod.index} out of bounds (0-${nodes.length - 1})`);
        skippedCount++;
        return;
      }

      const node = nodes[mod.index];
      if (!node) {
        console.warn(`Skipping modification: node at index ${mod.index} not found`);
        skippedCount++;
        return;
      }

      if (node.abilityId) {
        console.warn(`Skipping modification: node at index ${mod.index} is an ability node`);
        skippedCount++;
        return;
      }

      if (node.locked) {
        console.warn(`Skipping modification: node at index ${mod.index} is locked`);
        skippedCount++;
        return;
      }

      nodes[mod.index] = {
        ...node,
        type: mod.type,
        value: mod.value,
      };
      appliedCount++;
    });

    if (skippedCount > 0) {
      console.warn(`Applied ${appliedCount} modifications, skipped ${skippedCount} invalid modifications`);
    }

    return nodes;
  }

  function loadFromUrl() {
    const gridData = params.g as string | null;

    if (gridData) {
      try {
        const { modifications, gridType } = decodeModifiedNodes(gridData);

        sharedModifications.value = modifications;
        sharedGridType.value = gridType;
        isSharedView.value = true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("Failed to decode shared grid:", errorMessage);
        clearSharedView();
      }
    } else {
      clearSharedView();
    }
  }

  function clearSharedView() {
    isSharedView.value = false;
    sharedGridType.value = null;
    sharedModifications.value = [];
  }

  function generateShareUrl(nodes: SphereNode[], defaultNodes: SphereNode[], gridType: GridType): string {
    const modifications = extractModifiedNodes(nodes, defaultNodes);
    const encoded = encodeModifiedNodes(modifications, gridType);

    const url = new URL(window.location.href);
    url.searchParams.set("g", encoded);

    const urlString = url.toString();

    if (urlString.length > MAX_URL_LENGTH) {
      throw new Error(
        `Generated URL is too long (${urlString.length} characters). ` +
          `Maximum recommended length is ${MAX_URL_LENGTH} characters. ` +
          `Try reducing the number of modifications.`,
      );
    }

    trackGridShared("link");
    return urlString;
  }

  function loadSharedGrid(defaultNodes: SphereNode[]): SphereNode[] {
    if (!isSharedView.value) {
      return defaultNodes;
    }
    return applyModifications(defaultNodes, sharedModifications.value);
  }

  function clearShareParams() {
    delete params.g;
    clearSharedView();
  }

  watch(
    () => params.g,
    () => {
      loadFromUrl();
    },
    { immediate: true },
  );

  return {
    isSharedView: computed(() => isSharedView.value),
    sharedGridType: computed(() => sharedGridType.value),
    generateShareUrl,
    loadSharedGrid,
    clearShareParams,
  };
});
