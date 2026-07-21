import { useEffect, useRef, useState } from "react";
import { useStore } from "../store/useStore";
import { useUI } from "../store/useUI";
import { BANG_HINTS, resolveSearch } from "../lib/search";

export default function SearchBar() {
  const engine = useStore((s) => s.settings.searchEngine);
  const focusSignal = useUI((s) => s.focusSearchSignal);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Respond to the command palette's "focus search" action.
  useEffect(() => {
    if (focusSignal > 0) inputRef.current?.focus();
  }, [focusSignal]);

  const submit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    const url = resolveSearch(value, engine);
    if (url) window.location.href = url;  // navigate the browser to the valid generated url
  };

  // Bang Hint detection: check if first token (word) matches a known shortcut
  const firstToken = value.trim().split(/\s+/)[0]?.toLowerCase();
  const activeBang = BANG_HINTS.find((b) => b.key === firstToken);

  return (
    <form onSubmit={submit} className="relative">
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted"
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
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search the web… (try: gh vite, yt lofi, w entropy)"
        aria-label="Search"
        className="w-full rounded-xl border border-border bg-surface py-3 pl-12 pr-24 text-base outline-none ring-accent-2/40 transition focus:border-accent-2/60 focus:ring-2"
      />
      {activeBang && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md bg-surface-2 px-2 py-1 text-xs text-muted">
          → {activeBang.label}
        </span>
      )}
    </form>
  );
}
