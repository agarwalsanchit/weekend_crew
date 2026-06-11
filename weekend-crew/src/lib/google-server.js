// Server-only helpers for Google Calendar sync.
// Uses GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / SUPABASE_SERVICE_ROLE_KEY env vars.
import { createClient } from "@supabase/supabase-js";

// Supabase client that bypasses RLS — server only, never import in client code.
export function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

// Exchange a stored refresh token for a short-lived access token.
export async function getAccessToken(refreshToken) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.access_token || null;
}

// Insert an all-day event into the user's primary calendar.
export async function insertAllDayEvent(accessToken, { title, description, startISO, endISOExclusive }) {
  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      summary: `🎉 ${title}`,
      description: description || "Locked in with Weekend Crew",
      start: { date: startISO },
      end: { date: endISOExclusive },
    }),
  });
  return res.ok;
}

// Query busy intervals between two ISO timestamps. Returns [{start, end}] or null on failure.
export async function queryFreeBusy(accessToken, timeMin, timeMax) {
  const res = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ timeMin, timeMax, items: [{ id: "primary" }] }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json.calendars?.primary?.busy || [];
}

// Hours of overlap between busy intervals and a [start, end] window.
export function busyHoursIn(busy, windowStart, windowEnd) {
  let ms = 0;
  for (const b of busy) {
    const s = Math.max(new Date(b.start).getTime(), windowStart.getTime());
    const e = Math.min(new Date(b.end).getTime(), windowEnd.getTime());
    if (e > s) ms += e - s;
  }
  return ms / 3600000;
}
