export type SphereType =
  | 'empty'
  | 'hp'
  | 'mp'
  | 'strength'
  | 'defense'
  | 'magic'
  | 'magicDef'
  | 'agility'
  | 'accuracy'
  | 'evasion'
  | 'luck'
  | 'locked'

export interface SphereNode {
  id: string
  type: SphereType
  value: number
  locked: boolean
  abilityId?: number | null
  abilityName?: string
}

export interface Stats {
  hp: number
  mp: number
  strength: number
  defense: number
  magic: number
  magicDef: number
  agility: number
  accuracy: number
  evasion: number
  luck: number
}

export interface SphereTypeInfo {
  label: string
  shortLabel: string
  statValue: number
  statKey: keyof Stats | null
}

export interface SphereGridData {
  nodes: SphereNode[]
  edges: Array<{ source: string; target: string }>
  positions: Record<string, { x: number; y: number }>
}
