import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import TrackerPanel from "./components/TrackerPanel";
import QuickLinks from "./components/links/QuickLinks";
import StickyNotes from "./components/notes/StickyNotes";
import Pomodoro from "./components/Pomodoro";
import CommandPalette from "./components/CommandPalette";
import AppBackground from "./components/AppBackground";
import CalendarPanel from "./components/CalendarPanel";
import { useEffect } from "react";
import { initSync } from "./lib/sync";

export default function App() {
  // Start Supabase auth + cross-device sync (no-op until Supabase is configured).
  useEffect(() => {
    initSync();
  }, []);

  return (
    <div className="mx-auto min-h-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <AppBackground />
      <Header />

      <div className="mx-auto mt-6 max-w-2xl">
        <SearchBar />
      </div>

      <main className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Left: the core habit tracker + to-dos */}
        <div className="rounded-2xl border border-border bg-surface/40 p-5">
          <TrackerPanel />
        </div>

        {/* Right: quick links, calendar, pomodoro, sticky notes */}
        <div className="space-y-6">
          <QuickLinks />
          <CalendarPanel />
          <Pomodoro />
          <StickyNotes />
        </div>
      </main>

      <CommandPalette />
    </div>
  );
}
