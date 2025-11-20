import type { SphereType } from "./SphereType";

export interface SphereNode {
  id: string;
  type: SphereType;
  value: number;
  locked: boolean;
  abilityId?: number | null;
  abilityName?: string;
}
