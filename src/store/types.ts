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

export interface QuickLink {
  id: string;
  title: string;
  url: string;
  categoryId?: string;
}

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
}
