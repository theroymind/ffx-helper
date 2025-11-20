import { SphereType } from "@/domain/grid/SphereType";
import type { SphereTypeInfo } from "@/domain/grid/SphereTypeInfo";
import type { Stats } from "@/domain/grid/Stats";
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
  [SphereType.Empty]: "#333333",
  [SphereType.Hp]: getCssColor("--sphere-hp"),
  [SphereType.Mp]: getCssColor("--sphere-mp"),
  [SphereType.Strength]: getCssColor("--sphere-strength"),
  [SphereType.Defense]: getCssColor("--sphere-defense"),
  [SphereType.Magic]: getCssColor("--sphere-magic"),
  [SphereType.MagicDef]: getCssColor("--sphere-magicDef"),
  [SphereType.Agility]: getCssColor("--sphere-agility"),
  [SphereType.Accuracy]: getCssColor("--sphere-accuracy"),
  [SphereType.Evasion]: getCssColor("--sphere-evasion"),
  [SphereType.Luck]: getCssColor("--sphere-luck"),
  [SphereType.Locked]: getCssColor("--sphere-locked"),
});

export const abilityNodeColor = getCssColor("--sphere-ability");
export const abilityIcon = abilityIconImg;

export const sphereIcons: Partial<Record<SphereType, string>> = {
  [SphereType.Strength]: strengthIcon,
  [SphereType.Defense]: defenseIcon,
  [SphereType.Magic]: magicIcon,
  [SphereType.MagicDef]: magicDefIcon,
  [SphereType.Agility]: agilityIcon,
  [SphereType.Accuracy]: accuracyIcon,
  [SphereType.Evasion]: evasionIcon,
  [SphereType.Luck]: luckIcon,
  [SphereType.Hp]: hpIcon,
  [SphereType.Mp]: mpIcon,
  [SphereType.Locked]:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWxvY2sta2V5aG9sZS1pY29uIGx1Y2lkZS1sb2NrLWtleWhvbGUiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTYiIHI9IjEiLz48cmVjdCB4PSIzIiB5PSIxMCIgd2lkdGg9IjE4IiBoZWlnaHQ9IjEyIiByeD0iMiIvPjxwYXRoIGQ9Ik03IDEwVjdhNSA1IDAgMCAxIDEwIDB2MyIvPjwvc3ZnPg==",
};

// Sphere type labels and values
export const sphereTypeInfo: Record<SphereType, SphereTypeInfo> = {
  [SphereType.Empty]: { label: "Empty", shortLabel: "---", statValue: 0, statKey: null },
  [SphereType.Hp]: { label: "HP", shortLabel: "HP", statValue: 300, statKey: "hp" },
  [SphereType.Mp]: { label: "MP", shortLabel: "MP", statValue: 40, statKey: "mp" },
  [SphereType.Strength]: { label: "Strength", shortLabel: "STR", statValue: 4, statKey: "strength" },
  [SphereType.Defense]: { label: "Defense", shortLabel: "DEF", statValue: 4, statKey: "defense" },
  [SphereType.Magic]: { label: "Magic", shortLabel: "MAG", statValue: 4, statKey: "magic" },
  [SphereType.MagicDef]: { label: "Magic Def", shortLabel: "MDF", statValue: 4, statKey: "magicDef" },
  [SphereType.Agility]: { label: "Agility", shortLabel: "AGI", statValue: 4, statKey: "agility" },
  [SphereType.Accuracy]: { label: "Accuracy", shortLabel: "ACC", statValue: 4, statKey: "accuracy" },
  [SphereType.Evasion]: { label: "Evasion", shortLabel: "EVA", statValue: 4, statKey: "evasion" },
  [SphereType.Luck]: { label: "Luck", shortLabel: "LCK", statValue: 4, statKey: "luck" },
  [SphereType.Locked]: { label: "Locked", shortLabel: "LCKD", statValue: 0, statKey: null },
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
  if (lockLevel !== null) return SphereType.Locked;
  if (abilityId !== null) return SphereType.Empty;
  if (!attributeName) return SphereType.Empty;

  const attributeMap: Record<string, SphereType> = {
    HP: SphereType.Hp,
    MP: SphereType.Mp,
    Strength: SphereType.Strength,
    Defense: SphereType.Defense,
    Magic: SphereType.Magic,
    "Magic Defense": SphereType.MagicDef,
    Agility: SphereType.Agility,
    Accuracy: SphereType.Accuracy,
    Evasion: SphereType.Evasion,
    Luck: SphereType.Luck,
  };

  return attributeMap[attributeName] || SphereType.Empty;
};
