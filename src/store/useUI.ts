import { create } from "zustand";

/** Ephemeral UI state (not persisted) for cross-component actions,
 *  mostly so the command palette can drive the rest of the page. */
interface UIState {
  paletteOpen: boolean;
  addHabitOpen: boolean;
  /** Bumping this counter tells the search bar to focus itself. */
  focusSearchSignal: number;
  /** Bumping this tells the Pomodoro to start/toggle. */
  pomodoroSignal: number;

  setPaletteOpen: (v: boolean) => void;
  setAddHabitOpen: (v: boolean) => void;
  focusSearch: () => void;
  pokePomodoro: () => void;
}

export const useUI = create<UIState>((set) => ({
  paletteOpen: false,
  addHabitOpen: false,
  focusSearchSignal: 0,
  pomodoroSignal: 0,

  setPaletteOpen: (v) => set({ paletteOpen: v }),
  setAddHabitOpen: (v) => set({ addHabitOpen: v }),
  focusSearch: () => set((s) => ({ focusSearchSignal: s.focusSearchSignal + 1 })),
  pokePomodoro: () => set((s) => ({ pomodoroSignal: s.pomodoroSignal + 1 })),
}));
