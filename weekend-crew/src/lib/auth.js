// Google sign-in with Calendar write scope so frozen plans can be added
// to each member's own Google Calendar from the browser.
export function signInWithGoogle(supabase, next = "/app") {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      scopes: "https://www.googleapis.com/auth/calendar.events",
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });
}

const EMOJIS = ["🦊", "🐼", "🐯", "🐸", "🐰", "🐙", "🦁", "🐨", "🦉", "🐢"];
const COLORS = ["bg-orange-400", "bg-sky-400", "bg-amber-400", "bg-green-400", "bg-purple-400", "bg-teal-400", "bg-rose-400", "bg-indigo-400"];

// Ensure a profile row exists for the signed-in user; returns the profile.
export async function ensureProfile(supabase, user) {
  const { data: existing } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (existing) return existing;
  const profile = {
    id: user.id,
    name: user.user_metadata?.full_name?.split(" ")[0] || user.email.split("@")[0],
    emoji: EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  };
  await supabase.from("profiles").upsert(profile);
  return profile;
}

// Add a frozen plan to the user's Google Calendar as an all-day event.
export async function addToGoogleCalendar(supabase, { title, description, startISO, endISOExclusive }) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.provider_token;
  if (!token) return { ok: false, reason: "no_token" };
  const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      summary: `🎉 ${title}`,
      description: description || "Locked in with Weekend Crew",
      start: { date: startISO },
      end: { date: endISOExclusive },
    }),
  });
  return { ok: res.ok, reason: res.ok ? null : "api_error" };
}
