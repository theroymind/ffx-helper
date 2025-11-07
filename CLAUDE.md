# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Final Fantasy X (FFX) Sphere Grid planner** built with Vue 3 + TypeScript + Vite. The application visualizes the FFX Sphere Grid as an interactive graph where users can plan character progression by clicking nodes to override their sphere types and track resulting stat changes.

## Development Commands

```bash
# Install dependencies
npm install

# Run development server with hot reload
npm run dev

# Type checking (without building)
npm run type-check

# Build for production (includes type checking)
npm run build

# Build only (no type checking)
npm run build-only

# Preview production build
npm run preview

# Run unit tests
npm run test:unit

# Run linting with auto-fix
npm run lint

# Format code with Prettier
npm run format
```

## Architecture

### Core Data Flow

1. **Data Source**: `src/nodes.json` (2000+ node FFX sphere grid data) and `src/abilities.json` (86 abilities)
2. **Data Generation**: `useSphereData` composable generates the sphere grid from JSON data
3. **Visualization**: Cytoscape.js renders the graph via `useCytoscapeGrid` composable
4. **State Management**:
   - Local state uses Vue 3 Composition API with `ref` and `computed`
   - Persists user customizations to localStorage via `@vueuse/core`
   - No Pinia stores are actively used (counter.ts is template boilerplate)
5. **User Interaction**: Click/drag on nodes to override sphere types, view stats and counts in sidebar

### Key Composables

**`useSphereData` (src/composables/useSphereData.ts)**
- Generates sphere grid data from nodes.json and abilities.json
- Maps FFX attribute names to sphere types via `mapAttributeToType()`
- Tracks node customizations in localStorage
- Computes real-time stats based on activated nodes
- Provides `resetGrid()` and `updateNode()` methods

**`useCytoscapeGrid` (src/composables/useCytoscapeGrid.ts)**
- Initializes and manages Cytoscape.js instance
- Handles node click/drag interactions for type overriding
- Applies color coding based on sphere types (see `sphereColors` in constants/sphere.ts)
- Ability nodes are bright pink (#ff1ac6) and cannot be modified
- Locked nodes cannot be modified

### Type System

**SphereType** (src/types/sphere.ts):
- 12 types: `empty`, `hp`, `mp`, `strength`, `defense`, `magic`, `magicDef`, `agility`, `accuracy`, `evasion`, `luck`, `locked`
- Each type has associated color, label, and stat value in `sphereTypeInfo`

**SphereNode**:
- Core node data structure with `id`, `type`, `value`, `locked`, optional `abilityId` and `abilityName`

**SphereGridData**:
- Contains `nodes`, `edges`, and `positions` for the entire grid

### Component Structure

**Main Component**: `SphereGrid.vue`
- Orchestrates the entire sphere grid interface
- Left sidebar: controls, stats, sphere counts, instructions
- Right side: canvas with Cytoscape visualization

**Sub-components** (src/components/sphere-grid/):
- `SphereGridCanvas.vue`: Container for Cytoscape instance
- `SphereSelector.vue`: Toggle buttons to select sphere type for painting
- `StatsPanel.vue`: Displays computed character stats
- `SphereCountsPanel.vue`: Shows counts of overridden spheres by type
- `GridControls.vue`: Reset button and other controls
- `InstructionsPanel.vue`: Usage instructions

**UI Components** (src/components/ui/):
- shadcn-vue components (Button, Badge, Card, Separator, Toggle, ToggleGroup)
- Configured via components.json with New York style and Lucide icons

### Data Files

**src/nodes.json** (~2000 nodes):
- Each node has: `id`, `x`, `y`, `connections`, `attribute_name`, `ability_id`, `lock_level`, `value`
- Connections use coordinate pairs `[x, y]` to reference neighboring nodes

**src/abilities.json** (86 abilities):
- Maps `ability_id` to `name` and `ability_type` (e.g., "Cheer", "Cure", "Fire")

### Styling

- **TailwindCSS v4** via `@tailwindcss/vite` plugin
- Main stylesheet: `src/styles.css`
- Uses dark theme (zinc-950 background)
- Custom colors for sphere types defined in `constants/sphere.ts`
- Path alias: `@` maps to `src/`

### State Persistence

- Uses `@vueuse/core`'s `useLocalStorage()` to persist sphere grid customizations
- Storage key: `ffx-sphere-grid-nodes`
- Only stores node modifications, not full grid (merges with defaults on load)

## Important Implementation Details

- **Node Modification Rules**: Locked nodes and ability nodes cannot be modified
- **Sphere Counts**: Only counts nodes that have been changed from their default values
- **Base Stats**: FFX starting stats defined in `baseStats` constant (HP: 333, MP: 59, etc.)
- **Spacing Multiplier**: Node positions are multiplied by 3.0 for better visualization
- **Edge Deduplication**: Edges are deduplicated to avoid drawing connections twice
- **Cytoscape Configuration**: Nodes are not draggable (`autoungrabify: true`), only clickable for type changes
