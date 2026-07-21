// @ts-nocheck  (Deno Edge Function — runs on Supabase, not part of the Vite build)
//
// Two actions, both scoped to the authenticated caller:
//   { action: "store", refresh_token } → save the user's Google refresh token
//   { action: "get" }                  → mint a fresh Google access token
//
// The Google client secret and the refresh tokens never touch the browser.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  // supabase-js sends apikey + x-client-info too; all requested headers must be
  // allowed or the browser preflight fails ("Failed to send a request").
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Identify the caller from their Supabase JWT.
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) return json({ error: "unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);
    const body = await req.json().catch(() => ({}));

    if (body.action === "store") {
      if (!body.refresh_token) return json({ error: "missing refresh_token" }, 400);
      const { error } = await admin.from("google_tokens").upsert({
        user_id: user.id,
        refresh_token: body.refresh_token,
        updated_at: new Date().toISOString(),
      });
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    // action: "get" — exchange the stored refresh token for a fresh access token.
    const { data: row } = await admin
      .from("google_tokens")
      .select("refresh_token")
      .eq("user_id", user.id)
      .maybeSingle();
    if (!row?.refresh_token) return json({ error: "no_refresh_token" }, 404);

    const resp = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
        client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
        refresh_token: row.refresh_token,
        grant_type: "refresh_token",
      }),
    });
    const tok = await resp.json();
    if (!resp.ok) return json({ error: "refresh_failed", detail: tok }, 400);
    return json({ access_token: tok.access_token, expires_in: tok.expires_in });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
