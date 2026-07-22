import type { Background, Category, QuickLink, Settings } from "../store/types";

/** Selectable background presets shown in Settings. `bg` is the CSS applied. */
export const BACKGROUND_PRESETS: {
  id: string;
  label: string;
  background: Background;
}[] = [
  { id: "default", label: "Midnight", background: { kind: "default" } },
  {
    id: "aurora",
    label: "Aurora",
    background: {
      kind: "gradient",
      value: "linear-gradient(135deg, #0b0f14 0%, #10233a 55%, #1b3a2f 100%)",
    },
  },
  {
    id: "dusk",
    label: "Dusk",
    background: {
      kind: "gradient",
      value: "linear-gradient(160deg, #0b0f14 0%, #251233 60%, #3a1330 100%)",
    },
  },
  {
    id: "ember",
    label: "Ember",
    background: {
      kind: "gradient",
      value: "linear-gradient(150deg, #0b0f14 0%, #241408 60%, #3a1f0b 100%)",
    },
  },
  {
    id: "slate",
    label: "Slate",
    background: {
      kind: "gradient",
      value: "radial-gradient(120% 120% at 50% 0%, #17222e 0%, #0b0f14 60%)",
    },
  },
];

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
  { id: "lnk-leetcode", title: "LeetCode", url: "https://leetcode.com", tag: "work" },
  { id: "lnk-github", title: "GitHub", url: "https://github.com", tag: "work" },
  { id: "lnk-gmail", title: "Gmail", url: "https://mail.google.com", tag: "neutral" },
  { id: "lnk-gcal", title: "Calendar", url: "https://calendar.google.com", tag: "neutral" },
  { id: "lnk-arxiv", title: "arXiv", url: "https://arxiv.org", tag: "work" },
  { id: "lnk-youtube", title: "YouTube", url: "https://youtube.com", tag: "entertainment" },
];

export const DEFAULT_SETTINGS: Settings = {
  name: "",
  searchEngine: "https://www.google.com/search",
  pomodoro: {
    work: 25,
    break: 5,
    longBreak: 15,
    longBreakEvery: 4,
    focusMode: true,
    enabled: true,
    pureTimer: false,
  },
  background: { kind: "default" },
  backgroundLibrary: [],
  modeBackgrounds: {},
  mode: "all",
  googleClientId: "",
};
