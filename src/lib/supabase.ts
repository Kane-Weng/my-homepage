import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// URL + anon key are public by design (protected by row-level security).
// Provided at build time via Vite env vars; see SUPABASE_SETUP.md.
const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** True once the project has been configured. Everything sync-related is
 *  gated on this so the app runs fine before Supabase is set up. */
export const supabaseEnabled = Boolean(url && anon);

export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(url!, anon!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
