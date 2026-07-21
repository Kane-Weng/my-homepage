import type { Category, QuickLink, Settings } from "../store/types";

/** Palette used when creating new categories / notes, cycled in order. */
export const CATEGORY_COLORS = [
  "#f59e0b", // amber
  "#38bdf8", // sky
  "#a78bfa", // violet
  "#34d399", // emerald
  "#f472b6", // pink
  "#fb7185", // rose
];

export const NOTE_COLORS = [
  "#fde68a", // amber
  "#a7f3d0", // emerald
  "#bfdbfe", // blue
  "#fbcfe8", // pink
  "#ddd6fe", // violet
];

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "cat-work", name: "Work", color: "#f59e0b" },
  { id: "cat-school", name: "School HW", color: "#38bdf8" },
  { id: "cat-self", name: "Self Project", color: "#a78bfa" },
  { id: "cat-research", name: "Research", color: "#34d399" },
];

export const DEFAULT_LINKS: QuickLink[] = [
  { id: "lnk-leetcode", title: "LeetCode", url: "https://leetcode.com" },
  { id: "lnk-github", title: "GitHub", url: "https://github.com" },
  { id: "lnk-gmail", title: "Gmail", url: "https://mail.google.com" },
  { id: "lnk-gcal", title: "Calendar", url: "https://calendar.google.com" },
  { id: "lnk-arxiv", title: "arXiv", url: "https://arxiv.org" },
  { id: "lnk-drive", title: "Drive", url: "https://drive.google.com" },
];

export const DEFAULT_SETTINGS: Settings = {
  searchEngine: "https://www.google.com/search",
  pomodoro: { work: 25, break: 5, longBreak: 15, longBreakEvery: 4 },
};
