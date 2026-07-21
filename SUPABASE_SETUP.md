# Cross-device sync + long-lived Google Calendar setup record

This wires up **Supabase** so all data (habits, streaks, notes, links, settings)
syncs across laptops, and so Google Calendar stays connected without the hourly
popup. One **Sign in with Google** does both.

Architecture: the browser talks to Supabase (auth + a `user_data` row). A Supabase
**Edge Function** holds the Google client secret and refreshes Calendar tokens
server-side.

---

## 1. Create the Supabase project
1. Sign up at <https://supabase.com> → **New project** (free tier).
2. When it's ready, go to **Project Settings → API** and copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
   - **service_role** key → used in step 5 (keep this one secret).

## 2. Create the database
1. **SQL Editor → New query**, paste the contents of [`supabase/schema.sql`](supabase/schema.sql), **Run**.
2. This creates `user_data` (your synced blob, row-level-security locked to you) and
   `google_tokens` (refresh token, readable only by the Edge Function).

## 3. Google Cloud OAuth
In <https://console.cloud.google.com> (reuse your existing project if you made one):
1. **APIs & Services → Enable APIs →** enable **Google Calendar API**.
2. **OAuth consent screen**: External, add yourself as a **Test user**, and add the
   scope `.../auth/calendar.readonly`.
3. **Credentials → Create credentials → OAuth client ID → Web application**:
   - **Authorized redirect URIs** → add your Supabase callback:
     `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client secret**.
4. In **Supabase → Authentication → Providers → Google**: enable it, paste the
   Client ID + Client secret, save.

## 4. Set the Supabase Auth redirect URLs
In **Supabase → Authentication → URL Configuration**:
1. **Site URL** → your live site: `https://kane-weng.github.io/my-homepage/`
2. **Redirect URLs → Add URL** — add both, so sign-in works live *and* locally:
   - `https://kane-weng.github.io/my-homepage/*`
   - `http://localhost:5173/my-homepage/*`

Without this, Google sign-in on the deployed site is rejected after the OAuth
round-trip — the `redirectTo` the app sends must be an allowed URL. (This is the
step that fixed sign-in on the live site.)

## 5. Deploy the Edge Function
Install the [Supabase CLI](https://supabase.com/docs/guides/cli), then from the repo root:

```bash
supabase login
supabase link --project-ref YOUR-PROJECT-REF        # from the project URL
# Give the function the Google secret (server-side only):
supabase secrets set GOOGLE_CLIENT_ID=xxxx.apps.googleusercontent.com
supabase secrets set GOOGLE_CLIENT_SECRET=xxxx
# --no-verify-jwt is REQUIRED: the function checks auth itself, and platform-level
# JWT verification would block the browser's CORS preflight.
supabase functions deploy google-token --no-verify-jwt
```

> `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are injected
> into the function automatically.


## 6. Point the app at Supabase
**Local dev:** copy `.env.example` → `.env.local` and fill in the URL + anon key.

**Deployed (GitHub Pages):** GitHub → **Settings → Secrets and variables → Actions →
Variables** → add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The deploy
workflow reads them at build time. Re-run the workflow (or push) to rebuild.

## 7. Use it
- A **Sign in** button appears top-right. Click it → Google → you're back, signed in.
- First sign-in on each laptop pulls your data and merges it in.
- The dot next to your email shows sync status (blue = syncing, green = synced).
- Calendar loads automatically and refreshes silently — no more hourly popup.

---

## How conflicts are handled
Sync merges **additively** so you can't lose a streak:
- **Completions** from both devices are unioned — a day done anywhere stays done.
- **Habits / links / categories** merge by id; **notes** keep the newer edit.
- **Settings** use last-write-wins.

Trade-off: because merges are additive, **deleting** a habit/link on one laptop may
not propagate until you also delete it on the other (no tombstones). Good enough for
personal use; can be upgraded later if it gets annoying.
