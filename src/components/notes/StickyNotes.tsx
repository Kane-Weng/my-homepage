import { useStore } from "../../store/useStore";
import type { StickyNote as Note } from "../../store/types";

function NoteCard({ note }: { note: Note }) {
  const updateNote = useStore((s) => s.updateNote);
  const removeNote = useStore((s) => s.removeNote);

  return (
    <div
      className="group relative rounded-lg p-3 shadow-sm"
      style={{ background: note.color }}
    >
      <button
        onClick={() => removeNote(note.id)}
        aria-label="Delete note"
        className="absolute right-1.5 top-1.5 text-black/40 opacity-0 transition-opacity hover:text-black/70 group-hover:opacity-100"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
          <path
            d="M6 6l12 12M18 6L6 18"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <textarea
        value={note.content}
        onChange={(e) => updateNote(note.id, { content: e.target.value })}
        placeholder="Jot something…"
        rows={3}
        className="w-full resize-none border-none bg-transparent text-sm text-black/80 outline-none placeholder:text-black/40"
      />
    </div>
  );
}

export default function StickyNotes() {
  const notes = useStore((s) => s.notes);
  const addNote = useStore((s) => s.addNote);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted">Sticky notes</h2>
        <button
          onClick={addNote}
          className="text-xs text-accent-2 hover:opacity-80"
        >
          + Add
        </button>
      </div>

      {notes.length === 0 ? (
        <button
          onClick={addNote}
          className="w-full rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted hover:border-accent-2/50 hover:text-fg"
        >
          Throw a quick thought here!
        </button>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {notes.map((n) => (
            <NoteCard key={n.id} note={n} />
          ))}
        </div>
      )}
    </section>
  );
}
