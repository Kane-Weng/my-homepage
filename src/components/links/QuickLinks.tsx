import { useEffect, useRef, useState } from "react";
import { useStore } from "../../store/useStore";
import Modal from "../ui/Modal";
import type { LinkMode, LinkTag, QuickLink } from "../../store/types";

/** Tiles per page — 4 columns × 2 rows, iOS home-screen style. */
const PAGE_SIZE = 8;

function faviconUrl(url: string): string {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return "";
  }
}

const TAG_ORDER: LinkTag[] = ["neutral", "work", "entertainment"];
const TAG_META: Record<LinkTag, { label: string; color: string }> = {
  neutral: { label: "Neutral", color: "#8b98a5" },
  work: { label: "Work", color: "#f59e0b" },
  entertainment: { label: "Fun", color: "#a78bfa" },
};

/** work mode hides entertainment; relax mode hides work. */
function visibleInMode(tag: LinkTag, mode: LinkMode): boolean {
  if (mode === "work") return tag !== "entertainment";
  if (mode === "relax") return tag !== "work";
  return true;
}

function LinkTile({ link, editing }: { link: QuickLink; editing: boolean }) {
  const removeLink = useStore((s) => s.removeLink);
  const updateLink = useStore((s) => s.updateLink);
  const fav = faviconUrl(link.url);
  const tag: LinkTag = link.tag ?? "neutral";

  const cycleTag = () => {
    const next = TAG_ORDER[(TAG_ORDER.indexOf(tag) + 1) % TAG_ORDER.length];
    updateLink(link.id, { tag: next });
  };

  return (
    <a
      href={editing ? undefined : link.url}
      className="group relative flex flex-col items-center gap-2 rounded-xl border border-border bg-surface p-3 text-center transition-colors hover:border-accent-2/50"
    >
      {editing && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              removeLink(link.id);
            }}
            aria-label={`Remove ${link.title}`}
            className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-surface-2 text-muted hover:text-fg"
          >
            <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none">
              <path
                d="M6 6l12 12M18 6L6 18"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              cycleTag();
            }}
            title={`Tag: ${TAG_META[tag].label} (click to change)`}
            className="absolute -left-1.5 -top-1.5 h-4 w-4 rounded-full border-2 border-surface"
            style={{ background: TAG_META[tag].color }}
          />
        </>
      )}
      <div className="grid h-8 w-8 place-items-center overflow-hidden rounded-md bg-surface-2">
        {fav ? (
          <img src={fav} alt="" className="h-5 w-5" loading="lazy" />
        ) : (
          <span className="text-sm">🔗</span>
        )}
      </div>
      <span className="w-full truncate text-xs text-muted group-hover:text-fg">
        {link.title}
      </span>
    </a>
  );
}

export default function QuickLinks() {
  const links = useStore((s) => s.links);
  const mode = useStore((s) => s.settings.mode);
  const addLink = useStore((s) => s.addLink);
  const [editing, setEditing] = useState(false);
  const [modal, setModal] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [tag, setTag] = useState<LinkTag>("neutral");
  const pagesRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

  // In edit mode show every link (so hidden ones can be managed); otherwise
  // apply the active mode filter.
  const shown = editing
    ? links
    : links.filter((l) => visibleInMode(l.tag ?? "neutral", mode));

  // Chunk links into fixed-size pages (iOS home-screen style).
  const pages: QuickLink[][] = [];
  for (let i = 0; i < shown.length; i += PAGE_SIZE) {
    pages.push(shown.slice(i, i + PAGE_SIZE));
  }

  const onScroll = () => {
    const el = pagesRef.current;
    if (el) setPage(Math.round(el.scrollLeft / el.clientWidth));
  };
  const goTo = (i: number) => {
    const el = pagesRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  // Keep the active page valid as links (and page count) change.
  useEffect(() => {
    if (page > pages.length - 1) setPage(Math.max(0, pages.length - 1));
  }, [pages.length, page]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) return;
    const normalized = url.startsWith("http") ? url : `https://${url}`;
    addLink({ title, url: normalized, tag });
    setTitle("");
    setUrl("");
    setTag("neutral");
    setModal(false);
  };

  return (
    <section className="rounded-2xl border border-border bg-surface/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted">Quick links</h2>
        <div className="flex gap-3 text-xs">
          <button
            onClick={() => setEditing((v) => !v)}
            className="text-muted hover:text-fg"
          >
            {editing ? "Done" : "Edit"}
          </button>
          <button
            onClick={() => setModal(true)}
            className="text-accent-2 hover:opacity-80"
          >
            + Add
          </button>
        </div>
      </div>

      {/* Swipeable pages of 4×2 tiles that snap into place, like an iOS home
          screen. Extra padding keeps the edit-mode corner buttons from clipping. */}
      {shown.length === 0 ? (
        <p className="px-1 py-6 text-center text-xs text-muted">
          No links yet — add one with “+ Add”.
        </p>
      ) : (
        <>
          <div
            ref={pagesRef}
            onScroll={onScroll}
            className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto py-2"
          >
            {pages.map((pageLinks, i) => (
              <div
                key={i}
                className="grid w-full shrink-0 snap-center grid-cols-4 grid-rows-2 gap-3 px-2"
              >
                {pageLinks.map((l) => (
                  <LinkTile key={l.id} link={l} editing={editing} />
                ))}
              </div>
            ))}
          </div>

          {pages.length > 1 && (
            <div className="mt-1 flex justify-center gap-1.5">
              {pages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  aria-label={`Go to page ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === page ? "w-4 bg-accent-2" : "w-1.5 bg-surface-2"
                  }`}
                />
              ))}
            </div>
          )}
        </>
      )}

      {editing && (
        <p className="mt-2 text-[11px] text-muted">
          Click the dot on a link to tag it Work / Fun / Neutral. Work mode hides
          Fun links; Relax mode hides Work links.
        </p>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Add link">
        <form onSubmit={submit} className="space-y-3">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-lg bg-surface-2 px-3 py-2 text-sm outline-none ring-accent-2/50 focus:ring-2"
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="example.com"
            className="w-full rounded-lg bg-surface-2 px-3 py-2 text-sm outline-none ring-accent-2/50 focus:ring-2"
          />
          <div>
            <label className="mb-1 block text-xs text-muted">Tag</label>
            <div className="flex gap-1.5">
              {TAG_ORDER.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTag(t)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                    tag === t ? "text-bg" : "bg-surface-2 text-muted hover:text-fg"
                  }`}
                  style={tag === t ? { background: TAG_META[t].color } : undefined}
                >
                  {TAG_META[t].label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setModal(false)}
              className="rounded-lg px-3 py-2 text-sm text-muted hover:text-fg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-accent-2 px-4 py-2 text-sm font-medium text-bg hover:opacity-90"
            >
              Add
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
