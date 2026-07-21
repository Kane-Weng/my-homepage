/** ISO day string, e.g. "2026-07-21". Used as the key for habit completions. */
export type DateStr = string;

/** 0 = Sunday … 6 = Saturday (matches JS Date.getDay()). */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Category {
  id: string;
  name: string;
  /** Any CSS color; used as the accent for the category's habits/links. */
  color: string;
}

export interface Habit {
  id: string;
  title: string;
  categoryId: string;
  /** Days the habit is scheduled. Empty array is treated as "every day". */
  weekdays: Weekday[];
  createdAt: number;
}

export interface Completion {
  habitId: string;
  date: DateStr;
}

export interface StickyNote {
  id: string;
  content: string;
  color: string;
  updatedAt: number;
}

/** Used by work/relax modes to decide which links stay visible. */
export type LinkTag = "work" | "entertainment" | "neutral";

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  categoryId?: string;
  /** Defaults to "neutral" when unset. */
  tag?: LinkTag;
}

/** Which links are shown. work hides entertainment; relax hides work. */
export type LinkMode = "all" | "work" | "relax";

/** Page background. Discriminated union so each kind carries only what it needs.
 *  "upload" reads a Blob from IndexedDB under a fixed key (see lib/idb.ts). */
export type Background =
  | { kind: "default" }
  | { kind: "gradient"; value: string } // a CSS gradient string
  | { kind: "url"; value: string } // remote image URL
  | { kind: "upload" };

export interface PomodoroSettings {
  /** Minutes. */
  work: number;
  break: number;
  longBreak: number;
  /** Number of work sessions before a long break. */
  longBreakEvery: number;
}

export interface Settings {
  /** Base URL that receives the query as `?q=`. */
  searchEngine: string;
  pomodoro: PomodoroSettings;
  background: Background;
  mode: LinkMode;
  /** User's own Google OAuth client ID (created in Google Cloud Console).
   *  Empty until they paste it in Settings; required for Calendar sync. */
  googleClientId: string;
}
