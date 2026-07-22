import { useState } from "react";
import { useStore } from "../../store/useStore";
import Modal from "../ui/Modal";

const NO_CATEGORY = "__none__";
const NEW_CATEGORY = "__new__";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AddTodo({ open, onClose }: Props) {
  const categories = useStore((s) => s.categories);
  const addTodo = useStore((s) => s.addTodo);
  const addCategory = useStore((s) => s.addCategory);

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState<string>(NO_CATEGORY);
  const [newCategory, setNewCategory] = useState("");
  const [startedAt, setStartedAt] = useState("");

  const reset = () => {
    setTitle("");
    setCategoryId(NO_CATEGORY);
    setNewCategory("");
    setStartedAt("");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let catId: string | undefined;
    if (categoryId === NEW_CATEGORY) {
      if (!newCategory.trim()) return;
      catId = addCategory(newCategory).id;
    } else if (categoryId !== NO_CATEGORY) {
      catId = categoryId;
    }
    addTodo({ title, categoryId: catId, startedAt: startedAt || undefined });
    reset();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="New to-do">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs text-muted">Title</label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Learn RL, build a webpage…"
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
            <option value={NO_CATEGORY}>None</option>
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
            Started (optional — records when you picked it up)
          </label>
          <input
            type="date"
            value={startedAt}
            onChange={(e) => setStartedAt(e.target.value)}
            className="w-full rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted outline-none ring-accent-2/50 focus:ring-2"
          />
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
            Add to-do
          </button>
        </div>
      </form>
    </Modal>
  );
}
