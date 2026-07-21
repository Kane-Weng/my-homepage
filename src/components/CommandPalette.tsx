import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useStore } from "../store/useStore";
import { useUI } from "../store/useUI";
import { resolveSearch } from "../lib/search";

export default function CommandPalette() {
  const open = useUI((s) => s.paletteOpen);
  const setOpen = useUI((s) => s.setPaletteOpen);
  const setAddHabitOpen = useUI((s) => s.setAddHabitOpen);
  const focusSearch = useUI((s) => s.focusSearch);
  const pokePomodoro = useUI((s) => s.pokePomodoro);

  const links = useStore((s) => s.links);
  const engine = useStore((s) => s.settings.searchEngine);
  const addNote = useStore((s) => s.addNote);
  const [query, setQuery] = useState("");

  // Global ⌘K / Ctrl+K toggle + Esc to close.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!open);
      } else if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  // Reset the query whenever it opens.
  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  if (!open) return null;

  const run = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[15vh]"
      onClick={() => setOpen(false)}
    >
      <Command
        label="Command palette"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
      >
        <Command.Input
          value={query}
          onValueChange={setQuery}
          autoFocus
          placeholder="Type a command or search…"
          className="w-full border-b border-border bg-transparent px-4 py-3 text-sm outline-none placeholder:text-muted"
        />
        <Command.List className="max-h-80 overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-sm text-muted">
            No results.
          </Command.Empty>

          {query.trim() && (
            <Command.Item
              forceMount
              value={`search ${query}`}
              onSelect={() =>
                run(() => {
                  const url = resolveSearch(query, engine);
                  if (url) window.location.href = url;
                })
              }
              className="mb-1 flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-fg data-[selected=true]:bg-surface-2"
            >
              🔎 Search the web for “{query.trim()}”
            </Command.Item>
          )}

          <Command.Group
            heading="Actions"
            className="text-xs text-muted [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
          >
            <Item onSelect={() => run(() => setAddHabitOpen(true))}>
              ➕ Add habit
            </Item>
            <Item onSelect={() => run(() => addNote())}>📝 Add sticky note</Item>
            <Item onSelect={() => run(() => focusSearch())}>
              🔍 Focus search bar
            </Item>
            <Item onSelect={() => run(() => pokePomodoro())}>
              ⏱️ Start / pause Pomodoro
            </Item>
          </Command.Group>

          <Command.Group
            heading="Quick links"
            className="text-xs text-muted [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
          >
            {links.map((l) => (
              <Item
                key={l.id}
                value={`link ${l.title} ${l.url}`}
                onSelect={() => run(() => (window.location.href = l.url))}
              >
                🔗 {l.title}
              </Item>
            ))}
          </Command.Group>
        </Command.List>
      </Command>
    </div>
  );
}

function Item({
  children,
  onSelect,
  value,
}: {
  children: React.ReactNode;
  onSelect: () => void;
  value?: string;
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-fg data-[selected=true]:bg-surface-2"
    >
      {children}
    </Command.Item>
  );
}
