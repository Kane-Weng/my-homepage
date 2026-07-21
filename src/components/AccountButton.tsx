import { useSync } from "../store/useSync";
import { supabaseEnabled } from "../lib/supabase";
import { signInWithGoogle, signOut } from "../lib/googleAuth";

const STATUS_LABEL: Record<string, string> = {
  syncing: "Syncing…",
  synced: "Synced",
  error: "Sync error",
};

const STATUS_COLOR: Record<string, string> = {
  syncing: "#38bdf8",
  synced: "#34d399",
  error: "#fb7185",
};

export default function AccountButton() {
  const user = useSync((s) => s.user);
  const status = useSync((s) => s.status);

  // Hidden until Supabase is configured (keeps the app usable pre-setup).
  if (!supabaseEnabled) return null;

  if (!user) {
    return (
      <button
        onClick={() => signInWithGoogle()}
        className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-medium text-fg hover:border-accent-2/50"
      >
        <GoogleGlyph />
        Sign in
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5">
      <span
        className="h-2 w-2 rounded-full"
        style={{ background: STATUS_COLOR[status] ?? "#8b98a5" }}
        title={STATUS_LABEL[status] ?? ""}
      />
      <span className="max-w-28 truncate text-xs text-muted" title={user.email}>
        {user.email ?? "Signed in"}
      </span>
      <button
        onClick={() => signOut()}
        className="text-xs text-muted hover:text-fg"
      >
        Sign out
      </button>
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
