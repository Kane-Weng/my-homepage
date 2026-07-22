import { useEffect, useRef, useState } from "react";
import { useStore } from "../store/useStore";
import { useUI } from "../store/useUI";
import { fetchSuggestions, resolveSearch } from "../lib/search";

export default function SearchBar() {
  const engine = useStore((s) => s.settings.searchEngine);
  const focusSignal = useUI((s) => s.focusSearchSignal);
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1); // -1 = the typed value
  const inputRef = useRef<HTMLInputElement>(null);

  // Respond to the command palette's "focus search" action.
  useEffect(() => {
    if (focusSignal > 0) inputRef.current?.focus();
  }, [focusSignal]);

  // Debounced autocomplete. JSONP can't be aborted, so we drop stale responses
  // by checking the resolved query still matches the current input.
  useEffect(() => {
    const q = value.trim();
    if (!q) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const id = window.setTimeout(async () => {
      const results = await fetchSuggestions(q);
      if (!cancelled) {
        setSuggestions(results);
        setActive(-1);
      }
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, [value]);

  const go = (query: string) => {
    const url = resolveSearch(query, engine);
    if (url) window.location.href = url; // navigate the browser to the resolved url
  };

  const submit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const query = active >= 0 ? suggestions[active] : value;
    go(query);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1 >= suggestions.length ? -1 : i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= -1 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const showList = open && suggestions.length > 0;

  return (
    <form onSubmit={submit} className="relative">
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute left-4 top-[1.4rem] h-5 w-5 -translate-y-1/2 text-muted"
        fill="none"
      >
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path
          d="M20 20l-3.5-3.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
        placeholder="Search the web…"
        aria-label="Search"
        autoComplete="off"
        className="w-full rounded-xl border border-border bg-surface py-3 pl-12 pr-4 text-base outline-none ring-accent-2/40 transition focus:border-accent-2/60 focus:ring-2"
      />

      {showList && (
        <ul className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-border bg-surface py-1 shadow-lg">
          {suggestions.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                // onMouseDown (not click) so it fires before the input blur closes the list.
                onMouseDown={(e) => {
                  e.preventDefault();
                  go(s);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm ${
                  i === active ? "bg-surface-2 text-fg" : "text-muted"
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M20 20l-3.5-3.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <span className="truncate">{s}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
