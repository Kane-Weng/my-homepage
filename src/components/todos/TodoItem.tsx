import { useStore } from "../../store/useStore";
import { todayStr } from "../../lib/dates";
import type { Category, Todo } from "../../store/types";

interface Props {
  todo: Todo;
  category?: Category;
  editing?: boolean;
  categories?: Category[];
}

export default function TodoItem({ todo, category, editing, categories }: Props) {
  const updateTodo = useStore((s) => s.updateTodo);
  const removeTodo = useStore((s) => s.removeTodo);
  const accent = category?.color ?? "var(--color-muted)";

  if (editing) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2">
        <input
          defaultValue={todo.title}
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v && v !== todo.title) updateTodo(todo.id, { title: v });
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          aria-label={`Edit to-do name for ${todo.title}`}
          className="min-w-0 flex-1 rounded-md bg-surface-2 px-2 py-1 text-sm outline-none ring-accent-2/50 focus:ring-2"
        />
        <select
          value={todo.categoryId ?? ""}
          onChange={(e) =>
            updateTodo(todo.id, { categoryId: e.target.value || undefined })
          }
          aria-label={`Category for ${todo.title}`}
          className="shrink-0 rounded-md bg-surface-2 px-2 py-1 text-xs text-muted outline-none ring-accent-2/50 focus:ring-2"
        >
          <option value="">None</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button
          onClick={() => removeTodo(todo.id)}
          aria-label={`Delete ${todo.title}`}
          className="shrink-0 text-muted hover:text-rose-400"
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
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 transition-colors hover:border-border/80">
      <button
        onClick={() => updateTodo(todo.id, { completedAt: todayStr() })}
        aria-label={`Mark ${todo.title} complete`}
        title="Mark complete"
        className="grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-colors hover:bg-surface-2"
        style={{ borderColor: accent }}
      />

      <div className="min-w-0 flex-1">
        <span className="block truncate text-sm text-fg">{todo.title}</span>
        {todo.startedAt && (
          <span className="text-[11px] text-muted">
            Started {todo.startedAt}
          </span>
        )}
      </div>

      {category && (
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[11px]"
          style={{ background: `${category.color}22`, color: category.color }}
        >
          {category.name}
        </span>
      )}
    </div>
  );
}
