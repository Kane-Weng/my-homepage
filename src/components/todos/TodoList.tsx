import { useMemo, useState } from "react";
import { useStore } from "../../store/useStore";
import TodoItem from "./TodoItem";
import AddTodo from "./AddTodo";
import type { Todo } from "../../store/types";

export default function TodoList() {
  const todos = useStore((s) => s.todos);
  const categories = useStore((s) => s.categories);
  const updateTodo = useStore((s) => s.updateTodo);
  const removeTodo = useStore((s) => s.removeTodo);

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const catById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const active = useMemo(
    () => todos.filter((t) => !t.completedAt),
    [todos],
  );
  const done = useMemo(
    () =>
      todos
        .filter((t): t is Todo & { completedAt: string } => !!t.completedAt)
        .sort((a, b) => b.completedAt.localeCompare(a.completedAt)),
    [todos],
  );

  return (
    <section className="flex h-full flex-col gap-4">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <h2 className="text-lg font-semibold">To-dos</h2>
          <p className="text-sm text-muted">
            {active.length === 0
              ? "Nothing open — add a goal to chip away at."
              : `${active.length} open.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditing((e) => !e)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium ${
              editing
                ? "border-accent-2 text-accent-2"
                : "border-border text-muted hover:text-fg"
            }`}
          >
            {editing ? "Done" : "Edit"}
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="rounded-lg bg-accent-2 px-3 py-2 text-sm font-medium text-bg hover:opacity-90"
          >
            + Add
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pr-1">
        <div className="space-y-1.5">
          {active.map((t) => (
            <TodoItem
              key={t.id}
              todo={t}
              category={t.categoryId ? catById.get(t.categoryId) : undefined}
              editing={editing}
              categories={categories}
            />
          ))}
        </div>

        {active.length === 0 && (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted">
            One-off goals that don't fit a daily habit or the calendar. Complete
            one and it's logged below with the date.
          </div>
        )}

        {done.length > 0 && (
          <div className="border-t border-border pt-4">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Completed · {done.length}
            </h3>
            <ul className="space-y-1.5">
              {done.map((t) => {
                const cat = t.categoryId ? catById.get(t.categoryId) : undefined;
                const range = t.startedAt
                  ? `${t.startedAt} → ${t.completedAt}`
                  : t.completedAt;
                return (
                  <li
                    key={t.id}
                    className="group flex items-center gap-3 rounded-lg border border-border bg-surface-2/40 px-3 py-2"
                  >
                    {cat && (
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ background: cat.color }}
                      />
                    )}
                    <span className="min-w-0 flex-1 truncate text-sm text-muted line-through">
                      {t.title}
                    </span>
                    <span className="shrink-0 text-[11px] tabular-nums text-muted">
                      {range}
                    </span>
                    <button
                      onClick={() => updateTodo(t.id, { completedAt: undefined })}
                      aria-label={`Reopen ${t.title}`}
                      title="Reopen"
                      className="shrink-0 text-muted opacity-0 transition-opacity hover:text-fg group-hover:opacity-100"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                        <path
                          d="M3 12a9 9 0 1 0 3-6.7M3 4v4h4"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeTodo(t.id)}
                      aria-label={`Delete ${t.title}`}
                      className="shrink-0 text-muted opacity-0 transition-opacity hover:text-rose-400 group-hover:opacity-100"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                        <path
                          d="M6 6l12 12M18 6L6 18"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <AddTodo open={addOpen} onClose={() => setAddOpen(false)} />
    </section>
  );
}
