import { create } from "zustand";

export type SyncStatus =
  | "off" // Supabase not configured
  | "signedOut"
  | "syncing"
  | "synced"
  | "error";

export interface SyncUser {
  id: string;
  email?: string;
  /** Full name from the Google account, when available. */
  name?: string;
}

interface SyncState {
  user: SyncUser | null;
  status: SyncStatus;
  error?: string;
  setUser: (user: SyncUser | null) => void;
  setStatus: (status: SyncStatus, error?: string) => void;
}

export const useSync = create<SyncState>((set) => ({
  user: null,
  status: "off",
  setUser: (user) => set({ user }),
  setStatus: (status, error) => set({ status, error }),
}));
