import { supabase, supabaseEnabled } from "./supabase";
import { storeGoogleRefreshToken } from "./googleAuth";
import { useStore } from "../store/useStore";
import { useSync } from "../store/useSync";
import { snapshot } from "./backup";
import type { Category, Habit, QuickLink, Settings, StickyNote } from "../store/types";

/** The shape we store in / read from Supabase. */
interface SyncSnapshot {
  categories: Category[];
  habits: Habit[];
  completions: Record<string, { habitId: string; date: string }>;
  links: QuickLink[];
  notes: StickyNote[];
  settings: Settings;
}

// Local "last edited" clock, used to decide who wins on structural conflicts.
const LOCAL_TS_KEY = "sync-local-ts";
let lastLocalChangeAt = Number(localStorage.getItem(LOCAL_TS_KEY) ?? 0);
let pushTimer: number | null = null;
let started = false;
let hydrated = false; // ignore the store-subscribe fired during initial merge

function markLocalChange() {
  lastLocalChangeAt = Date.now();
  localStorage.setItem(LOCAL_TS_KEY, String(lastLocalChangeAt));
}

// ---- Merge (additive; never drops completions, so streaks can't be lost) ----

/** Union by id; on a conflicting id, `winner` wins. */
function unionById<T extends { id: string }>(loser: T[], winner: T[]): T[] {
  const m = new Map<string, T>();
  for (const x of loser) m.set(x.id, x);
  for (const x of winner) m.set(x.id, x);
  return [...m.values()];
}

/** Notes carry their own updatedAt, so keep the newer copy of each id. */
function mergeNotes(a: StickyNote[], b: StickyNote[]): StickyNote[] {
  const m = new Map<string, StickyNote>();
  for (const n of [...a, ...b]) {
    const prev = m.get(n.id);
    if (!prev || n.updatedAt > prev.updatedAt) m.set(n.id, n);
  }
  return [...m.values()];
}

function merge(
  local: SyncSnapshot,
  remote: SyncSnapshot,
  remoteNewer: boolean,
): SyncSnapshot {
  const winner = remoteNewer ? remote : local;
  const loser = remoteNewer ? local : remote;
  return {
    // Completions union regardless of who's newer — a day done on either
    // device stays done. This is what protects the streak.
    completions: { ...loser.completions, ...winner.completions },
    categories: unionById(loser.categories, winner.categories),
    habits: unionById(loser.habits, winner.habits),
    links: unionById(loser.links, winner.links),
    notes: mergeNotes(local.notes, remote.notes),
    settings: winner.settings,
  };
}

// ---- Pull / push ----

async function pull(userId: string): Promise<void> {
  const { data, error } = await supabase!
    .from("user_data")
    .select("data, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;

  const local = snapshot() as unknown as SyncSnapshot;

  if (!data) {
    // First device / empty account — seed the row with local data.
    await push(userId);
    return;
  }

  const remote = data.data as SyncSnapshot;
  const remoteNewer = new Date(data.updated_at).getTime() > lastLocalChangeAt;
  const merged = merge(local, remote, remoteNewer);

  // Apply merged state locally, then write it back so both sides converge.
  useStore.setState(merged);
  await push(userId);
}

async function push(userId: string): Promise<void> {
  const { error } = await supabase!.from("user_data").upsert({
    user_id: userId,
    data: snapshot(),
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

function schedulePush(userId: string): void {
  if (pushTimer) clearTimeout(pushTimer);
  pushTimer = window.setTimeout(() => {
    push(userId).catch((e) =>
      useSync.getState().setStatus("error", String(e?.message ?? e)),
    );
  }, 1500);
}

// ---- Init (call once at app start) ----

export function initSync(): void {
  if (!supabaseEnabled || !supabase || started) return;
  started = true;
  useSync.getState().setStatus("signedOut");

  // Any local edit (after the initial merge) bumps the clock and schedules a push.
  useStore.subscribe(() => {
    if (!hydrated) return;
    markLocalChange();
    const user = useSync.getState().user;
    if (user) schedulePush(user.id);
  });

  supabase.auth.onAuthStateChange(async (_event, session) => {
    const user = session?.user ?? null;
    useSync.getState().setUser(user ? { id: user.id, email: user.email } : null);

    if (!user) {
      hydrated = false;
      useSync.getState().setStatus("signedOut");
      return;
    }

    // Fresh sign-ins include the Google refresh token — stash it server-side.
    if (session?.provider_refresh_token) {
      storeGoogleRefreshToken(session.provider_refresh_token).catch(() => {});
    }

    useSync.getState().setStatus("syncing");
    try {
      await pull(user.id);
      hydrated = true;
      useSync.getState().setStatus("synced");
    } catch (e) {
      useSync.getState().setStatus("error", String((e as Error)?.message ?? e));
    }
  });
}
