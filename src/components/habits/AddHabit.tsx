import { useState } from "react";
import { useStore } from "../../store/useStore";
import Modal from "../ui/Modal";
import type { Weekday } from "../../store/types";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] as const;
const NEW_CATEGORY = "__new__";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AddHabit({ open, onClose }: Props) {
  const categories = useStore((s) => s.categories);
  const addHabit = useStore((s) => s.addHabit);
  const addCategory = useStore((s) => s.addCategory);

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? NEW_CATEGORY);
  const [newCategory, setNewCategory] = useState("");
  const [weekdays, setWeekdays] = useState<Weekday[]>([]);

  const reset = () => {
    setTitle("");
    setNewCategory("");
    setWeekdays([]);
    setCategoryId(categories[0]?.id ?? NEW_CATEGORY);
  };

  const toggleDay = (d: Weekday) =>
    setWeekdays((w) =>
      w.includes(d) ? w.filter((x) => x !== d) : [...w, d].sort(),
    );

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let catId = categoryId;
    if (categoryId === NEW_CATEGORY) {
      if (!newCategory.trim()) return;
      catId = addCategory(newCategory).id;
    }
    addHabit({ title, categoryId: catId, weekdays });
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="New habit">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-muted">Title</label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Solve one LeetCode problem"
            className="w-full rounded-lg bg-surface-2 px-3 py-2 text-sm outline-none ring-accent-2/50 focus:ring-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full rounded-lg bg-surface-2 px-3 py-2 text-sm outline-none"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            <option value={NEW_CATEGORY}>+ New category…</option>
          </select>
          {categoryId === NEW_CATEGORY && (
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Category name"
              className="mt-2 w-full rounded-lg bg-surface-2 px-3 py-2 text-sm outline-none ring-accent-2/50 focus:ring-2"
            />
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted">
            Days (none = every day)
          </label>
          <div className="flex gap-1.5">
            {DAY_LABELS.map((label, i) => {
              const active = weekdays.includes(i as Weekday);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleDay(i as Weekday)}
                  className={`h-8 w-8 rounded-full text-xs font-medium transition-colors ${
                    active
                      ? "bg-accent-2 text-bg"
                      : "bg-surface-2 text-muted hover:text-fg"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-muted hover:text-fg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-accent-2 px-4 py-2 text-sm font-medium text-bg hover:opacity-90"
          >
            Add habit
          </button>
        </div>
      </form>
    </Modal>
  );
}
