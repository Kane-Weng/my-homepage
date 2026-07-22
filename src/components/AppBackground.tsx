import { useEffect, useMemo, useState } from "react";
import { useStore } from "../store/useStore";
import { BG_IMAGE_KEY, bgKey, idbGet } from "../lib/idb";

/** Fixed full-screen layer behind all content that paints the chosen
 *  background. Resolves per-mode overrides and random-from-library, then loads
 *  any uploaded blob from IndexedDB. Image backgrounds get a dark scrim so text
 *  stays readable. */
export default function AppBackground() {
  const background = useStore((s) => s.settings.background);
  const modeBackgrounds = useStore((s) => s.settings.modeBackgrounds);
  const library = useStore((s) => s.settings.backgroundLibrary);
  const mode = useStore((s) => s.settings.mode);

  // Per-mode override wins; otherwise the global/default background.
  const active = modeBackgrounds[mode] ?? background;

  // For "random", pick one library entry — stable until deps change / remount.
  const randomId = useMemo(() => {
    if (active.kind !== "random" || library.length === 0) return null;
    return library[Math.floor(Math.random() * library.length)].id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active.kind, library, mode]);

  // Resolve the active background to a direct URL and/or an IDB blob key.
  let directSrc: string | null = null;
  let idbLoadKey: string | null = null;
  if (active.kind === "url") {
    directSrc = active.value;
  } else if (active.kind === "upload") {
    idbLoadKey = BG_IMAGE_KEY;
  } else if (active.kind === "image" || active.kind === "random") {
    const id = active.kind === "image" ? active.id : randomId;
    const entry = id ? library.find((i) => i.id === id) : undefined;
    if (entry) {
      if (entry.kind === "url") directSrc = entry.value ?? null;
      else idbLoadKey = bgKey(entry.id);
    }
  }

  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!idbLoadKey) {
      setBlobUrl(null);
      return;
    }
    let url: string | null = null;
    let cancelled = false;
    idbGet(idbLoadKey).then((blob) => {
      if (blob && !cancelled) {
        url = URL.createObjectURL(blob);
        setBlobUrl(url);
      }
    });
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [idbLoadKey]);

  const imageUrl = directSrc ?? blobUrl;

  const style: React.CSSProperties = imageUrl
    ? {
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : active.kind === "gradient"
      ? { background: active.value }
      : { background: "var(--color-bg)" };

  return (
    <div aria-hidden className="fixed inset-0 -z-10" style={style}>
      {imageUrl && <div className="absolute inset-0 bg-bg/70" />}
    </div>
  );
}
