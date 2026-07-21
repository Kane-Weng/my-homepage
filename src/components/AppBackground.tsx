import { useEffect, useState } from "react";
import { useStore } from "../store/useStore";
import { BG_IMAGE_KEY, idbGet } from "../lib/idb";

/** Fixed full-screen layer behind all content that paints the chosen
 *  background. Image backgrounds get a dark scrim so text stays readable. */
export default function AppBackground() {
  const bg = useStore((s) => s.settings.background);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);

  // Load the uploaded blob from IndexedDB and mint an object URL for it.
  useEffect(() => {
    if (bg.kind !== "upload") {
      setUploadUrl(null);
      return;
    }
    let url: string | null = null;
    idbGet(BG_IMAGE_KEY).then((blob) => {
      if (blob) {
        url = URL.createObjectURL(blob);
        setUploadUrl(url);
      }
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [bg.kind]);

  const imageUrl =
    bg.kind === "url" ? bg.value : bg.kind === "upload" ? uploadUrl : null;

  const style: React.CSSProperties = imageUrl
    ? {
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : bg.kind === "gradient"
      ? { background: bg.value }
      : { background: "var(--color-bg)" };

  return (
    <div aria-hidden className="fixed inset-0 -z-10" style={style}>
      {imageUrl && <div className="absolute inset-0 bg-bg/70" />}
    </div>
  );
}
