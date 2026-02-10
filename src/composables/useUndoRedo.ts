import { ref, inject, type Ref, type InjectionKey } from "vue";
import type { GridStorage, NodeDeltas } from "@/composables/useGridStorage";

export interface UndoRedo {
  beginAction: () => void;
  commitAction: () => void;
  undo: (syncVisuals: () => void) => void;
  redo: (syncVisuals: () => void) => void;
  canUndo: Ref<boolean>;
  canRedo: Ref<boolean>;
  clearHistory: () => void;
}

export const undoRedoKey: InjectionKey<UndoRedo> = Symbol("undoRedo");

const MAX_STACK_SIZE = 50;

export function useUndoRedo(storage: GridStorage): UndoRedo {
  const undoStack: NodeDeltas[] = [];
  const redoStack: NodeDeltas[] = [];
  let pending: NodeDeltas | null = null;

  const canUndo = ref(false);
  const canRedo = ref(false);

  function updateCanFlags() {
    canUndo.value = undoStack.length > 0;
    canRedo.value = redoStack.length > 0;
  }

  function beginAction() {
    pending = JSON.parse(JSON.stringify(storage.deltas.value));
  }

  function commitAction() {
    if (!pending) return;

    const currentSerialized = JSON.stringify(storage.deltas.value);
    const pendingSerialized = JSON.stringify(pending);

    if (currentSerialized !== pendingSerialized) {
      undoStack.push(pending);
      if (undoStack.length > MAX_STACK_SIZE) {
        undoStack.shift();
      }
      redoStack.length = 0;
      updateCanFlags();
    }

    pending = null;
  }

  function undo(syncVisuals: () => void) {
    if (undoStack.length === 0) return;

    redoStack.push(JSON.parse(JSON.stringify(storage.deltas.value)));
    const previous = undoStack.pop()!;
    storage.deltas.value = previous;
    updateCanFlags();
    syncVisuals();
  }

  function redo(syncVisuals: () => void) {
    if (redoStack.length === 0) return;

    undoStack.push(JSON.parse(JSON.stringify(storage.deltas.value)));
    const next = redoStack.pop()!;
    storage.deltas.value = next;
    updateCanFlags();
    syncVisuals();
  }

  function clearHistory() {
    undoStack.length = 0;
    redoStack.length = 0;
    pending = null;
    updateCanFlags();
  }

  return {
    beginAction,
    commitAction,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
  };
}

export function injectUndoRedo(): UndoRedo {
  const undoRedo = inject(undoRedoKey);
  if (!undoRedo) {
    throw new Error("UndoRedo not provided");
  }
  return undoRedo;
}
