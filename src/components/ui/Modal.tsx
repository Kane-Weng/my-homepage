import { useEffect, type ReactNode } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Tailwind max-width class for the dialog. Default: max-w-md. */
  widthClass?: string;
  /** Skip the built-in title + padding (children own the full layout). */
  bare?: boolean;
}

/** Minimal accessible modal: backdrop click + Esc to close. */
export default function Modal({
  open,
  onClose,
  title,
  children,
  widthClass = "max-w-md",
  bare = false,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`max-h-[85vh] w-full ${widthClass} rounded-xl border border-border bg-surface shadow-2xl ${
          bare ? "overflow-hidden" : "overflow-y-auto p-5"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {!bare && <h2 className="mb-4 text-base font-semibold">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
