import { computed, ref } from "vue";
import { useLocalStorage } from "@vueuse/core";
import monstersData from "@/assets/monsters.json";

export interface MonsterCount {
  [monsterName: string]: number;
}

export interface LocationData {
  location: string;
  monsters: string[];
}

export interface LocationProgress {
  location: string;
  monsters: string[];
  totalMonsters: number;
  capturedMonsters: number;
  isComplete: boolean;
}

export function useMonsterArena() {
  // Persistent state - auto-saved on every change
  const monsterCounts = useLocalStorage<MonsterCount>("ffx-monster-arena-counts", {});

  // Checkpoint state - only saved when user manually saves
  const checkpointCounts = useLocalStorage<MonsterCount>("ffx-monster-arena-checkpoint", {});

  // Track last modified location
  const lastModifiedLocation = useLocalStorage<string | null>("ffx-monster-arena-last-location", null);

  // Track which locations are open
  const openLocations = useLocalStorage<Record<string, boolean>>("ffx-monster-arena-open-locations", {});

  // Load monster data
  const locations = ref<LocationData[]>(monstersData as LocationData[]);

  // Calculate if there are unsaved changes
  const hasUnsavedChanges = computed(() => {
    return JSON.stringify(monsterCounts.value) !== JSON.stringify(checkpointCounts.value);
  });

  // Get location for a monster
  const getLocationForMonster = (monsterName: string): string | null => {
    const location = locations.value.find((loc) => loc.monsters.includes(monsterName));
    return location?.location || null;
  };

  // Get count for a specific monster
  const getMonsterCount = (monsterName: string): number => {
    return monsterCounts.value[monsterName] || 0;
  };

  // Increment monster count (max 10)
  const incrementMonster = (monsterName: string) => {
    const current = getMonsterCount(monsterName);
    if (current < 10) {
      monsterCounts.value[monsterName] = current + 1;
      const location = getLocationForMonster(monsterName);
      if (location) {
        lastModifiedLocation.value = location;
      }
    }
  };

  // Decrement monster count (min 0)
  const decrementMonster = (monsterName: string) => {
    const current = getMonsterCount(monsterName);
    if (current > 0) {
      monsterCounts.value[monsterName] = current - 1;
      const location = getLocationForMonster(monsterName);
      if (location) {
        lastModifiedLocation.value = location;
      }
    }
  };

  // Check if a monster is complete (10/10)
  const isMonsterComplete = (monsterName: string): boolean => {
    return getMonsterCount(monsterName) === 10;
  };

  // Save checkpoint
  const saveCheckpoint = () => {
    checkpointCounts.value = { ...monsterCounts.value };
  };

  // Death reset - rollback to checkpoint
  const deathReset = () => {
    monsterCounts.value = { ...checkpointCounts.value };
  };

  // Calculate location progress
  const locationProgress = computed((): LocationProgress[] => {
    return locations.value.map((location) => {
      const capturedMonsters = location.monsters.filter((monster) => isMonsterComplete(monster)).length;

      return {
        location: location.location,
        monsters: location.monsters,
        totalMonsters: location.monsters.length,
        capturedMonsters,
        isComplete: capturedMonsters === location.monsters.length,
      };
    });
  });

  // Calculate overall statistics
  const totalMonsters = computed(() => {
    return locations.value.reduce((sum, location) => sum + location.monsters.length, 0);
  });

  const capturedMonsters = computed(() => {
    let count = 0;
    locations.value.forEach((location) => {
      location.monsters.forEach((monster) => {
        if (isMonsterComplete(monster)) {
          count++;
        }
      });
    });
    return count;
  });

  const totalLocations = computed(() => locations.value.length);

  const completedLocations = computed(() => {
    return locationProgress.value.filter((loc) => loc.isComplete).length;
  });

  // Check if a location is open
  const isLocationOpen = (location: string): boolean => {
    return openLocations.value[location] ?? false;
  };

  // Toggle location open state
  const toggleLocationOpen = (location: string) => {
    openLocations.value[location] = !isLocationOpen(location);
  };

  // Set location open state
  const setLocationOpen = (location: string, isOpen: boolean) => {
    openLocations.value[location] = isOpen;
  };

  return {
    locations,
    monsterCounts,
    hasUnsavedChanges,
    lastModifiedLocation,
    getMonsterCount,
    incrementMonster,
    decrementMonster,
    isMonsterComplete,
    saveCheckpoint,
    deathReset,
    locationProgress,
    totalMonsters,
    capturedMonsters,
    totalLocations,
    completedLocations,
    isLocationOpen,
    toggleLocationOpen,
    setLocationOpen,
  };
}
