import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Category,
  Completion,
  DateStr,
  Habit,
  QuickLink,
  Settings,
  StickyNote,
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
  addLink: (input: { title: string; url: string; categoryId?: string }) => void;
  updateLink: (id: string, patch: Partial<Omit<QuickLink, "id">>) => void;
  removeLink: (id: string) => void;
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

      addLink: ({ title, url, categoryId }) =>
        set((s) => ({
          links: [
            ...s.links,
            { id: uid("lnk"), title: title.trim(), url: url.trim(), categoryId },
          ],
        })),
      updateLink: (id, patch) =>
        set((s) => ({
          links: s.links.map((l) => (l.id === id ? { ...l, ...patch } : l)),
        })),
      removeLink: (id) =>
        set((s) => ({ links: s.links.filter((l) => l.id !== id) })),
    }),
    { name: "my-homepage", version: 1 },
  ),
);
