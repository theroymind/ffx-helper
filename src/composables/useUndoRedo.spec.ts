import { describe, it, expect, vi } from "vitest"
import { ref, computed } from "vue"
import { useUndoRedo } from "./useUndoRedo"
import type { GridStorage, NodeDeltas } from "./useGridStorage"
import { SphereType } from "@/domain/grid/SphereType"

function createMockStorage(initialDeltas: NodeDeltas = {}): GridStorage {
  const deltas = ref<NodeDeltas>({ ...initialDeltas })
  return {
    deltas,
    saveNode: vi.fn(),
    saveNodes: vi.fn(),
    removeNode: vi.fn(),
    clearDeltas: vi.fn(),
    hasDeltas: computed(() => Object.keys(deltas.value).length > 0),
  }
}

describe("useUndoRedo", () => {
  it("canUndo and canRedo start as false", () => {
    const storage = createMockStorage()
    const { canUndo, canRedo } = useUndoRedo(storage)

    expect(canUndo.value).toBe(false)
    expect(canRedo.value).toBe(false)
  })

  it("pushes to undo stack on commit when deltas changed", () => {
    const storage = createMockStorage()
    const { beginAction, commitAction, canUndo } = useUndoRedo(storage)

    beginAction()
    storage.deltas.value["node-1"] = { type: SphereType.Hp, value: 200 }
    commitAction()

    expect(canUndo.value).toBe(true)
  })

  it("does not push when deltas unchanged", () => {
    const storage = createMockStorage()
    const { beginAction, commitAction, canUndo } = useUndoRedo(storage)

    beginAction()
    commitAction()

    expect(canUndo.value).toBe(false)
  })

  it("undo restores previous deltas", () => {
    const storage = createMockStorage()
    const { beginAction, commitAction, undo, canRedo } = useUndoRedo(storage)
    const syncVisuals = vi.fn()

    const originalDeltas = { ...storage.deltas.value }

    beginAction()
    storage.deltas.value["node-1"] = { type: SphereType.Hp, value: 200 }
    commitAction()

    undo(syncVisuals)

    expect(storage.deltas.value).toEqual(originalDeltas)
    expect(canRedo.value).toBe(true)
  })

  it("redo restores undone deltas", () => {
    const storage = createMockStorage()
    const { beginAction, commitAction, undo, redo } = useUndoRedo(storage)
    const syncVisuals = vi.fn()

    beginAction()
    storage.deltas.value["node-1"] = { type: SphereType.Hp, value: 200 }
    commitAction()

    const deltasAfterAction = { ...storage.deltas.value }

    undo(syncVisuals)
    redo(syncVisuals)

    expect(storage.deltas.value).toEqual(deltasAfterAction)
  })

  it("redo stack cleared on new action", () => {
    const storage = createMockStorage()
    const { beginAction, commitAction, undo, canRedo } = useUndoRedo(storage)
    const syncVisuals = vi.fn()

    beginAction()
    storage.deltas.value["node-1"] = { type: SphereType.Hp, value: 200 }
    commitAction()

    undo(syncVisuals)

    beginAction()
    storage.deltas.value["node-2"] = { type: SphereType.Mp, value: 100 }
    commitAction()

    expect(canRedo.value).toBe(false)
  })

  it("undo calls syncVisuals callback", () => {
    const storage = createMockStorage()
    const { beginAction, commitAction, undo } = useUndoRedo(storage)
    const syncVisuals = vi.fn()

    beginAction()
    storage.deltas.value["node-1"] = { type: SphereType.Hp, value: 200 }
    commitAction()

    undo(syncVisuals)

    expect(syncVisuals).toHaveBeenCalledTimes(1)
  })

  it("redo calls syncVisuals callback", () => {
    const storage = createMockStorage()
    const { beginAction, commitAction, undo, redo } = useUndoRedo(storage)
    const syncVisuals = vi.fn()

    beginAction()
    storage.deltas.value["node-1"] = { type: SphereType.Hp, value: 200 }
    commitAction()

    undo(syncVisuals)
    redo(syncVisuals)

    expect(syncVisuals).toHaveBeenCalledTimes(2)
  })

  it("max stack size is 50", () => {
    const storage = createMockStorage()
    const { beginAction, commitAction, undo, canUndo } = useUndoRedo(storage)
    const syncVisuals = vi.fn()

    for (let i = 0; i < 55; i++) {
      beginAction()
      storage.deltas.value[`node-${i}`] = { type: SphereType.Hp, value: i }
      commitAction()
    }

    for (let i = 0; i < 50; i++) {
      undo(syncVisuals)
    }

    expect(canUndo.value).toBe(false)
  })

  it("undo with empty stack is no-op", () => {
    const storage = createMockStorage({ "node-1": { type: SphereType.Hp, value: 200 } })
    const { undo } = useUndoRedo(storage)
    const syncVisuals = vi.fn()

    const originalDeltas = { ...storage.deltas.value }

    undo(syncVisuals)

    expect(storage.deltas.value).toEqual(originalDeltas)
    expect(syncVisuals).not.toHaveBeenCalled()
  })

  it("redo with empty stack is no-op", () => {
    const storage = createMockStorage({ "node-1": { type: SphereType.Hp, value: 200 } })
    const { redo } = useUndoRedo(storage)
    const syncVisuals = vi.fn()

    const originalDeltas = { ...storage.deltas.value }

    redo(syncVisuals)

    expect(storage.deltas.value).toEqual(originalDeltas)
    expect(syncVisuals).not.toHaveBeenCalled()
  })

  it("clearHistory empties both stacks", () => {
    const storage = createMockStorage()
    const { beginAction, commitAction, undo, clearHistory, canUndo, canRedo } = useUndoRedo(storage)
    const syncVisuals = vi.fn()

    beginAction()
    storage.deltas.value["node-1"] = { type: SphereType.Hp, value: 200 }
    commitAction()

    undo(syncVisuals)

    clearHistory()

    expect(canUndo.value).toBe(false)
    expect(canRedo.value).toBe(false)
  })

  it("beginAction without commitAction is no-op", () => {
    const storage = createMockStorage()
    const { beginAction, canUndo } = useUndoRedo(storage)

    beginAction()
    storage.deltas.value["node-1"] = { type: SphereType.Hp, value: 200 }

    beginAction()
    storage.deltas.value["node-2"] = { type: SphereType.Mp, value: 100 }

    expect(canUndo.value).toBe(false)
  })
})
