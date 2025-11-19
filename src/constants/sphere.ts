import type { SphereType, SphereTypeInfo, Stats } from "@/types/sphere";
import defenseIcon from "@/assets/spheres/DEF_Sprite.png";
import strengthIcon from "@/assets/spheres/STR_Sprite.png";
import abilityIconImg from "@/assets/spheres/ABI_Sprite.png";
import accuracyIcon from "@/assets/spheres/ACC_Sprite.png";
import evasionIcon from "@/assets/spheres/EVA_Sprite.png";
import agilityIcon from "@/assets/spheres/AGI_Sprite.png";
import magicIcon from "@/assets/spheres/MAG_Sprite.png";
import magicDefIcon from "@/assets/spheres/MDF_Sprite.png";
import luckIcon from "@/assets/spheres/LUC_Sprite.png";
import hpIcon from "@/assets/spheres/HP_Sprite.png";
import mpIcon from "@/assets/spheres/MP_Sprite.png";

// Helper to get CSS custom property color values at runtime
export const getCssColor = (propertyName: string): string => {
  if (typeof window === "undefined") return "#333333";
  const computedStyle = getComputedStyle(document.documentElement);
  return computedStyle.getPropertyValue(propertyName).trim() || "#333333";
};

// Get sphere colors from CSS custom properties (single source of truth from styles.css)
export const getSphereColors = (): Record<SphereType, string> => ({
  empty: "#333333",
  hp: getCssColor("--sphere-hp"),
  mp: getCssColor("--sphere-mp"),
  strength: getCssColor("--sphere-strength"),
  defense: getCssColor("--sphere-defense"),
  magic: getCssColor("--sphere-magic"),
  magicDef: getCssColor("--sphere-magicDef"),
  agility: getCssColor("--sphere-agility"),
  accuracy: getCssColor("--sphere-accuracy"),
  evasion: getCssColor("--sphere-evasion"),
  luck: getCssColor("--sphere-luck"),
  locked: getCssColor("--sphere-locked"),
});

export const abilityNodeColor = getCssColor("--sphere-ability");
export const abilityIcon = abilityIconImg;

export const sphereIcons: Partial<Record<SphereType, string>> = {
  strength: strengthIcon,
  defense: defenseIcon,
  magic: magicIcon,
  magicDef: magicDefIcon,
  agility: agilityIcon,
  accuracy: accuracyIcon,
  evasion: evasionIcon,
  luck: luckIcon,
  hp: hpIcon,
  mp: mpIcon,
  locked:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWxvY2sta2V5aG9sZS1pY29uIGx1Y2lkZS1sb2NrLWtleWhvbGUiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTYiIHI9IjEiLz48cmVjdCB4PSIzIiB5PSIxMCIgd2lkdGg9IjE4IiBoZWlnaHQ9IjEyIiByeD0iMiIvPjxwYXRoIGQ9Ik03IDEwVjdhNSA1IDAgMCAxIDEwIDB2MyIvPjwvc3ZnPg==",
};

// Sphere type labels and values
export const sphereTypeInfo: Record<SphereType, SphereTypeInfo> = {
  empty: { label: "Empty", shortLabel: "---", statValue: 0, statKey: null },
  hp: { label: "HP", shortLabel: "HP", statValue: 300, statKey: "hp" },
  mp: { label: "MP", shortLabel: "MP", statValue: 40, statKey: "mp" },
  strength: { label: "Strength", shortLabel: "STR", statValue: 4, statKey: "strength" },
  defense: { label: "Defense", shortLabel: "DEF", statValue: 4, statKey: "defense" },
  magic: { label: "Magic", shortLabel: "MAG", statValue: 4, statKey: "magic" },
  magicDef: { label: "Magic Def", shortLabel: "MDF", statValue: 4, statKey: "magicDef" },
  agility: { label: "Agility", shortLabel: "AGI", statValue: 4, statKey: "agility" },
  accuracy: { label: "Accuracy", shortLabel: "ACC", statValue: 4, statKey: "accuracy" },
  evasion: { label: "Evasion", shortLabel: "EVA", statValue: 4, statKey: "evasion" },
  luck: { label: "Luck", shortLabel: "LCK", statValue: 4, statKey: "luck" },
  locked: { label: "Locked", shortLabel: "LCKD", statValue: 0, statKey: null },
};

// Base stats from FFX
export const baseStats: Stats = {
  hp: 380, // lowest stat : Lulu
  mp: 10, // lowest stat: Wakka
  strength: 5, // lowest stat: Yuna/Lulu
  defense: 5, // lowest stat: Yuna/Tidus
  magic: 5, // lowest stat: Auron/Tidus
  magicDef: 5, // lowest stat: Tidus/Wakka/Auron/Kimahri
  agility: 5, // lowest stat: Auron
  accuracy: 3, // lowest stat: Yuna/Lulu/Auron
  evasion: 5, // lowest stat: Wakka/Kimahri/Rikku/Auron
  luck: 17, // lowest stat: Lulu/Yuna/Auron
};

// Map FFX attribute names to our sphere types
export const mapAttributeToType = (
  attributeName: string | null,
  abilityId: number | null,
  lockLevel: number | null,
): SphereType => {
  if (lockLevel !== null) return "locked";
  if (abilityId !== null) return "empty";
  if (!attributeName) return "empty";

  const attributeMap: Record<string, SphereType> = {
    HP: "hp",
    MP: "mp",
    Strength: "strength",
    Defense: "defense",
    Magic: "magic",
    "Magic Defense": "magicDef",
    Agility: "agility",
    Accuracy: "accuracy",
    Evasion: "evasion",
    Luck: "luck",
  };

  return attributeMap[attributeName] || "empty";
};
