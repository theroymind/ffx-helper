import type { SphereType, SphereTypeInfo, Stats } from '@/types/sphere'

// Color mapping for sphere types
export const sphereColors: Record<SphereType, string> = {
  empty: '#333333',
  hp: '#22c55e', // green
  mp: '#3b82f6', // blue
  strength: '#f97316', // orange
  defense: '#0ea5e9', // cyan
  magic: '#a855f7', // purple
  magicDef: '#ec4899', // pink
  agility: '#06b6d4', // teal
  accuracy: '#eab308', // yellow
  evasion: '#94a3b8', // slate
  luck: '#fbbf24', // amber
  locked: '#71717a', // gray
}

// Bright pink color for ability nodes
export const abilityNodeColor = '#ff1ac6'

// Sphere type labels and values
export const sphereTypeInfo: Record<SphereType, SphereTypeInfo> = {
  empty: { label: 'Empty', shortLabel: '---', statValue: 0, statKey: null },
  hp: { label: 'HP', shortLabel: 'HP', statValue: 300, statKey: 'hp' },
  mp: { label: 'MP', shortLabel: 'MP', statValue: 40, statKey: 'mp' },
  strength: { label: 'Strength', shortLabel: 'STR', statValue: 4, statKey: 'strength' },
  defense: { label: 'Defense', shortLabel: 'DEF', statValue: 4, statKey: 'defense' },
  magic: { label: 'Magic', shortLabel: 'MAG', statValue: 4, statKey: 'magic' },
  magicDef: { label: 'Magic Def', shortLabel: 'MDF', statValue: 4, statKey: 'magicDef' },
  agility: { label: 'Agility', shortLabel: 'AGI', statValue: 4, statKey: 'agility' },
  accuracy: { label: 'Accuracy', shortLabel: 'ACC', statValue: 4, statKey: 'accuracy' },
  evasion: { label: 'Evasion', shortLabel: 'EVA', statValue: 4, statKey: 'evasion' },
  luck: { label: 'Luck', shortLabel: 'LCK', statValue: 4, statKey: 'luck' },
  locked: { label: 'Locked', shortLabel: 'LCKD', statValue: 0, statKey: null },
}

export const sphereButtonClasses: Record<SphereType, string> = {
  empty: 'border-zinc-700/60 bg-zinc-900/80 text-zinc-400 hover:bg-zinc-800/60',
  hp: 'text-white',
  mp: 'text-white',
  strength: 'text-white',
  defense: 'text-white',
  magic: 'text-white',
  magicDef: 'text-white',
  agility: 'text-white',
  accuracy: 'text-white',
  evasion: 'text-white',
  luck: 'text-white',
  locked: 'border-zinc-600 bg-zinc-800 text-zinc-300',
}

// Base stats from FFX
export const baseStats: Stats = {
  hp: 333,
  mp: 59,
  strength: 63,
  defense: 63,
  magic: 63,
  magicDef: 63,
  agility: 63,
  accuracy: 8,
  evasion: 8,
  luck: 60,
}

// Map FFX attribute names to our sphere types
export const mapAttributeToType = (
  attributeName: string | null,
  abilityId: number | null,
  lockLevel: number | null,
): SphereType => {
  if (lockLevel !== null) return 'locked'
  if (abilityId !== null) return 'locked'
  if (!attributeName) return 'empty'

  const attributeMap: Record<string, SphereType> = {
    HP: 'hp',
    MP: 'mp',
    Strength: 'strength',
    Defense: 'defense',
    Magic: 'magic',
    'Magic Defense': 'magicDef',
    Agility: 'agility',
    Accuracy: 'accuracy',
    Evasion: 'evasion',
    Luck: 'luck',
  }

  return attributeMap[attributeName] || 'empty'
}
