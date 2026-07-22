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

/**
 * Fetch autocomplete suggestions for a query via Google's suggest endpoint.
 *
 * The public suggest endpoints (Google's and DuckDuckGo's) don't send CORS
 * headers, so a browser `fetch` can't read them from a static site. We use
 * JSONP instead — a <script> tag isn't subject to CORS — hitting the endpoint
 * with a `callback` param, which responds with `callback(["q", ["s1", …]])`.
 * Resolves to [] on any failure so the search bar degrades gracefully.
 */
export function fetchSuggestions(query: string): Promise<string[]> {
  const q = query.trim();
  if (!q) return Promise.resolve([]);

  return new Promise((resolve) => {
    const cb = `__sug_cb_${Date.now()}_${Math.floor(Math.random() * 1e6)}`;
    const script = document.createElement("script");
    let settled = false;

    const cleanup = () => {
      delete (window as unknown as Record<string, unknown>)[cb];
      script.remove();
    };
    const finish = (out: string[]) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(out);
    };

    (window as unknown as Record<string, unknown>)[cb] = (data: unknown) => {
      // Expected shape: ["query", ["s1", "s2", …], …]
      const list =
        Array.isArray(data) && Array.isArray(data[1]) ? (data[1] as unknown[]) : [];
      finish(
        list
          .map((x) => (Array.isArray(x) ? String(x[0]) : String(x)))
          .filter(Boolean)
          .slice(0, 8),
      );
    };

    script.onerror = () => finish([]);
    script.src = `https://suggestqueries.google.com/complete/search?client=chrome&hl=en&q=${enc(
      q,
    )}&callback=${cb}`;
    document.head.appendChild(script);

    // Safety net if the callback never fires (blocked, offline, etc.).
    window.setTimeout(() => finish([]), 3000);
  });
}

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
