import type { Stats } from "./Stats";

export interface SphereTypeInfo {
  label: string;
  shortLabel: string;
  statValue: number;
  statKey: keyof Stats | null;
}
