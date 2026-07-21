import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { useStore } from "../store/useStore";
import {
  clearStoredToken,
  fetchTodayEvents,
  loadStoredToken,
  requestAccessToken,
  saveStoredToken,
  type CalendarEvent,
} from "../lib/googleCalendar";

type Status = "idle" | "loading" | "connected" | "error";

export default function CalendarPanel() {
  const clientId = useStore((s) => s.settings.googleClientId);
  const [status, setStatus] = useState<Status>("idle");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [error, setError] = useState<string>("");
  const tokenRef = useRef<string>("");

  const load = async (token: string) => {
    const list = await fetchTodayEvents(token);
    setEvents(list);
    setStatus("connected");
  };

  // On mount, reuse a cached token (if still valid) so a reload doesn't
  // re-trigger the OAuth popup. Only falls back to Connect once it expires.
  useEffect(() => {
    if (!clientId) return;
    const stored = loadStoredToken();
    if (!stored) return;
    tokenRef.current = stored.access_token;
    setStatus("loading");
    load(stored.access_token).catch(() => {
      clearStoredToken();
      setStatus("idle");
    });
  }, [clientId]);

  const connect = async () => {
    if (!clientId) return;
    setStatus("loading");
    setError("");
    try {
      const token = await requestAccessToken(clientId);
      tokenRef.current = token.access_token;
      saveStoredToken(token);
      await load(token.access_token);
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Something went wrong.");
    }
  };

  const refresh = async () => {
    try {
      setStatus("loading");
      await load(tokenRef.current);
    } catch {
      // Token likely expired — clear it and re-run the auth flow.
      clearStoredToken();
      connect();
    }
  };

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted">Today's calendar</h2>
        {status === "connected" && (
          <button
            onClick={refresh}
            className="text-xs text-muted hover:text-fg"
          >
            Refresh
          </button>
        )}
      </div>

      {!clientId ? (
        <p className="text-xs text-muted">
          Add your Google OAuth Client ID in Settings (⚙) to sync your calendar.
        </p>
      ) : status === "idle" || status === "error" ? (
        <div className="space-y-2">
          <button
            onClick={connect}
            className="w-full rounded-lg bg-accent-2 px-3 py-2 text-sm font-medium text-bg hover:opacity-90"
          >
            Connect Google Calendar
          </button>
          {status === "error" && (
            <p className="text-xs text-rose-400">{error}</p>
          )}
        </div>
      ) : status === "loading" ? (
        <p className="text-xs text-muted">Loading…</p>
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
