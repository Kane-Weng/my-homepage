import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useSync } from "../store/useSync";
import { supabaseEnabled } from "../lib/supabase";
import { getFreshGoogleToken } from "../lib/googleAuth";
import { fetchTodayEvents, type CalendarEvent } from "../lib/googleCalendar";

type Status = "idle" | "loading" | "connected" | "error";

export default function CalendarPanel() {
  const user = useSync((s) => s.user);
  const [status, setStatus] = useState<Status>("idle");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string>("");

  const load = async () => {
    setStatus("loading");
    setError("");
    try {
      // Edge Function silently mints a fresh Google token — no popup.
      const token = await getFreshGoogleToken();
      setEvents(await fetchTodayEvents(token));
      setStatus("connected");
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Couldn't load calendar.");
    }
  };

  // Load automatically once the user is signed in.
  useEffect(() => {
    if (user) load();
    else setStatus("idle");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted">Today's calendar</h2>
        <div className="flex items-center gap-3">
          {status === "connected" && (
            <button onClick={load} className="text-xs text-muted hover:text-fg">
              Refresh
            </button>
          )}
          <a
            href="https://calendar.google.com"
            target="_blank"
            rel="noreferrer"
            className="text-xs text-accent-2 hover:opacity-80"
            title="Open Google Calendar to add or edit events"
          >
            Open ↗
          </a>
        </div>
      </div>

      {!supabaseEnabled ? (
        <p className="text-xs text-muted">
          Calendar sync needs Supabase configured (see SUPABASE_SETUP.md).
        </p>
      ) : !user ? (
        <p className="text-xs text-muted">
          Sign in with Google (top right) to see today's events.
        </p>
      ) : status === "loading" ? (
        <p className="text-xs text-muted">Loading…</p>
      ) : status === "error" ? (
        <div className="space-y-2">
          <p className="text-xs text-rose-400">{error}</p>
          <button
            onClick={load}
            className="rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-muted hover:text-fg"
          >
            Retry
          </button>
        </div>
      ) : events.length === 0 ? (
        <p className="text-xs text-muted">Nothing on the calendar today. 🎉</p>
      ) : (
        <ul className="space-y-1.5">
          {events.map((e) => (
            <li key={e.id}>
              <a
                href={e.htmlLink}
                target="_blank"
                rel="noreferrer"
                className="flex items-baseline gap-3 rounded-lg px-2 py-1.5 hover:bg-surface-2"
              >
                <span className="w-14 shrink-0 text-xs tabular-nums text-muted">
                  {e.allDay ? "all day" : format(e.start, "HH:mm")}
                </span>
                <span className="truncate text-sm">{e.summary}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
