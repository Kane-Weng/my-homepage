/**
 * Keyword "bangs": the first token of the query can pick a destination.
 * e.g. `yt lofi beats` → YouTube search for "lofi beats".
 * Each entry is a function that turns the remaining query into a URL.
 */
type Bang = (query: string) => string;

const enc = encodeURIComponent;

export const BANGS: Record<string, Bang> = {
  g: (q) => `https://www.google.com/search?q=${enc(q)}`,
  yt: (q) => `https://www.youtube.com/results?search_query=${enc(q)}`,
  gh: (q) => `https://github.com/search?q=${enc(q)}&type=repositories`,
  w: (q) => `https://en.wikipedia.org/w/index.php?search=${enc(q)}`,
  gh_user: (q) => `https://github.com/${enc(q)}`,
  lc: (q) => `https://leetcode.com/problemset/?search=${enc(q)}`,
  a: (q) => `https://arxiv.org/abs/${enc(q)}`,
  gmap: (q) => `https://www.google.com/maps/search/${enc(q)}`,
};

/** Human-readable list for the command palette / help. */
export const BANG_HINTS: { key: string; label: string }[] = [
  { key: "g", label: "Google" },
  { key: "yt", label: "YouTube" },
  { key: "gh", label: "GitHub repos" },
  { key: "w", label: "Wikipedia" },
  { key: "lc", label: "LeetCode" },
  { key: "a", label: "arXiv id" },
  { key: "gmap", label: "Google Maps" },
];

/**
 * Resolve a raw search input into a destination URL.
 * If the first token matches a bang, use it; otherwise fall back to `engine`.
 */
export function resolveSearch(input: string, engine: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Direct URL? (contains a dot and no spaces) — just go there.
  if (!/\s/.test(trimmed) && /^[\w-]+(\.[\w-]+)+/.test(trimmed)) {
    return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
  }

  const [first, ...rest] = trimmed.split(/\s+/);
  const bang = BANGS[first.toLowerCase()];
  if (bang && rest.length > 0) return bang(rest.join(" "));

  return `${engine}?q=${enc(trimmed)}`;
}
