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

export interface Todo {
  id: string;
  title: string;
  categoryId?: string;
  /** Optional day the task was picked up — gives a range with completedAt. */
  startedAt?: DateStr;
  /** Set when finished; presence marks the to-do as complete. */
  completedAt?: DateStr;
  createdAt: number;
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

/** An image saved to the user's background library. `url` images store their
 *  address; `upload` images store a Blob in IndexedDB under `bg-<id>`. */
export interface BgImage {
  id: string;
  kind: "url" | "upload";
  /** The remote address for `url` images; unused for uploads. */
  value?: string;
}

/** Page background. Discriminated union so each kind carries only what it needs.
 *  - "upload"/"url" (legacy) are the pre-library single-image kinds, still read.
 *  - "image" references a library entry by id.
 *  - "random" picks a library image on each load. */
export type Background =
  | { kind: "default" }
  | { kind: "gradient"; value: string } // a CSS gradient string
  | { kind: "url"; value: string } // remote image URL (legacy single)
  | { kind: "upload" } // legacy single uploaded image (fixed IDB key)
  | { kind: "image"; id: string } // a library image
  | { kind: "random" }; // random pick from the library

export interface PomodoroSettings {
  /** Minutes. */
  work: number;
  break: number;
  longBreak: number;
  /** Number of work sessions before a long break. */
  longBreakEvery: number;
  /** Magnify + center the timer when running. */
  focusMode: boolean;
  /** Show the Pomodoro section at all. */
  enabled: boolean;
  /** Pure countdown: one phase, no work/break split, free-typed duration. */
  pureTimer: boolean;
}

export interface Settings {
  /** Display name for the greeting. Empty falls back to the Google account name. */
  name: string;
  /** Base URL that receives the query as `?q=`. */
  searchEngine: string;
  pomodoro: PomodoroSettings;
  /** The default background (used for "All" mode and as the per-mode fallback). */
  background: Background;
  /** Saved background images the user can reuse. */
  backgroundLibrary: BgImage[];
  /** Optional per-mode background overrides; falls back to `background`. */
  modeBackgrounds: Partial<Record<LinkMode, Background>>;
  mode: LinkMode;
  /** User's own Google OAuth client ID (created in Google Cloud Console).
   *  Empty until they paste it in Settings; required for Calendar sync. */
  googleClientId: string;
}
