import { ref, computed, watch } from "vue";
import { defineStore } from "pinia";
import { useUrlSearchParams } from "@vueuse/core";
import type { SphereNode, SphereType } from "@/types/sphere";
import type { GridType } from "@/composables/useSphereData";

const MAX_NODES_STANDARD = 860;
const MAX_NODES_EXPERT = 803;
const MAX_URL_LENGTH = 2000;

export interface ModifiedNode {
  index: number;
  type: SphereType;
  value: number;
}

class BitWriter {
  private bytes: number[] = [];
  private currentByte = 0;
  private bitPosition = 0;

  write(value: number, numBits: number) {
    for (let i = numBits - 1; i >= 0; i--) {
      const bit = (value >> i) & 1;
      this.currentByte = (this.currentByte << 1) | bit;
      this.bitPosition++;

      if (this.bitPosition === 8) {
        this.bytes.push(this.currentByte);
        this.currentByte = 0;
        this.bitPosition = 0;
      }
    }
  }

  toBytes(): Uint8Array {
    if (this.bitPosition > 0) {
      this.currentByte <<= 8 - this.bitPosition;
      this.bytes.push(this.currentByte);
    }
    return new Uint8Array(this.bytes);
  }
}

class BitReader {
  private bytes: Uint8Array;
  private byteIndex = 0;
  private bitPosition = 0;

  constructor(bytes: Uint8Array) {
    this.bytes = bytes;
  }

  read(numBits: number): number {
    let value = 0;

    for (let i = 0; i < numBits; i++) {
      if (this.byteIndex >= this.bytes.length) {
        throw new Error("Unexpected end of data");
      }

      const currentByte = this.bytes[this.byteIndex];
      if (currentByte === undefined) {
        throw new Error("Unexpected end of data");
      }

      const bit = (currentByte >> (7 - this.bitPosition)) & 1;
      value = (value << 1) | bit;
      this.bitPosition++;

      if (this.bitPosition === 8) {
        this.byteIndex++;
        this.bitPosition = 0;
      }
    }

    return value;
  }

  hasMore(): boolean {
    return this.byteIndex < this.bytes.length || (this.byteIndex === this.bytes.length - 1 && this.bitPosition > 0);
  }
}

const SPHERE_TYPES: SphereType[] = [
  "empty",
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
  "locked",
];

const VALID_VALUES = [0, 1, 2, 3, 4, 20, 40, 200];

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

function valueToInt(value: number): number {
  const index = VALID_VALUES.indexOf(value);
  if (index === -1) {
    throw new Error(`Invalid sphere value: ${value} (expected one of: ${VALID_VALUES.join(", ")})`);
  }
  return index;
}

function intToValue(index: number): number {
  if (index < 0 || index >= VALID_VALUES.length) {
    throw new Error(`Invalid value index: ${index} (must be 0-${VALID_VALUES.length - 1})`);
  }
  const value = VALID_VALUES[index];
  if (value === undefined) {
    throw new Error(`Invalid value index: ${index}`);
  }
  return value;
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

function encodeModifiedNodes(modifications: ModifiedNode[]): string {
  const writer = new BitWriter();

  writer.write(modifications.length, 10);

  modifications.forEach((mod) => {
    writer.write(mod.index, 10);
    writer.write(typeToInt(mod.type), 4);
    writer.write(valueToInt(mod.value), 3);
  });

  return base64UrlEncode(writer.toBytes());
}

function decodeModifiedNodes(encoded: string, gridType: GridType = "standard"): ModifiedNode[] {
  const bytes = base64UrlDecode(encoded);
  const reader = new BitReader(bytes);

  const maxNodes = gridType === "expert" ? MAX_NODES_EXPERT : MAX_NODES_STANDARD;
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

    modifications.push({
      index,
      type: intToType(reader.read(4)),
      value: intToValue(reader.read(3)),
    });
  }

  return modifications;
}

function extractModifiedNodes(nodes: SphereNode[], defaultNodes: SphereNode[]): ModifiedNode[] {
  if (nodes.length !== defaultNodes.length) {
    throw new Error(`Node count mismatch: current grid has ${nodes.length} nodes, default grid has ${defaultNodes.length} nodes`);
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

export const useGridSharingStore = defineStore("gridSharing", () => {
  const params = useUrlSearchParams("history");
  const isSharedView = ref(false);
  const sharedGridType = ref<GridType | null>(null);
  const sharedModifications = ref<ModifiedNode[]>([]);

  function loadFromUrl() {
    const gridData = params.g as string | null;
    const gridTypeParam = params.t as string | null;

    if (gridData && gridTypeParam) {
      try {
        const gridType = gridTypeParam === "expert" ? "expert" : "standard";
        const modifications = decodeModifiedNodes(gridData, gridType);

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
    const encoded = encodeModifiedNodes(modifications);

    const url = new URL(window.location.href);
    url.searchParams.set("g", encoded);
    url.searchParams.set("t", gridType);

    const urlString = url.toString();

    if (urlString.length > MAX_URL_LENGTH) {
      throw new Error(
        `Generated URL is too long (${urlString.length} characters). ` +
          `Maximum recommended length is ${MAX_URL_LENGTH} characters. ` +
          `Try reducing the number of modifications.`,
      );
    }

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
    delete params.t;
    clearSharedView();
  }

  watch(
    () => [params.g, params.t],
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
