import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import HabitTracker from "./components/habits/HabitTracker";
import QuickLinks from "./components/links/QuickLinks";
import StickyNotes from "./components/notes/StickyNotes";
import Pomodoro from "./components/Pomodoro";
import CommandPalette from "./components/CommandPalette";

export default function App() {
  return (
    <div className="mx-auto min-h-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <Header />

      <div className="mx-auto mt-6 max-w-2xl">
        <SearchBar />
      </div>

      <main className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        {/* Left: the core habit tracker */}
        <div className="rounded-2xl border border-border bg-surface/40 p-5">
          <HabitTracker />
        </div>

        {/* Right: quick links, pomodoro, sticky notes */}
        <div className="space-y-6">
          <QuickLinks />
          <Pomodoro />
          <StickyNotes />
        </div>
      </main>

      <CommandPalette />
    </div>
  );
}
