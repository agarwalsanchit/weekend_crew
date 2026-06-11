// Plain Google sign-in — identity only (name/email), no extra permission
// screens. Calendar access is requested separately via enableCalendarSync.
export function signInWithGoogle(supabase, next = "/app") {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
}

// Opt-in: re-run Google auth WITH Calendar permissions so frozen plans land
// on the user's calendar automatically and availability auto-fills.
export function enableCalendarSync(supabase, next = "/app") {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      scopes: "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.freebusy",
      queryParams: { access_type: "offline", prompt: "consent" },
    },
  });
}

export const EMOJIS = ["🦊", "🐼", "🐯", "🐸", "🐰", "🐙", "🦁", "🐨", "🦉", "🐢", "🐶", "🐱", "🦄", "🐳", "🦋", "🌵", "🍕", "🌮", "⚽️", "🎸", "🚀", "🌈", "🔥", "✨"];
export const COLORS = ["bg-orange-400", "bg-sky-400", "bg-amber-400", "bg-green-400", "bg-purple-400", "bg-teal-400", "bg-rose-400", "bg-indigo-400"];

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
