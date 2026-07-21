# my-homepage

A custom browser homepage built around a **Duolingo-style daily-habit tracker** —
it nudges me to keep up recurring habits, builds streaks as I go, and doubles as a launchpad (search, quick links, notes,
focus timer).

## Stack

- **React + Vite + TypeScript**
- **Tailwind CSS v4**: theme tokens are hardcoded in [src/index.css](src/index.css)
  (dark by default; tweak the `@theme` block to restyle)
- **Zustand** (`persist` middleware): single source of truth, auto-saved to localStorage
- **cmdk** for command palette · **date-fns** for streak & heatmap math

## Features

- **Daily habits + streaks**: habits are grouped by **category** (Work, School HW,
  Self Project, Research, or your own). Today's scheduled habits show with a checkoff,
  a 🔥 streak counter, and a progress ring. A GitHub-style activity heatmap (with a
  category filter) shows the last ~13 weeks.
- **Search bar** with keyword **bangs**: `gh vite`, `yt lofi`, `w entropy`, `lc`,
  `a <arxiv-id>`, `gmap`… (see [src/lib/search.ts](src/lib/search.ts)). Bare domains
  navigate directly.
- **Quick links** grid with favicons (add / edit / remove).
- **Sticky notes**: instant capture, auto-saved.
- **Pomodoro timer**: configurable work/break, long break every N sessions.
- **Command palette (⌘K / Ctrl+K)**: run a search, open any link, add a habit/note,
  or start the Pomodoro, all from the keyboard.

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build to dist/
npm run preview  # serve the built dist/; production check
```

## Google Calender Setup (OAuth setup)

In [Google Cloud Console](https://console.cloud.google.com/welcome?project=my-homepage-503119):
  1. Create a project → **APIs & Services** → **Enable APIs** → **enable "Google Calendar API"**.
  2. OAuth consent screen: choose External, fill the basics, and add your own email as a Test user.
  3. **Credentials** → **Create Credentials** → **OAuth client ID** → **Web application**. Under Authorized **JavaScript origins** add both:
    - https://kane-weng.github.io
    - http://localhost:5173 (for local dev)
  4. Copy the **Client ID** → paste into the homepage's **⚙ Settings** → **Google Calendar**, Save, then click **Connect**.
