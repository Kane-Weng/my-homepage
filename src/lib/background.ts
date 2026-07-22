import { useStore } from "../store/useStore";
import { BG_IMAGE_KEY, bgKey, idbGet, idbSet } from "./idb";

const uid = () => `img-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * One-time bridge: if the user's active background is a legacy single-image kind
 * ("upload"/"url"), fold it into the new background library so it isn't lost when
 * they pick a different background. Safe to call on every load — it no-ops once
 * the background is already a library reference.
 */
export async function importLegacyBackground(): Promise<void> {
  const { settings, addBackgroundImage, setBackground } = useStore.getState();
  const bg = settings.background;

  if (bg.kind === "url") {
    const id = uid();
    addBackgroundImage({ id, kind: "url", value: bg.value });
    setBackground({ kind: "image", id });
    return;
  }

  if (bg.kind === "upload") {
    const blob = await idbGet(BG_IMAGE_KEY);
    if (!blob) {
      setBackground({ kind: "default" });
      return;
    }
    const id = uid();
    await idbSet(bgKey(id), blob);
    addBackgroundImage({ id, kind: "upload" });
    setBackground({ kind: "image", id });
  }
}

export { uid as newImageId };
