# my-homepage

A customizable browser homepage built around a **daily-habit tracker** and a **to-do
list** that nudge you to keep up recurring habits and chip away at longer-term goals.
It also doubles as a launchpad (web search, quick links, sticky notes, a focus timer,
and your calendar). Designed to be set as a browser new-tab page.

**Local-first:** all data lives in the browser and works with zero setup. Cross-device
sync and Google Calendar are **optional** add-ons powered by Supabase.

## Features

- **Habits + streaks**: habits grouped by **category** (Work, School HW, etc.; create your
  own inline when adding). Per-day checkoff, 🔥 streak counts, a "done today" progress ring,
  and a GitHub-style activity heatmap with a category filter. **Edit mode** renames a habit
  or reassigns its category inline — no trip to Settings.
- **To-dos**: a tab beside Habits for one-off goals that don't fit a daily habit or the
  calendar. No streaks — completing one logs it to a record catalog with its date (or a
  started → completed range).
- **Search bar**: Google-powered autocomplete suggestions (via JSONP, so it works from a
  static site without CORS; results still go to your chosen engine). Bare domains navigate
  directly, and keyword **bangs** (`gh`, `yt`, `w`, `lc`, `a`, `gmap`…; see
  [src/lib/search.ts](src/lib/search.ts)) still resolve.
- **Quick links**: a bordered launcher module — two rows that scroll horizontally when
  they overflow; favicons, add/edit/remove, and a tag per link.
- **Work / Relax modes**: a header switch that filters links by tag (Work mode hides
  entertainment links; Relax mode hides work links).
- **Sticky notes**: instant capture, auto-saved.
- **Pomodoro timer**: configurable work/break, long break every N sessions, inline ± to
  adjust the length, and an optional **focus mode** that magnifies and centers the timer
  while it runs (minimize with the corner icon or Esc). In Settings you can hide the section
  entirely or switch to **pure-timer** mode (one phase, no work/break split, type any
  duration).
- **Command palette (⌘K / Ctrl+K)**: search, open links, add a habit/note, start Pomodoro.
- **Customization**: a **display name** for the greeting (falls back to your Google account
  name), and a **background library** — presets, saved image URLs, or uploads (kept in
  IndexedDB to reuse), with optional **per-mode backgrounds** (a different look for
  Work/Relax) and a **random** shuffle from your saved images. Dark theme is hardcoded in
  [src/index.css](src/index.css).
- **Calendar**: reads today's and tomorrow's Google Calendar events (optional; see Sync below).
- **Backup + sync**; Export/Import JSON, and optional cross-device sync (see Sync below).

## Tech stack

- **React 19 + Vite + TypeScript**
- **Tailwind CSS v4**; theme tokens hardcoded via `@theme` in `src/index.css`
- **Zustand** (`persist`): single source of truth, auto-saved to localStorage
- **cmdk** (command palette) · **date-fns** (streak/heatmap math)
- **Supabase**: auth, data sync, and an Edge Function for Google tokens

## Project structure

```
src/
  store/    useStore.ts (persisted app data), useUI.ts (palette actions), useSync.ts (auth/sync status), types.ts
  lib/      dates.ts (streaks/heatmap), search.ts (bangs), idb.ts (bg image),
            backup.ts (export/import), supabase.ts, googleAuth.ts, googleCalendar.ts, sync.ts
  data/     defaults.ts (seed categories/links, background presets)
  components/  habits/  todos/  notes/  links/  ui/  + TrackerPanel (Habits/To-dos tabs),
               Header, SearchBar, Pomodoro, CommandPalette, Settings, ModeSwitcher,
               AccountButton, CalendarPanel, AppBackground
supabase/   schema.sql (tables + RLS), functions/google-token/ (Edge Function)
manifest.json, redirect.html   # Chrome new-tab extension (redirects to the hosted app)
```

## Local development

```bash
npm install
npm run dev      # http://localhost:5173/my-homepage/
npm run build    # type-check + production build to dist/
npm run preview  # serve the built dist/
```

Optional sync/calendar env (copy `.env.example` → `.env.local`):

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...     # public; protected by row-level security
```

The app is fully functional without these — sync features are gated on `supabaseEnabled`.

## Deployment (GitHub Pages)

Pushing to `main` triggers [.github/workflows/deploy.yml](.github/workflows/deploy.yml),
which builds and publishes `dist/` to Pages. Two config points if you fork:

- **Base path** is `/my-homepage/` in [vite.config.ts](vite.config.ts) (must match the repo
  name for project pages). Applied in dev too so local matches production.
- **Supabase env** for the deployed build comes from GitHub → Settings → Secrets and
  variables → Actions → **Variables** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

## Use as a browser new-tab page

Load the repo as an unpacked Chrome extension (`chrome://extensions` → Developer mode →
Load unpacked). [manifest.json](manifest.json) overrides the new tab with
[redirect.html](redirect.html), which meta-refreshes to the hosted app — this keeps the
correct origin (so sync/auth match) and avoids extension CSP/MIME issues. Update the URL in
`redirect.html` to your own deployment.

## Data & sync model

- **Storage:** Zustand state is persisted to `localStorage` (key `my-homepage`, versioned
  with a migration in [src/store/useStore.ts](src/store/useStore.ts)). The uploaded
  background image lives in IndexedDB ([src/lib/idb.ts](src/lib/idb.ts)).
- **Sync (optional):** on Google sign-in, [src/lib/sync.ts](src/lib/sync.ts) pulls the
  user's row from Supabase, applies **last-write-wins** (whole-snapshot; the most recently
  edited device wins, so unchecks/deletes propagate), then pushes on every change (debounced).
- **Calendar (optional):** today's and tomorrow's events, unified with sync — one "Sign in
  with Google" grants both. A
  Supabase **Edge Function** holds the Google client secret and refreshes Calendar access
  tokens server-side, so there's no hourly re-consent (a static site can't do this alone).

**Setup for sync + calendar:** see [SUPABASE_SETUP.md](SUPABASE_SETUP.md) (create project,
run `schema.sql`, configure Google OAuth, deploy the Edge Function with `--no-verify-jwt`).

