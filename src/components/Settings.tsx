import { useRef, useState } from "react";
import { useStore } from "../store/useStore";
import Modal from "./ui/Modal";
import { BACKGROUND_PRESETS } from "../data/defaults";
import { BG_IMAGE_KEY, idbDel, idbSet } from "../lib/idb";
import { exportData, importData } from "../lib/backup";
import type { Background } from "../store/types";

/** A small preview swatch for a background option. */
function Swatch({
  active,
  onClick,
  label,
  style,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  style: React.CSSProperties;
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
        className="h-10 w-14 rounded-md border border-border"
        style={style}
      />
      <span className="text-[11px] text-muted">{label}</span>
    </button>
  );
}

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function Settings({ open, onClose }: Props) {
  const background = useStore((s) => s.settings.background);
  const setBackground = useStore((s) => s.setBackground);

  const [urlDraft, setUrlDraft] = useState(
    background.kind === "url" ? background.value : "",
  );
  const fileRef = useRef<HTMLInputElement>(null);
  const backupRef = useRef<HTMLInputElement>(null);

  const presetActive = (bg: Background) =>
    bg.kind === background.kind &&
    (bg.kind !== "gradient" ||
      (background.kind === "gradient" && bg.value === background.value));

  const onUpload = async (file: File) => {
    await idbSet(BG_IMAGE_KEY, file);
    // Force AppBackground's effect to re-run even if kind was already "upload".
    setBackground({ kind: "default" });
    setBackground({ kind: "upload" });
  };

  return (
    <Modal open={open} onClose={onClose} title="Settings">
      <div className="space-y-6">
        {/* Background */}
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Background
          </h3>
          <div className="flex flex-wrap gap-2">
            {BACKGROUND_PRESETS.map((p) => (
              <Swatch
                key={p.id}
                active={presetActive(p.background)}
                onClick={() => setBackground(p.background)}
                label={p.label}
                style={{
                  background:
                    p.background.kind === "gradient"
                      ? p.background.value
                      : "var(--color-bg)",
                }}
              />
            ))}
          </div>

          <div className="mt-3 space-y-2">
            <div className="flex gap-2">
              <input
                value={urlDraft}
                onChange={(e) => setUrlDraft(e.target.value)}
                placeholder="Image URL…"
                className="flex-1 rounded-lg bg-surface-2 px-3 py-2 text-sm outline-none ring-accent-2/50 focus:ring-2"
              />
              <button
                type="button"
                onClick={() =>
                  urlDraft.trim() &&
                  setBackground({ kind: "url", value: urlDraft.trim() })
                }
                className="rounded-lg bg-surface-2 px-3 py-2 text-sm text-muted hover:text-fg"
              >
                Use
              </button>
            </div>

            <div className="flex items-center gap-2">
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
                  if (f) onUpload(f);
                  e.target.value = "";
                }}
              />
              {(background.kind === "url" || background.kind === "upload") && (
                <button
                  type="button"
                  onClick={() => {
                    idbDel(BG_IMAGE_KEY);
                    setBackground({ kind: "default" });
                    setUrlDraft("");
                  }}
                  className="text-xs text-muted hover:text-fg"
                >
                  Clear image
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Data backup */}
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
            Backup
          </h3>
          <p className="mb-2 text-xs text-muted">
            Export a JSON file, or import one on another device. (Your data lives
            in this browser only.)
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
      </div>
    </Modal>
  );
}
