import { computed, inject, type InjectionKey, type ComputedRef } from "vue";
import { SphereType } from "@/domain/grid/SphereType";
import type { Stats } from "@/domain/grid/Stats";
import { sphereTypeInfo, baseStats } from "@/constants/sphere";
import type { GridState } from "@/composables/useGridState";

export interface GridStats {
  stats: ComputedRef<Stats>;
  sphereCounts: ComputedRef<Record<string, number>>;
  overriddenSphereCounts: ComputedRef<{ counts: Record<string, number>; total: number }>;
}

export const gridStatsKey: InjectionKey<GridStats> = Symbol("gridStats");

export function useGridStats(gridState: GridState): GridStats {
  const stats = computed<Stats>(() => {
    const result: Stats = { ...baseStats };

    gridState.sphereData.value.nodes.forEach((node) => {
      const info = sphereTypeInfo[node.type];
      if (info && info.statKey && node.value) {
        result[info.statKey] += node.value;
      }
    });

    return result;
  });

  const sphereCounts = computed(() => {
    const counts = Object.fromEntries(Object.keys(sphereTypeInfo).map((type) => [type, 0])) as Record<string, number>;

    gridState.sphereData.value.nodes.forEach((node) => {
      if (!node.abilityId && node.type !== SphereType.Empty) {
        const currentCount = counts[node.type] ?? 0;
        counts[node.type] = currentCount + 1;
      }
    });

    return counts;
  });

  const overriddenSphereCounts = computed(() => {
    const counts = Object.fromEntries(Object.keys(sphereTypeInfo).map((type) => [type, 0])) as Record<string, number>;

    let totalOverridden = 0;

    gridState.sphereData.value.nodes.forEach((node, index) => {
      const defaultNode = gridState.defaultNodes.value[index];

      if (defaultNode && !node.abilityId) {
        const hasChanged = node.type !== defaultNode.type || node.value !== defaultNode.value;

        if (hasChanged) {
          const currentCount = counts[node.type] ?? 0;
          counts[node.type] = currentCount + 1;
          totalOverridden++;
        }
      }
    });

    return {
      counts,
      total: totalOverridden,
    };
  });

  return {
    stats,
    sphereCounts,
    overriddenSphereCounts,
  };
}

export function injectGridStats(): GridStats {
  const stats = inject(gridStatsKey);
  if (!stats) {
    throw new Error("useGridStats must be used within a SphereGridProvider");
  }
  return stats;
}
