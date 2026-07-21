import { endOfDay, startOfDay } from "date-fns";

const GIS_SRC = "https://accounts.google.com/gsi/client";
const SCOPE = "https://www.googleapis.com/auth/calendar.readonly";

let gisPromise: Promise<void> | null = null;

/** Load the Google Identity Services script once, on demand. */
function loadGis(): Promise<void> {
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = GIS_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google sign-in script"));
    document.head.appendChild(s);
  });
  return gisPromise;
}

export interface AccessToken {
  access_token: string;
  /** Epoch ms when the token stops being usable. */
  expiresAt: number;
}

/** Run the OAuth token flow and resolve with a short-lived access token. */
export async function requestAccessToken(clientId: string): Promise<AccessToken> {
  await loadGis();
  return new Promise((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPE,
      callback: (resp) => {
        if (resp.error) reject(new Error(resp.error_description || resp.error));
        else
          resolve({
            access_token: resp.access_token,
            expiresAt: Date.now() + resp.expires_in * 1000,
          });
      },
    });
    client.requestAccessToken({ prompt: "" });
  });
}

// Access tokens last ~1 hour. Cache one so page reloads reuse it instead of
// re-triggering the OAuth popup every time. (Personal app: a short-lived token
// in localStorage is an acceptable trade-off for the convenience.)
const TOKEN_KEY = "gcal-token";

export function loadStoredToken(): AccessToken | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    if (!raw) return null;
    const t = JSON.parse(raw) as AccessToken;
    // Keep a 60s safety margin so we don't use a token about to expire.
    return t.expiresAt - Date.now() > 60_000 ? t : null;
  } catch {
    return null;
  }
}

export const saveStoredToken = (t: AccessToken): void =>
  localStorage.setItem(TOKEN_KEY, JSON.stringify(t));

export const clearStoredToken = (): void => localStorage.removeItem(TOKEN_KEY);

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

/** Fetch today's events from the user's primary calendar, sorted by start. */
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
  if (!res.ok) {
    const err = new Error(`Calendar API error ${res.status}`);
    (err as Error & { status?: number }).status = res.status;
    throw err;
  }

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
