import { supabase } from "./supabase";

const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

/** Kick off Google OAuth through Supabase. Requesting offline access + consent
 *  makes Google return a refresh token we can store server-side. */
export async function signInWithGoogle(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      scopes: CALENDAR_SCOPE,
      // Return to this app (respects the /my-homepage/ base).
      redirectTo: window.location.origin + import.meta.env.BASE_URL,
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/** Persist the Google refresh token via the Edge Function (server-side only). */
export async function storeGoogleRefreshToken(refreshToken: string): Promise<void> {
  if (!supabase) return;
  await supabase.functions.invoke("google-token", {
    body: { action: "store", refresh_token: refreshToken },
  });
}

/** Ask the Edge Function for a fresh Google access token (silent refresh). */
export async function getFreshGoogleToken(): Promise<string> {
  if (!supabase) throw new Error("Sync is not configured.");
  const { data, error } = await supabase.functions.invoke("google-token", {
    body: { action: "get" },
  });
  if (error) throw error;
  if (!data?.access_token) {
    throw new Error(data?.error ?? "Could not get calendar access.");
  }
  return data.access_token as string;
}
