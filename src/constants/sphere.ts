import type { SphereType, SphereTypeInfo, Stats } from '@/types/sphere'

// Helper to get CSS custom property color values at runtime
export const getCssColor = (propertyName: string): string => {
  if (typeof window === 'undefined') return '#333333'
  const computedStyle = getComputedStyle(document.documentElement)
  return computedStyle.getPropertyValue(propertyName).trim() || '#333333'
}

// Get sphere colors from CSS custom properties (single source of truth from styles.css)
export const getSphereColors = (): Record<SphereType, string> => ({
  empty: '#333333',
  hp: getCssColor('--sphere-hp'),
  mp: getCssColor('--sphere-mp'),
  strength: getCssColor('--sphere-strength'),
  defense: getCssColor('--sphere-defense'),
  magic: getCssColor('--sphere-magic'),
  magicDef: getCssColor('--sphere-magicDef'),
  agility: getCssColor('--sphere-agility'),
  accuracy: getCssColor('--sphere-accuracy'),
  evasion: getCssColor('--sphere-evasion'),
  luck: getCssColor('--sphere-luck'),
  locked: '#71717a',
})

// Legacy export for backwards compatibility (will be computed at runtime)
export const sphereColors: Record<SphereType, string> = getSphereColors()

// Bright pink color for ability nodes
export const abilityNodeColor = '#ff1ac6'

// Icon data URLs for sphere types (paste SVG data URLs here)
// To create data URLs:
// 1. Get SVG from Lucide (https://lucide.dev/)
// 2. URL encode it: encodeURIComponent(svgString)
// 3. Prefix with: data:image/svg+xml,
// Example: data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'...%3E%3C/svg%3E
export const sphereIcons: Partial<Record<SphereType, string>> = {
  strength:
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtc3dvcmQtaWNvbiBsdWNpZGUtc3dvcmQiPjxwYXRoIGQ9Im0xMSAxOS02LTYiLz48cGF0aCBkPSJtNSAyMS0yLTIiLz48cGF0aCBkPSJtOCAxNi00IDQiLz48cGF0aCBkPSJNOS41IDE3LjUgMjEgNlYzaC0zTDYuNSAxNC41Ii8+PC9zdmc+',
  defense:
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtZ3JpZDJ4Mi1pY29uIGx1Y2lkZS1ncmlkLTJ4MiI+PHBhdGggZD0iTTEyIDN2MTgiLz48cGF0aCBkPSJNMyAxMmgxOCIvPjxyZWN0IHg9IjMiIHk9IjMiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCIgcng9IjIiLz48L3N2Zz4=',
  magic:
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtdHJpYW5nbGUtaWNvbiBsdWNpZGUtdHJpYW5nbGUiPjxwYXRoIGQ9Ik0xMy43MyA0YTIgMiAwIDAgMC0zLjQ2IDBsLTggMTRBMiAyIDAgMCAwIDQgMjFoMTZhMiAyIDAgMCAwIDEuNzMtM1oiLz48L3N2Zz4=',
  magicDef:
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtdHJpYW5nbGUtaWNvbiBsdWNpZGUtdHJpYW5nbGUiPjxwYXRoIGQ9Ik0xMy43MyA0YTIgMiAwIDAgMC0zLjQ2IDBsLTggMTRBMiAyIDAgMCAwIDQgMjFoMTZhMiAyIDAgMCAwIDEuNzMtM1oiLz48L3N2Zz4=',
  agility:
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtd2luZC1pY29uIGx1Y2lkZS13aW5kIj48cGF0aCBkPSJNMTIuOCAxOS42QTIgMiAwIDEgMCAxNCAxNkgyIi8+PHBhdGggZD0iTTE3LjUgOGEyLjUgMi41IDAgMSAxIDIgNEgyIi8+PHBhdGggZD0iTTkuOCA0LjRBMiAyIDAgMSAxIDExIDhIMiIvPjwvc3ZnPg==',
  accuracy:
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtY2lyY2xlLXBsdXMtaWNvbiBsdWNpZGUtY2lyY2xlLXBsdXMiPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEwIi8+PHBhdGggZD0iTTggMTJoOCIvPjxwYXRoIGQ9Ik0xMiA4djgiLz48L3N2Zz4=',
  evasion:
    'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtZWdnLWZyaWVkLWljb24gbHVjaWRlLWVnZy1mcmllZCI+PGNpcmNsZSBjeD0iMTEuNSIgY3k9IjEyLjUiIHI9IjMuNSIvPjxwYXRoIGQ9Ik0zIDhjMC0zLjUgMi41LTYgNi41LTYgNSAwIDQuODMgMyA3LjUgNXM1IDIgNSA2YzAgNC41LTIuNSA2LjUtNyA2LjUtMi41IDAtMi41IDIuNS02IDIuNXMtNy0yLTctNS41YzAtMyAxLjUtMyAxLjUtNUMzLjUgMTAgMyA5IDMgOFoiLz48L3N2Zz4=',
  luck: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgY2xhc3M9Imx1Y2lkZSBsdWNpZGUtc3Rhci1pY29uIGx1Y2lkZS1zdGFyIj48cGF0aCBkPSJNMTEuNTI1IDIuMjk1YS41My41MyAwIDAgMSAuOTUgMGwyLjMxIDQuNjc5YTIuMTIzIDIuMTIzIDAgMCAwIDEuNTk1IDEuMTZsNS4xNjYuNzU2YS41My41MyAwIDAgMSAuMjk0LjkwNGwtMy43MzYgMy42MzhhMi4xMjMgMi4xMjMgMCAwIDAtLjYxMSAxLjg3OGwuODgyIDUuMTRhLjUzLjUzIDAgMCAxLS43NzEuNTZsLTQuNjE4LTIuNDI4YTIuMTIyIDIuMTIyIDAgMCAwLTEuOTczIDBMNi4zOTYgMjEuMDFhLjUzLjUzIDAgMCAxLS43Ny0uNTZsLjg4MS01LjEzOWEyLjEyMiAyLjEyMiAwIDAgMC0uNjExLTEuODc5TDIuMTYgOS43OTVhLjUzLjUzIDAgMCAxIC4yOTQtLjkwNmw1LjE2NS0uNzU1YTIuMTIyIDIuMTIyIDAgMCAwIDEuNTk3LTEuMTZ6Ii8+PC9zdmc+',
}

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
