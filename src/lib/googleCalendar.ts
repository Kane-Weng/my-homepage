import { endOfDay, startOfDay } from "date-fns";

export interface CalendarEvent {
  id: string;
  summary: string;
  start: Date;
  allDay: boolean;
  htmlLink: string;
}

interface RawEvent {
  id: string;
  summary?: string;
  htmlLink: string;
  start: { dateTime?: string; date?: string };
}

/** Fetch today's events from the user's primary calendar, sorted by start.
 *  `token` is a Google access token (obtained via the Supabase Edge Function). */
export async function fetchTodayEvents(token: string): Promise<CalendarEvent[]> {
  const now = new Date();
  const params = new URLSearchParams({
    timeMin: startOfDay(now).toISOString(),
    timeMax: endOfDay(now).toISOString(),
    singleEvents: "true",
    orderBy: "startTime",
    maxResults: "25",
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`Calendar API error ${res.status}`);

  const data: { items?: RawEvent[] } = await res.json();
  return (data.items ?? []).map((e) => {
    const allDay = !e.start.dateTime;
    return {
      id: e.id,
      summary: e.summary ?? "(no title)",
      start: new Date(e.start.dateTime ?? `${e.start.date}T00:00:00`),
      allDay,
      htmlLink: e.htmlLink,
    };
  });
}
