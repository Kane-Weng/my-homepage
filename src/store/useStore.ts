import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Background,
  BgImage,
  Category,
  Completion,
  DateStr,
  Habit,
  LinkMode,
  QuickLink,
  Settings,
  StickyNote,
  Todo,
  Weekday,
} from "./types";
import {
  CATEGORY_COLORS,
  DEFAULT_CATEGORIES,
  DEFAULT_LINKS,
  DEFAULT_SETTINGS,
  NOTE_COLORS,
} from "../data/defaults";

const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

interface AppState {
  categories: Category[];
  habits: Habit[];
  /** Completions keyed as `${habitId}|${date}` for O(1) toggle/lookup. */
  completions: Record<string, Completion>;
  notes: StickyNote[];
  links: QuickLink[];
  todos: Todo[];
  settings: Settings;

  // Categories
  addCategory: (name: string) => Category;
  updateCategory: (id: string, patch: Partial<Omit<Category, "id">>) => void;
  removeCategory: (id: string) => void;

  // Habits
  addHabit: (input: {
    title: string;
    categoryId: string;
    weekdays: Weekday[];
  }) => void;
  updateHabit: (id: string, patch: Partial<Omit<Habit, "id">>) => void;
  removeHabit: (id: string) => void;
  toggleCompletion: (habitId: string, date: DateStr) => void;
  isDone: (habitId: string, date: DateStr) => boolean;

  // Notes
  addNote: () => void;
  updateNote: (id: string, patch: Partial<Omit<StickyNote, "id">>) => void;
  removeNote: (id: string) => void;

  // Links
  addLink: (input: {
    title: string;
    url: string;
    categoryId?: string;
    tag?: QuickLink["tag"];
  }) => void;
  updateLink: (id: string, patch: Partial<Omit<QuickLink, "id">>) => void;
  removeLink: (id: string) => void;

  // Todos
  addTodo: (input: { title: string; categoryId?: string; startedAt?: DateStr }) => void;
  updateTodo: (id: string, patch: Partial<Omit<Todo, "id">>) => void;
  removeTodo: (id: string) => void;

  // Settings
  updateSettings: (patch: Partial<Settings>) => void;
  setMode: (mode: LinkMode) => void;
  setBackground: (background: Background) => void;
  setModeBackground: (mode: LinkMode, background: Background | null) => void;
  addBackgroundImage: (img: BgImage) => void;
  removeBackgroundImage: (id: string) => void;
}

const completionKey = (habitId: string, date: DateStr) => `${habitId}|${date}`;

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      categories: DEFAULT_CATEGORIES,
      habits: [],
      completions: {},
      notes: [],
      links: DEFAULT_LINKS,
      todos: [],
      settings: DEFAULT_SETTINGS,

      addCategory: (name) => {
        const cat: Category = {
          id: uid("cat"),
          name: name.trim(),
          color: CATEGORY_COLORS[get().categories.length % CATEGORY_COLORS.length],
        };
        set((s) => ({ categories: [...s.categories, cat] }));
        return cat;
      },
      updateCategory: (id, patch) =>
        set((s) => ({
          categories: s.categories.map((c) =>
            c.id === id ? { ...c, ...patch } : c,
          ),
        })),
      removeCategory: (id) =>
        set((s) => ({
          categories: s.categories.filter((c) => c.id !== id),
          // Orphan the habits/links rather than deleting the user's data.
          habits: s.habits.map((h) =>
            h.categoryId === id ? { ...h, categoryId: "" } : h,
          ),
          links: s.links.map((l) =>
            l.categoryId === id ? { ...l, categoryId: undefined } : l,
          ),
        })),

      addHabit: ({ title, categoryId, weekdays }) =>
        set((s) => ({
          habits: [
            ...s.habits,
            {
              id: uid("hab"),
              title: title.trim(),
              categoryId,
              weekdays,
              createdAt: Date.now(),
            },
          ],
        })),
      updateHabit: (id, patch) =>
        set((s) => ({
          habits: s.habits.map((h) => (h.id === id ? { ...h, ...patch } : h)),
        })),
      removeHabit: (id) =>
        set((s) => {
          const completions = { ...s.completions };
          for (const key of Object.keys(completions)) {
            if (completions[key].habitId === id) delete completions[key];
          }
          return { habits: s.habits.filter((h) => h.id !== id), completions };
        }),
      toggleCompletion: (habitId, date) =>
        set((s) => {
          const key = completionKey(habitId, date);
          const completions = { ...s.completions };
          if (completions[key]) delete completions[key];
          else completions[key] = { habitId, date };
          return { completions };
        }),
      isDone: (habitId, date) => !!get().completions[completionKey(habitId, date)],

      addNote: () =>
        set((s) => ({
          notes: [
            {
              id: uid("note"),
              content: "",
              color: NOTE_COLORS[s.notes.length % NOTE_COLORS.length],
              updatedAt: Date.now(),
            },
            ...s.notes,
          ],
        })),
      updateNote: (id, patch) =>
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, ...patch, updatedAt: Date.now() } : n,
          ),
        })),
      removeNote: (id) =>
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) })),

      addLink: ({ title, url, categoryId, tag }) =>
        set((s) => ({
          links: [
            ...s.links,
            { id: uid("lnk"), title: title.trim(), url: url.trim(), categoryId, tag },
          ],
        })),
      updateLink: (id, patch) =>
        set((s) => ({
          links: s.links.map((l) => (l.id === id ? { ...l, ...patch } : l)),
        })),
      removeLink: (id) =>
        set((s) => ({ links: s.links.filter((l) => l.id !== id) })),

      addTodo: ({ title, categoryId, startedAt }) =>
        set((s) => ({
          todos: [
            ...s.todos,
            {
              id: uid("todo"),
              title: title.trim(),
              categoryId,
              startedAt,
              createdAt: Date.now(),
            },
          ],
        })),
      updateTodo: (id, patch) =>
        set((s) => ({
          todos: s.todos.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      removeTodo: (id) =>
        set((s) => ({ todos: s.todos.filter((t) => t.id !== id) })),

      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
      setMode: (mode) =>
        set((s) => ({ settings: { ...s.settings, mode } })),
      setBackground: (background) =>
        set((s) => ({ settings: { ...s.settings, background } })),
      setModeBackground: (mode, background) =>
        set((s) => {
          const modeBackgrounds = { ...s.settings.modeBackgrounds };
          if (background) modeBackgrounds[mode] = background;
          else delete modeBackgrounds[mode];
          return { settings: { ...s.settings, modeBackgrounds } };
        }),
      addBackgroundImage: (img) =>
        set((s) => ({
          settings: {
            ...s.settings,
            backgroundLibrary: [...s.settings.backgroundLibrary, img],
          },
        })),
      removeBackgroundImage: (id) =>
        set((s) => {
          // Drop the entry and reset any background that referenced it.
          const clear = (bg: Background): Background =>
            bg.kind === "image" && bg.id === id ? { kind: "default" } : bg;
          const modeBackgrounds: Partial<Record<LinkMode, Background>> = {};
          for (const [m, bg] of Object.entries(s.settings.modeBackgrounds)) {
            if (bg) modeBackgrounds[m as LinkMode] = clear(bg);
          }
          return {
            settings: {
              ...s.settings,
              backgroundLibrary: s.settings.backgroundLibrary.filter(
                (i) => i.id !== id,
              ),
              background: clear(s.settings.background),
              modeBackgrounds,
            },
          };
        }),
    }),
    {
      name: "my-homepage",
      version: 4,
      // v1 saved data predates background/mode/googleClientId; v3 adds the todos
      // slice; v4 adds pomodoro.enabled/pureTimer and the background library.
      // Backfill missing settings fields and top-level collections from defaults
      // so selectors never read undefined.
      migrate: (persisted) => {
        const state = persisted as {
          settings?: Partial<Settings>;
          todos?: Todo[];
        };
        const settings = { ...DEFAULT_SETTINGS, ...(state.settings ?? {}) };
        // pomodoro is nested — deep-merge so new fields (e.g. focusMode) are set.
        settings.pomodoro = { ...DEFAULT_SETTINGS.pomodoro, ...settings.pomodoro };
        return {
          ...(persisted as object),
          todos: state.todos ?? [],
          settings,
        } as AppState;
      },
    },
  ),
);
