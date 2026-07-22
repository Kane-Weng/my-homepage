import { useEffect, useRef, useState } from "react";
import { useStore } from "../store/useStore";
import Modal from "./ui/Modal";
import AccountButton from "./AccountButton";
import { BACKGROUND_PRESETS } from "../data/defaults";
import { bgKey, idbDel, idbGet, idbSet } from "../lib/idb";
import { newImageId } from "../lib/background";
import { exportData, importData } from "../lib/backup";
import { supabaseEnabled } from "../lib/supabase";
import type { Background, BgImage, LinkMode } from "../store/types";

/** A small preview swatch for a preset / option. */
function Swatch({
  active,
  onClick,
  label,
  style,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-lg p-1 ${
        active ? "ring-2 ring-accent-2" : ""
      }`}
    >
      <span
        className="grid h-10 w-14 place-items-center overflow-hidden rounded-md border border-border text-muted"
        style={style}
      >
        {children}
      </span>
      <span className="text-[11px] text-muted">{label}</span>
    </button>
  );
}

/** A library image tile that resolves its own object URL for uploads. */
function LibraryTile({
  img,
  active,
  onSelect,
  onRemove,
}: {
  img: BgImage;
  active: boolean;
  onSelect: () => void;
  onRemove: () => void;
}) {
  const [url, setUrl] = useState<string | null>(
    img.kind === "url" ? (img.value ?? null) : null,
  );
  useEffect(() => {
    if (img.kind !== "upload") return;
    let obj: string | null = null;
    let cancelled = false;
    idbGet(bgKey(img.id)).then((b) => {
      if (b && !cancelled) {
        obj = URL.createObjectURL(b);
        setUrl(obj);
      }
    });
    return () => {
      cancelled = true;
      if (obj) URL.revokeObjectURL(obj);
    };
  }, [img.id, img.kind]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onSelect}
        aria-label="Use this image"
        className={`h-10 w-14 overflow-hidden rounded-md border border-border bg-surface-2 ${
          active ? "ring-2 ring-accent-2" : ""
        }`}
        style={
          url
            ? { backgroundImage: `url(${url})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      />
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove image"
        className="absolute -right-1.5 -top-1.5 grid h-4 w-4 place-items-center rounded-full bg-surface-2 text-muted hover:text-rose-400"
      >
        <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none">
          <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

type SectionId = "general" | "appearance" | "categories" | "timer" | "data";

const SECTIONS: { id: SectionId; label: string; icon: React.ReactNode }[] = [
  { id: "general", label: "General", icon: (<><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.5-6 8-6s8 2 8 6" /></>) },
  { id: "appearance", label: "Appearance", icon: (<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="8.5" cy="9" r="1.5" /><path d="M4 17l5-4 4 3 3-2 4 3" /></>) },
  { id: "categories", label: "Categories", icon: (<><path d="M3 8l7-4 7 4v8l-7 4-7-4z" /><circle cx="10" cy="8" r="1.2" /></>) },
  { id: "timer", label: "Timer", icon: (<><circle cx="12" cy="13" r="8" /><path d="M12 9v4l3 2M9 2h6" /></>) },
  { id: "data", label: "Data", icon: (<><path d="M12 3v12m0 0l-4-4m4 4l4-4" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" /></>) },
];

const MODES: { id: LinkMode; label: string }[] = [
  { id: "all", label: "All" },
  { id: "work", label: "Work" },
  { id: "relax", label: "Relax" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function Settings({ open, onClose }: Props) {
  const background = useStore((s) => s.settings.background);
  const modeBackgrounds = useStore((s) => s.settings.modeBackgrounds);
  const library = useStore((s) => s.settings.backgroundLibrary);
  const setBackground = useStore((s) => s.setBackground);
  const setModeBackground = useStore((s) => s.setModeBackground);
  const addBackgroundImage = useStore((s) => s.addBackgroundImage);
  const removeBackgroundImage = useStore((s) => s.removeBackgroundImage);
  const name = useStore((s) => s.settings.name);
  const pomodoro = useStore((s) => s.settings.pomodoro);
  const updateSettings = useStore((s) => s.updateSettings);
  const categories = useStore((s) => s.categories);
  const addCategory = useStore((s) => s.addCategory);
  const updateCategory = useStore((s) => s.updateCategory);
  const removeCategory = useStore((s) => s.removeCategory);

  const [section, setSection] = useState<SectionId>("general");
  const [editingMode, setEditingMode] = useState<LinkMode>("all");
  const [urlDraft, setUrlDraft] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const backupRef = useRef<HTMLInputElement>(null);

  // The background currently applied to the mode being edited.
  const current: Background | undefined =
    editingMode === "all" ? background : modeBackgrounds[editingMode];

  const setFor = (bg: Background) => {
    if (editingMode === "all") setBackground(bg);
    else setModeBackground(editingMode, bg);
  };

  const presetActive = (bg: Background) =>
    !!current &&
    bg.kind === current.kind &&
    (bg.kind !== "gradient" ||
      (current.kind === "gradient" && bg.value === current.value));

  const onUploadNew = async (file: File) => {
    const id = newImageId();
    await idbSet(bgKey(id), file);
    addBackgroundImage({ id, kind: "upload" });
    setFor({ kind: "image", id });
  };
  const addUrlImage = () => {
    if (!urlDraft.trim()) return;
    const id = newImageId();
    addBackgroundImage({ id, kind: "url", value: urlDraft.trim() });
    setFor({ kind: "image", id });
    setUrlDraft("");
  };
  const removeImg = (img: BgImage) => {
    if (img.kind === "upload") idbDel(bgKey(img.id));
    removeBackgroundImage(img.id);
  };

  const addNewCategory = () => {
    if (!newCategory.trim()) return;
    addCategory(newCategory);
    setNewCategory("");
  };

  return (
    <Modal open={open} onClose={onClose} title="Settings" bare widthClass="max-w-3xl">
      <div className="flex h-[70vh]">
        {/* Left nav */}
        <nav className="flex w-44 shrink-0 flex-col gap-0.5 border-r border-border bg-surface-2/30 p-3">
          <h2 className="px-2 pb-3 text-base font-semibold">Settings</h2>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                section === s.id ? "bg-surface text-fg" : "text-muted hover:bg-surface hover:text-fg"
              }`}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                {s.icon}
              </svg>
              {s.label}
            </button>
          ))}
        </nav>

        {/* Right content */}
        <div className="flex-1 overflow-y-auto p-6">
          {section === "general" && (
            <div className="space-y-6">
              <section>
                <h3 className="mb-1 text-sm font-semibold">Display name</h3>
                <p className="mb-3 text-xs text-muted">
                  Shown in the greeting. Leave blank to use your Google account name.
                </p>
                <input
                  value={name ?? ""}
                  onChange={(e) => updateSettings({ name: e.target.value })}
                  placeholder="Your name…"
                  className="w-full max-w-sm rounded-lg bg-surface-2 px-3 py-2 text-sm outline-none ring-accent-2/50 focus:ring-2"
                />
              </section>

              <section>
                <h3 className="mb-1 text-sm font-semibold">Account</h3>
                <p className="mb-3 text-xs text-muted">
                  Sign in with Google to sync your data across devices and show your calendar.
                </p>
                {supabaseEnabled ? (
                  <AccountButton />
                ) : (
                  <p className="text-xs text-muted">
                    Cross-device sync needs Supabase configured (see SUPABASE_SETUP.md).
                  </p>
                )}
              </section>
            </div>
          )}

          {section === "appearance" && (
            <section>
              <h3 className="mb-1 text-sm font-semibold">Background</h3>
              <p className="mb-3 text-xs text-muted">
                Pick a background — set one per mode, reuse a saved image, or shuffle randomly.
              </p>

              {/* Applies-to mode selector */}
              <div className="mb-4 inline-flex rounded-lg bg-surface-2 p-0.5 text-xs">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setEditingMode(m.id)}
                    className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                      editingMode === m.id ? "bg-surface text-fg" : "text-muted hover:text-fg"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-start gap-2">
                {editingMode !== "all" && (
                  <Swatch
                    active={current === undefined}
                    onClick={() => setModeBackground(editingMode, null)}
                    label="Default"
                    style={{ background: "var(--color-bg)" }}
                  >
                    <span className="text-[10px]">↺</span>
                  </Swatch>
                )}

                {BACKGROUND_PRESETS.map((p) => (
                  <Swatch
                    key={p.id}
                    active={presetActive(p.background)}
                    onClick={() => setFor(p.background)}
                    label={p.label}
                    style={{
                      background: p.background.kind === "gradient" ? p.background.value : "var(--color-bg)",
                    }}
                  />
                ))}

                <Swatch
                  active={current?.kind === "random"}
                  onClick={() => setFor({ kind: "random" })}
                  label="Random"
                  style={{ background: "var(--color-surface-2)" }}
                >
                  <span className="text-base">🎲</span>
                </Swatch>
              </div>

              {/* Saved image library */}
              <h4 className="mb-2 mt-5 text-xs font-semibold uppercase tracking-wide text-muted">
                Your images
              </h4>
              {library.length === 0 ? (
                <p className="text-xs text-muted">
                  No saved images yet. Add a URL or upload one below — they’re kept here to reuse.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {library.map((img) => (
                    <LibraryTile
                      key={img.id}
                      img={img}
                      active={current?.kind === "image" && current.id === img.id}
                      onSelect={() => setFor({ kind: "image", id: img.id })}
                      onRemove={() => removeImg(img)}
                    />
                  ))}
                </div>
              )}

              <div className="mt-4 max-w-sm space-y-2">
                <div className="flex gap-2">
                  <input
                    value={urlDraft}
                    onChange={(e) => setUrlDraft(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addUrlImage()}
                    placeholder="Image URL…"
                    className="flex-1 rounded-lg bg-surface-2 px-3 py-2 text-sm outline-none ring-accent-2/50 focus:ring-2"
                  />
                  <button
                    type="button"
                    onClick={addUrlImage}
                    className="rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted hover:text-fg"
                  >
                    Add
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted hover:text-fg"
                >
                  Upload image…
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onUploadNew(f);
                    e.target.value = "";
                  }}
                />
              </div>
            </section>
          )}

          {section === "categories" && (
            <section>
              <h3 className="mb-1 text-sm font-semibold">Categories</h3>
              <p className="mb-3 text-xs text-muted">
                Rename, recolor, or remove. Removing keeps the habits — they move to “Uncategorized.”
              </p>

              {categories.length === 0 ? (
                <p className="text-xs text-muted">No categories yet.</p>
              ) : (
                <ul className="max-w-md space-y-1.5">
                  {categories.map((c) => (
                    <li key={c.id} className="flex items-center gap-2">
                      <input
                        type="color"
                        value={c.color}
                        onChange={(e) => updateCategory(c.id, { color: e.target.value })}
                        aria-label={`Color for ${c.name}`}
                        className="h-7 w-7 shrink-0 cursor-pointer rounded-md border border-border bg-transparent"
                      />
                      <input
                        value={c.name}
                        onChange={(e) => updateCategory(c.id, { name: e.target.value })}
                        aria-label={`Name for ${c.name}`}
                        className="flex-1 rounded-lg bg-surface-2 px-3 py-1.5 text-sm outline-none ring-accent-2/50 focus:ring-2"
                      />
                      <button
                        type="button"
                        onClick={() => removeCategory(c.id)}
                        className="shrink-0 px-2 text-xs text-muted hover:text-rose-400"
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 flex max-w-md gap-2">
                <input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addNewCategory()}
                  placeholder="New category name…"
                  className="flex-1 rounded-lg bg-surface-2 px-3 py-2 text-sm outline-none ring-accent-2/50 focus:ring-2"
                />
                <button
                  type="button"
                  onClick={addNewCategory}
                  className="rounded-lg bg-accent-2 px-3 py-2 text-sm font-medium text-bg hover:opacity-90"
                >
                  Add
                </button>
              </div>
            </section>
          )}

          {section === "timer" && (
            <section className="max-w-md space-y-1">
              <h3 className="mb-2 text-sm font-semibold">Pomodoro</h3>
              <label className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-surface-2">
                <span className="text-sm">
                  Show Pomodoro
                  <span className="block text-[11px] text-muted">
                    Uncheck to hide the timer section entirely.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={pomodoro.enabled}
                  onChange={(e) => updateSettings({ pomodoro: { ...pomodoro, enabled: e.target.checked } })}
                  className="h-4 w-4 shrink-0 accent-accent-2"
                />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-surface-2">
                <span className="text-sm">
                  Pure timer
                  <span className="block text-[11px] text-muted">
                    One phase, no work/break split — type any duration.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={pomodoro.pureTimer}
                  onChange={(e) => updateSettings({ pomodoro: { ...pomodoro, pureTimer: e.target.checked } })}
                  className="h-4 w-4 shrink-0 accent-accent-2"
                />
              </label>
              <label className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-surface-2">
                <span className="text-sm">
                  Focus mode
                  <span className="block text-[11px] text-muted">
                    Magnify and center the timer while it runs.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={!!pomodoro.focusMode}
                  onChange={(e) => updateSettings({ pomodoro: { ...pomodoro, focusMode: e.target.checked } })}
                  className="h-4 w-4 shrink-0 accent-accent-2"
                />
              </label>
            </section>
          )}

          {section === "data" && (
            <section>
              <h3 className="mb-1 text-sm font-semibold">Backup</h3>
              <p className="mb-3 text-xs text-muted">
                Export a JSON file, or import one on another device. (Your data lives in this browser only.)
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={exportData}
                  className="rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted hover:text-fg"
                >
                  Export
                </button>
                <button
                  type="button"
                  onClick={() => backupRef.current?.click()}
                  className="rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted hover:text-fg"
                >
                  Import…
                </button>
                <input
                  ref={backupRef}
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    e.target.value = "";
                    if (!f) return;
                    try {
                      await importData(f);
                    } catch {
                      alert("Couldn't read that backup file.");
                    }
                  }}
                />
              </div>
            </section>
          )}
        </div>
      </div>
    </Modal>
  );
}
